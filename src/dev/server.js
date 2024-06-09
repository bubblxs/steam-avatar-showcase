const express = require("express");
const app = express();

app.use("/static", express.static(__dirname + '/images'));
app.set("views", "./src/dev/views");
app.set("view engine", "pug");

app.get("/:id", (req, res) => {
    res.render("profile", {
        steamid: req.params.id,
    });
});

app.get("/:id/friends", (req, res) => {
    const steamid = req.params.id;
    let numFriends = parseInt(req.query.nf) || 0;
    let friends = [];

    while (numFriends > 0) {
        friends.push(Math.round(Math.random() * (numFriends-- * 54321)));
    }

    res.render("friends", {
        steamid,
        title: `${steamid}'s friends`,
        numFriends: friends.length,
        friends
    });
});

app.get("/error", (req, res) => {
    res.render("error");
});

app.all("*", (req, res) => {
    res.redirect("/1");
});

app.listen(4242, () => console.log(`running on ${4242}`));