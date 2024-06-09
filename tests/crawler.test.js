/* can we pretend that these tests are somehow actually useful? please? */

const { it } = require("node:test");
const assert = require("assert");
const Crawler = require("../src/Crawler");

const LOCAL_HOST = "http://localhost:4242";

it("should return an array of 10 steamids", async () => {
    const crawl = new Crawler(`${LOCAL_HOST}/1/friends?nf=10`);
    await crawl.init();
    const friends = await crawl.fetchFriends();
    await crawl.close();

    assert.strictEqual(friends.length, 10);
});

it("should return an empty array", async () => {
    const crawl = new Crawler(`${LOCAL_HOST}/1/friends`);
    await crawl.init();
    const friends = await crawl.fetchFriends();
    await crawl.close();

    assert.strictEqual(friends.length, 0);
});

it("shoutd return an empty array", async () => {
    const crawl = new Crawler(`${LOCAL_HOST}/error`);
    await crawl.init();
    const friends = await crawl.fetchFriends();
    await crawl.close();

    assert.strictEqual(friends.length, 0);
});

it("sshould return the profile avatar", async () => {
    const crawl = new Crawler(`${LOCAL_HOST}/1`);
    await crawl.init();
    const profile = await crawl.fetchAvatar();
    await crawl.close();

    assert.strictEqual(profile, `${LOCAL_HOST}/static/profile_full.jpg`);
});

it("should return the profile steamid", async () => {
    const crawl = new Crawler(`${LOCAL_HOST}/1`);
    await crawl.init();
    const content = await crawl.fetchHTML(`${LOCAL_HOST}/i`);
    const sid = await crawl.extractSteamId(content);
    await crawl.close();

    assert.strictEqual(sid, "76560000000000000");
});

it("should throw an error", async () => {
    const crawl = new Crawler(`${LOCAL_HOST}/error`);
    await crawl.init();

    assert.rejects(async () => await crawl.fetchAvatar());
});
