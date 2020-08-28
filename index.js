const cfg = require('./config.json');

const express = require('express');
const session = require('express-session');
const sessionStore = require('express-session-json')(session);
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mtime = require('moment');
const { VK, Keyboard } = require('vk-io');
const logger = require('./modules/logger');
const ngrok = require('ngrok');
const utils = require('./modules/utils');

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const vk = new VK({token: cfg.group.token});


mtime.locale('ru');
ngrok.authtoken(cfg.server.ngrok_token);
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser(cfg.server.secret_key));
app.use(session({
    secret: cfg.server.secret_key,
    saveUninitialized: false,
    resave: false,
    store: new sessionStore({
        filename: 'sessions.json',
        path: './dbs/server-db/'
    }),
    cookie: {
        httpOnly: true,
        expires: 604800000
    }
}));
app.use((req, res) => {
    res.send(`DEVELOPING`);
});

module.exports = {
    app, http, io, mtime, cfg, vk, logger, ngrok, utils, Keyboard
}

// VK
require('./vk/vk');