const { createReadStream } = require("fs");
const client = require("tumblr.js");

module.exports = class Tumblr {
    #_client;
    #_handle;
    #_blogName;

    constructor(config) {
        this.#_client = client.createClient(config);
    }

    async init() {
        const userInfo = await this.#_getClient().userInfo();
        const blogName = userInfo.user.blogs[0].name;
        const handle = userInfo.user.name;

        this.#_setBlogName(blogName);
        this.#_setHandle(handle);
    }

    async post(img, altText = "") {
        const result = await this.#_getClient().createPost(this.getBlogName(), {
            content: [
                {
                    type: "image",
                    media: createReadStream(img),
                    alt_text: altText,
                }
            ]
        });

        return result.display_text;
    }

    #_setBlogName(blogName) {
        this.#_blogName = blogName;
    }

    #_setHandle(handle) {
        this.#_handle = handle;
    }

    #_getClient() {
        if (this.#_client) {
            return this.#_client;
        }

        throw new Error("tumblr.js was not initialized");
    }

    getBlogName() {
        return this.#_blogName;
    }

    getHandle() {
        return this.#_handle;
    }
}