const { vk, cfg, logger } = require('../vk');
const { VK, Keyboard } = require('vk-io');
const utils = require('../../modules/utils');
const us = new VK({token: cfg.users.creator.token});
const domens = require('../../dbs/vk-db/domens.json');
const fs = require('fs');
const time = require('moment');
const countdown = require('countdown');

us.updates.start().then((data) => {
    logger.log(`Creator Started`, 'vk');
}).catch((e) => {
    logger.error(`Creator Not Started >> ${e.message}`, 'vk');
});

us.updates.on('message', (ctx, next) => {
    if(cfg.users.creator.peerId != ctx.peerId){return 0;}
    if(!ctx.isUser){return 0;}
    if(/(http(s)?:\/\/)?(\.[com|cc|ru|ly|ua|me])/gim.test(ctx.text)){
        for(let i = 0; i < domens.length; i++){
            if(new RegExp(domens[i]).test(ctx.text)){
                return next();
            }
        }
        return us.api.messages.delete({
            message_ids: ctx.id,
            delete_for_all: true
        }).then(() => {
            vk.api.messages.send({
                peer_id: cfg.group.peerId,
                message: '🌌 Космос защита'
            })
        }).catch((e) => {
            return logger.error(`[on message] [link] >> ${e.message}`);
        });
    }
    return next();
});

us.updates.hear(/@(all|online|онлайн|все)/gim, (ctx) => {
    return ctx.deleteMessage(ctx.id).then(() => {
        vk.api.messages.send({
            peer_id: cfg.group.peerId,
            message: '🌌 Используйте: /ad | /rob | /war'
        });
    });
});

us.updates.hear(/\/gcheck/i, async (ctx) => {
    if(!utils.isAdmin(ctx.senderId)){return ctx.send(`❗ Нет доступа!`);};
    let group = await vk.api.groups.getMembers({
        group_id: cfg.group.id,
        count: 1000
    }).catch((e) => {
        return logger.error(`[/gcheck] [getMembers] >> ${e.message}`, 'vk');
    });
    let chat = await vk.api.messages.getConversationMembers({
        peer_id: cfg.group.peerId
    }).catch((e) => {
        return logger.error(`[/gcheck] [getConvMembers] >> ${e.message}`);
    });
    let message = `⚙ Кикнуто из группы: `;
    let all = 0;
    for(let i = 0; i < group.items.length; i++){
        let user = utils.findOBJ(chat.profiles, 'id', group.items[i]);
        if(!user){
            all++;
            logger.log(`Kick from group >> ${group.items[i]}`, 'vk');
            us.api.groups.ban({
                group_id: cfg.group.id,
                owner_id: group.items[i],
                comment: `Ты не в беседе клана! Пиши: vk.com/id171745503`,
                comment_visible: true
            });
        }
    }
    message += `${all}`;
    return vk.api.messages.send({message: message, peer_id: cfg.group.peerId});
});

vk.updates.hear(/\/postpromo( )?(1kkk(_|-)[\w\W]+)?/i, async (ctx) => {
    if(!utils.isAdmin(ctx.senderId)){return ctx.send(`❗ Нет доступа!`);};
    if(!ctx.$match[2]){
        return ctx.send(`❗ Использовать: /postpromo [Промокод]`);
    } else {
        let promos = JSON.parse(fs.readFileSync('./dbs/vk-db/promocodes.json'));
        if(!utils.findOBJ(promos, 'text', ctx.$match[2])){
            let user = await vk.api.users.get({user_ids: ctx.senderId});
            promos.push({
                text: ctx.$match[2],
                admin: `${user[0].first_name} ${user[0].last_name}`,
                date: time().format('HH:mm:ss, DD.MM.YYYY')
            });
            fs.writeFileSync('./dbs/vk-db/promocodes.json', JSON.stringify(promos, '', 4));
            us.api.call('wall.post', {
                message: 'Промокод!\nСмотрим комменты!',
                poster_bkg_id: randomInteger(1, 30),
                owner_id: -cfg.group.id
            }).then((data) => {
                vk.api.wall.createComment({
                    owner_id: -cfg.group.id,
                    post_id: data.post_id,
                    message: ctx.$match[2]
                });
                return vk.api.messages.send({
                    peer_id: cfg.group.peerId,
                    message: `Новый промокод: ${ctx.$match[2]}`, 
                    keyboard: Keyboard.keyboard([Keyboard.textButton({label: `Промо ${ctx.$match[2]}`, color: "positive"})]).inline(true)
                });
            }).catch((e) => {
                return logger.error(`Repost promocode >> ERROR >> ${e.message}`, 'vk');
            });
            return ctx.send('🌠 Пост сделан!');
        } else {
            return ctx.send(`❗ Данный промокод уже запостили!`);
        }
    }
});

us.updates.hear(/\/killsite/i, (ctx) => {
    if(ctx.senderId != 171745503){return 1;}
    fs.writeFileSync('./dbs/server-db/ngrok.site', 'Панель не запущена!');
    return ngrok.kill().then(() => {
        return vk.api.messages.send({
            peer_id: cfg.group.peerId,
            message: 'Панель выключена!'
        });
    });
});

us.updates.hear(/\/startsite/i, (ctx) => {
    if(ctx.senderId != 171745503){return 1;}
    ngrok.connect({
        proto: 'http',
        addr: cfg.server.port,
        region: 'eu'
    }).then((data) => {
        fs.writeFileSync('./dbs/server-db/ngrok.site', data);
        return vk.api.messages.send({
            peer_id: cfg.group.peerId,
            message: 'Панель включена!'
        })
    }).catch((e) => {
        fs.writeFileSync('./dbs/server-db/ngrok.site', 'Панель не запущена!');
        return vk.api.messages.send({
            peer_id: cfg.group.peerId,
            message: 'Ошибка запуска панели!'
        })
    });
});

function randomInteger(min, max) {
    // случайное число от min до (max+1)
    let rand = min + Math.random() * (max + 1 - min);
    return Math.floor(rand);
}

setInterval(()=>{
	let downTime = countdown(new Date('2019/10/08'), 'now');
	let status = `❤ Начало: 08.10.2019 | ⌚ Прошло: ${downTime.months} мес. ${downTime.days} дн. ${downTime.hours} ч. | 🚫 Конец: Никогда`;
	us.api.status.set({
		text: status
	}).catch((e)=>{
		logger.warn(`Ошибка установки статуса: ${e.message}`, 'vk');
	});
}, 1000 * 60 * 10);

