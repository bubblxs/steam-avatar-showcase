const cheerio = require("cheerio");

const { isDevEnv } = require("./utils");

const STEAM_URL = {
    community: "https://steamcommunity.com",
    store: "https://store.steampowered.com",
};

module.exports = class Scraper {
    #_profileUrl;

    constructor(profileUrl) {
        this.#_profileUrl = this.#_parseProfileUrl(profileUrl);
    }

    getProfileUrl() {
        return this.#_profileUrl;
    }

    async fetchFriends() {
        const url = new URL(this.getProfileUrl());

        if (!isDevEnv()) {
            url.pathname += "/friends";
        }

        const friends = [];
        const res = await (await fetch(url)).text();
        const $ = cheerio.load(res);
        const elements = $(".selectable");

        elements.each((_, el) => {
            friends.push(el.attribs['data-steamid']);
        });

        return friends;
    }

    async fetchAvatar() {
        const url = new URL(this.getProfileUrl());
        const avatars = [];
        const res = await (await fetch(url)).text();
        const $ = cheerio.load(res);

        $("div.playerAvatarAutoSizeInner").find("img").each((_, el) => {
            avatars.push(el.attribs.src)
        });

        return avatars.at(-1);
    }

    async fetchSteamId() {
        const htmlContent = await (await fetch(this.getProfileUrl())).text();
        const blankSpacesRegex = new RegExp(/\s*/g);
        const g_rgProfileDataRegex = new RegExp(/(g_rgProfileData={(.*?)})/gim);
        const htmlTagsRegex = new RegExp(/<(\/*?)(?!(em|p|br\s*\/|strong))\w+?.+?>/gim);
        const g_rgProfileData = JSON.parse(htmlContent.replace(htmlTagsRegex, "")
            .replace(blankSpacesRegex, "")
            .match(g_rgProfileDataRegex)[0]
            .split("=")[1]
            .replace(";", "")
        );

        if (!g_rgProfileData.steamid) {
            throw new Error("steamid not found");
        }

        return g_rgProfileData.steamid;
    }

    #_parseProfileUrl(sid) {
        if (isDevEnv()) {
            return new URL(sid);
        }

        if (sid.length < 3) {
            throw new Error("invalid steam id");
        }

        sid = sid.trim();

        const steamUrl = new URL(STEAM_URL.community);
        const regularCharsRegex = new RegExp(/^[a-zA-Z0-9]*$/gim);
        const steamVanityUrlRegex = new RegExp(/^((http|https):\/\/)?(steamcommunity.com\/)(id)(\/)(.*?)(\/)?$/gim);
        const steamU64UrlRegex = new RegExp(/^((http|https):\/\/)?(steamcommunity.com\/)(profiles)(\/)\d{17}(\/)?$/gim);
        const steamUrlRegex = new RegExp(/^((http|https):\/\/)?(steamcommunity.com\/)(id|profiles)(\/)(.*?)|(\/)?$/gim);
        const steamU64Regex = new RegExp(/^7656\d{13}$/gim);

        if (steamU64UrlRegex.test(sid) || steamU64Regex.test(sid)) {
            steamUrl.pathname = `profiles/${sid.replace(steamUrlRegex, "").split("/")[0]}`;

        } else if (steamVanityUrlRegex.test(sid)) {
            steamUrl.pathname = `id/${sid.replace(steamUrlRegex, "").split("/")[0]}`;

        } else if (regularCharsRegex.test(sid)) {
            steamUrl.pathname = `id/${sid}`;

        } else {
            throw new Error("invalid steam id");
        }

        return steamUrl;
    }
}