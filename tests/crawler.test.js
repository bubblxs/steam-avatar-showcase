/* can we pretend that these tests are somehow actually useful? please? */

const { it } = require("node:test");
const assert = require("node:assert");

const Scraper = require("../src/Scraper");

const LOCAL_HOST = "http://localhost:4242";
const url = new URL(LOCAL_HOST);

it("should return an array of 10 steamids", async () => {
    url.pathname = "profiles/1/friends";
    url.searchParams.append("nf", 10);

    const scrpr = new Scraper(url);
    const friends = await scrpr.fetchFriends();

    assert.strictEqual(friends.length, 10);

    url.searchParams.delete("nf");
});
it("should return an empty array", async () => {
    url.pathname = "profiles/1/friends";

    const scrpr = new Scraper(url);
    const friends = await scrpr.fetchFriends();

    assert.strictEqual(friends.length, 0);
});

it("shoutd return an empty array", async () => {
    url.pathname = "error";

    const scrp = new Scraper(url);
    const friends = await scrp.fetchFriends();

    assert.strictEqual(friends.length, 0);
});

it("should return ONE (1) avatar", async () => {
    url.pathname = "profiles/1";

    const scrpr = new Scraper(url);
    const avatar = await scrpr.fetchAvatar();

    assert.strictEqual(avatar, `${LOCAL_HOST}/static/profile_full.jpg`);
});

it("should return the profile steamid", async () => {
    url.pathname = "profiles/1";

    const scrpr = new Scraper(url);
    const sid = await scrpr.fetchSteamId();

    assert.strictEqual(sid, "76560000000000000");
});

it("should return nothing", async () => {
    url.pathname = "error";

    const scrpr = new Scraper(url);
    const avatar = await scrpr.fetchAvatar();

    assert.strictEqual(avatar, undefined);
});