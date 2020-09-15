const cfg = require('./config.json');

const mtime = require('moment');
const { VK, Keyboard } = require('vk-io');
const logger = require('./modules/logger');
const utils = require('./modules/utils');

const vk = new VK({token: cfg.group.token});

mtime.locale('ru');

module.exports = {
    mtime, cfg, vk, logger, utils, Keyboard
}

// VK
require('./vk/vk');