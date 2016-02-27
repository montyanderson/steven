const path = require("path");
const express = require("express");
const redis = require("redis");
const helmet = require("helmet");
const argv = require("yargs").argv;

const app = express();
const db = redis.createClient();

app.use(helmet());
app.use(express.static(path.join(__dirname, "public")));

const messages = "chat-messages";

const alpha = "abcdefghijklmnopqrstuvwxyz0123456789 ".split("");

app.get("/push", function(req, res, next) {
    if(!req.query.message) return next();

    const message = req.query.message.trim().toLowerCase().split("").slice(0, 100).map(function(char) {
        if(alpha.indexOf(char) != -1) {
            return char;
        } else {
            return "";
        }
    }).join("");

    if(!message) return next();

    db.multi()
    .lpush(messages, message)
    .ltrim(messages, 0, 20)
    .exec(function(err) {
        next();
    });
}, function(req, res, next) {
    res.end();
});

app.get("/messages", function(req, res) {
    db.lrange(messages, 0, -1, function(err, messages) {
        if(err) return res.end();
        messages.reverse();
        res.end(JSON.stringify(messages));
    });
});

app.listen(argv.port || 8080, argv.ip || "127.0.0.1");
