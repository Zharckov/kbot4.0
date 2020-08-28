const { vk, cfg, logger } = require('../vk');
const { VK } = require('vk-io');
const utils = require('../../modules/utils');
const us = new VK({token: cfg.users.premium.token});

us.updates.start().then(() => {
    logger.log(`Premium Started`, 'vk');
}).catch((e)=>{
    logger.error(`Premium Not Started >> ${e.message}`, 'vk');
});

us.updates.on('message', (ctx, next) => {
    if(cfg.users.premium.peerId != ctx.peerId){return 0;}
    if(!ctx.isUser){return 0;}
    return next();
});

us.updates.hear(/\/get( )?([\w\W]+)?/i, async (ctx) => {
    if(!utils.isAdmin(ctx.senderId)){return ctx.send(`❗ Нет доступа!`)}
    if(ctx.$match[2]){
        return ctx.send(`/гет ${ctx.$match[2]}`);
    } else {
        return vk.api.messages.send({peer_id: cfg.group.peerId, message: '❗ Использовать: /get [ник|ид|vk]!'})
    }
});

us.updates.hear(/\/kget( )?([\w\W]+)?/i, async (ctx) => {
    if(!utils.isAdmin(ctx.senderId)){return ctx.send(`❗ Нет доступа!`)}
    if(ctx.$match[2]){
        return ctx.send(`/кгет ${ctx.$match[2]}`);
    } else {
        return vk.api.messages.send({peer_id: cfg.group.peerId, message: '❗ Использовать: /kget [ник|ид|vk]!'})
    }
});