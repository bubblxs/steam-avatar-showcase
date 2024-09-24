const pptr = require("puppeteer");

const { isDevEnv } = require("./utils");

const URL_STEAM = {
    community: "https://steamcommunity.com",
    store: "https://store.steampowered.com",
    CDN: {
        akamai: "",
        cloudflare: ""
    }
};

module.exports = class Scrapper {
    #_browser;
    #_profileUrl;

    /**
     * 
     * @param {string} profileUrl must be a valid steamid, vanity or profile URL
     */
    constructor(profileUrl) {
        this.#_profileUrl = this.parseProfileUrl(profileUrl);
    }

    async init() {
        this.#_browser = await pptr.launch({ headless: true });
    }

    getProfileUrl() {
        return this.#_profileUrl;
    }

    /**
     * @returns {pptr.Browser}
     */
    #_getBrowser() {
        if (this.#_browser instanceof pptr.Browser) {
            return this.#_browser;
        }

        throw new Error("pptr was not initialized");
    }

    async close() {
        await this.#_getBrowser().close();
    }

    async fetchHTML(url) {
        const browser = this.#_getBrowser();
        const page = await browser.newPage();

        await page.goto(url, { waitUntil: "domcontentloaded" });

        const content = await page.content();

        return content;
    }

    async fetchFriends() {
        const url = isDevEnv() ? this.getProfileUrl() : `${this.getProfileUrl()}/friends`;
        const browser = this.#_getBrowser();
        const page = await browser.newPage();

        await page.goto(url, { waitUntil: "domcontentloaded" });

        const friends = await page.evaluate(() => {
            let friendList = [];
            const elements = document.getElementsByClassName("selectable");

            if (elements === null || elements === undefined || elements.length === 0) {
                return friendList;
            }

            for (let el of elements) {
                friendList.push(el.getAttribute("data-steamid"));
            }

            return friendList;
        });

        return friends;
    }

    async fetchAvatar() {
        const browser = this.#_getBrowser();
        const page = await browser.newPage();

        await page.goto(this.getProfileUrl());

        const src = await page.evaluate(() => {
            const elements = document.getElementsByClassName("playerAvatarAutoSizeInner");

            if (elements === null || elements === undefined || elements.length === 0) {
                throw new Error(`couldn't get the url of the avatar.`);
            }

            const srcAttr = elements.item(elements.length > 1 ? 1 : 0).lastElementChild.getAttribute("src");

            return srcAttr;
        });

        return src;
    }

    extractSteamId(htmlContent) {
        if (typeof htmlContent !== "string") {
            htmlContent = toString(htmlContent);
        }

        const blankSpacesRegex = new RegExp(/\s*/g);
        const grgProfileDataRegex = new RegExp(/(g_rgProfileData={(.*?)})/gim);
        const htmlTagsRegex = new RegExp(/<(\/*?)(?!(em|p|br\s*\/|strong))\w+?.+?>/gim);
        const g_rgProfileData = JSON.parse(htmlContent.replace(htmlTagsRegex, "")
            .replace(blankSpacesRegex, "")
            .match(grgProfileDataRegex)[0]
            .split("=")[1]
            .replace(";", "")
        );

        if (!g_rgProfileData.steamid) {
            throw new Error("steamid not found");
        }

        return g_rgProfileData.steamid;
    }

    /**
     * @param {string} sid steamid
     */
    parseProfileUrl(sid) {
        // https://developer.valvesoftware.com/wiki/SteamID
        // I'll do that later, but for now I'll continue with my lazy and poorly implemented regex.

        if (isDevEnv()) {
            return sid;
        }

        const steamUrlRegex = new RegExp(/((http|https):\/\/)?(steamcommunity.com\/)(id|profile)\//);
        const steamU64Regex = new RegExp(/\b7656\d{13}\b/g);
        const steamId2Regex = new RegExp(/STEAM_\d:\d:\d*/);
        const steamId3Regex = new RegExp(/\[U:\d:\d*\]/);
        const steamid = sid.replace(steamUrlRegex, "").split("/")[0];
        const vanitySteamUrl = `${URL_STEAM.community}/id`;
        const profileSteamUrl = `${URL_STEAM.community}/profiles`;

        if (!steamid || steamid === "" || steamid.length < 2) {
            throw new Error("invalid steamid");
        }

        if (steamU64Regex.test(steamid) && steamid.length === 18 || steamId2Regex.test(steamid) || steamId3Regex.test(steamid)) {
            return `${profileSteamUrl}/${steamid}`;

        } else {
            return `${vanitySteamUrl}/${steamid}`;

        }
    }
}