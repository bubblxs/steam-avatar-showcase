require("dotenv").config();

const assert = require("node:assert");
const { join } = require("node:path");
const schedule = require("node-schedule");
const { Readable } = require("node:stream");
const { randomBytes } = require("node:crypto");
const { createWriteStream, mkdirSync, existsSync } = require("node:fs");

const Tumblr = require("./Tumblr");
const Scrapper = require("./Scrapper");
const Database = require("./Database");
const { isDevEnv, log } = require("./utils");

const LOCAL_HOST = "http://localhost:4242";
const IMG_DIR = join(__dirname, "../imgs/");
const db = new Database({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DATABASE,
    password: process.env.POSTGRES_PSWD,
    port: process.env.POSTGRES_PORT,
});
const tumblr = new Tumblr({
    consumer_key: process.env.TUMBLR_CONSUMER_KEY,
    consumer_secret: process.env.TUMBLR_CONSUMER_SECRET,
    token: process.env.TUMBLR_TOKEN,
    token_secret: process.env.TUMBLR_TOKEN_SECRET
});
const queue = [];

const init = async () => {
    const steamIds = process.argv.slice(2);

    await db.init();
    await tumblr.init();

    if (!existsSync(IMG_DIR)) {
        mkdirSync(IMG_DIR);
    }

    if (isDevEnv()) {
        queue.push(LOCAL_HOST);
    }

    queue.push(...steamIds);

    assert(queue.length > 0, "queue is empty. make sure you pass at least one steamid through args.");

    if (!isDevEnv()) {
        /* 30 min */
        schedule.scheduleJob("*/30 * * * *", async () => {
            await run();
        });

        log("this application is scheduled to run every 30 minutes", "Log");
    }
}

const downloadImage = async (filename, saveTo, url) => {
    const path = join(saveTo, filename);
    const ws = createWriteStream(path);
    const res = await fetch(url);
    const data = res.body;

    Readable.fromWeb(data).pipe(ws);

    return path;
}

const crawl = async (sid, friends = true) => {
    const crawler = new Scrapper(sid);

    await crawler.init();

    const avatarUrl = await crawler.fetchAvatar();
    const content = await crawler.fetchHTML(crawler.getProfileUrl());
    const steamId = crawler.extractSteamId(content);
    let friendList = [];

    if (friends) {
        friendList = await crawler.fetchFriends();
    }

    await crawler.close();

    return {
        steamId,
        avatarUrl,
        friends: friendList
    };
}

const run = async () => {
    assert(queue.length > 0, "queue is empty");

    const sid = queue.at(0);
    const { avatarUrl, steamId, friends } = await crawl(sid);
    const { filename, ext } = ((url) => {
        return {
            filename: randomBytes(8).toString("hex"),
            ext: url.split(".").at(-1).replace("/", "")
        };
    })(avatarUrl);
    const filePath = await downloadImage(`${filename}.${ext}`, IMG_DIR, avatarUrl);

    await db.query(`INSERT INTO FileExtensions (file_ext) VALUES ($1) ON CONFLICT DO NOTHING;`,
        [ext]
    );

    await db.query(
        `INSERT INTO Files (file_name, fk_file_ext_id) 
        VALUES ($1, (SELECT FILE_EXT_ID FROM FileExtensions WHERE FILE_EXT = $2 LIMIT 1));`,
        [filename, ext]
    );

    await db.query(`INSERT INTO Users (steam_id, fk_file_id) 
        VALUES ($1, (SELECT file_id FROM Files WHERE FILE_NAME = $2 LIMIT 1)) ON CONFLICT DO NOTHING;`,
        [steamId, filename]
    );

    const res = isDevEnv() ? "we are just doing some tests here, mate. :3" : await tumblr.post(filePath);

    await db.query(`INSERT INTO Posts (created_at, fk_file_id, fk_user_id) 
        VALUES ($1, (SELECT FILE_ID FROM Files WHERE FILE_NAME = $2 LIMIT 1), 
        (SELECT USER_ID FROM Users WHERE STEAM_ID = $3 LIMIT 1));`,
        [Date.now(), filename, steamId]
    );

    log(`${filename}.${ext} ${res}`, "Success");

    queue.push(...friends);
    queue.shift();
};

const main = async () => {
    await init();
    await run();
};

main();