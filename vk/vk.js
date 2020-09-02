const { vk, logger, cfg, utils, Keyboard, ngrok } = require('../index');
const keys = require('../modules/keyboard');
const fs = require('fs');
const time = require('moment');

vk.updates.on('message', async (ctx, next)=>{
    try{
        if(ctx.peerType == 'chat'){
            if(ctx.peerId != cfg.group.peerId){
                let ad = JSON.parse(fs.readFileSync('./dbs/vk-db/clan-settings.json')).textAd;
                let { link } = JSON.parse(fs.readFileSync('./dbs/vk-db/clan-settings.json'));
                return ctx.send(ad + '\n@all @all @all', {
                    keyboard: Keyboard.keyboard([
                        [Keyboard.urlButton({url: link, label: 'Перейти в беседу'}),Keyboard.urlButton({url: link, label: 'Перейти в беседу'})],
                        [Keyboard.urlButton({url: link, label: 'Перейти в беседу'}),Keyboard.urlButton({url: link, label: 'Перейти в беседу'})],
                        [Keyboard.urlButton({url: link, label: 'Перейти в беседу'}),Keyboard.urlButton({url: link, label: 'Перейти в беседу'})],
                        [Keyboard.urlButton({url: link, label: 'Перейти в беседу'}),Keyboard.urlButton({url: link, label: 'Перейти в беседу'})]
                    ])
                });
            } 
        }
        if(ctx.senderType == 'user'){
            ctx.u = await vk.api.users.get({user_ids: ctx.senderId});
            ctx.u = ctx.u[0];
            logger.debug(`${ctx.u.first_name} ${ctx.u.last_name}: ${ctx.text}`);
            if(ctx.peerType == "user"){
                let chat = await vk.api.messages.getConversationMembers({peer_id: cfg.group.peerId});
                let userInChat = utils.findOBJ(chat.profiles, 'id', ctx.senderId);
                let { link } = JSON.parse(fs.readFileSync('./dbs/vk-db/clan-settings.json'));
                if(!userInChat){
                    ctx.send(`Команды доступны только для участников клановой беседы!`, {
                        keyboard: Keyboard.keyboard([
                            Keyboard.urlButton({url: link, label: '🌌 Вступить'})
                        ]).inline(true)
                    });
                    return 1;
                } 
                if(ctx.hasForwards){
                        if(/([\w\W]+), страница [0-9\/?]+:/gim.test(ctx.forwards[1].text)){
                            return ctx.send(countPetPower(ctx));
                        }
                } else {
                    return next();
                }
            }
            return next();
        } 
        if(ctx.senderType == 'group'){
            if(cfg.group.lesyaId == ctx.senderId){
                return lesyaHandler(ctx);
            }
        }
    } catch(e){
        return logger.error(`Ошибка [on('message')]: ${e.message}`);
    }
});

vk.updates.on('chat_invite_user_by_link', async (ctx, next) => {
    // SenderID
    if(ctx.senderId < 0){
        ctx.send(`🌌 Космос защита!`);
        return ctx.kickUser(ctx.senderId);
    }
    let new_users = JSON.parse(fs.readFileSync('./dbs/vk-db/new-users.json'));
    let user = await vk.api.users.get({user_ids: ctx.senderId});
    new_users.push({
        id: ctx.senderId,
        name: `${user[0].first_name} ${user[0].last_name}`,
        kickTime: new Date().getTime() + 300000 /* 5 Минут (1000*60*5)*/
    });
    fs.writeFileSync('./dbs/vk-db/new-users.json', JSON.stringify(new_users, '', 4));
    ctx.send(`🌌 [id${user[0].id}|${user[0].first_name} ${user[0].last_name}], у вас есть 5 минут, чтобы войти в клан!\n❗ Или вы будете кикнуты!`);
    return next();
});

vk.updates.on('chat_invite_user', async (ctx, next) => {
    // EventMemberId
    if(ctx.eventMemberId < 0){
        ctx.send(`🌌 Космос защита!`);
        return ctx.kickUser(ctx.eventMemberId);
    }
    let new_users = JSON.parse(fs.readFileSync('./dbs/vk-db/new-users.json'));
    let user = await vk.api.users.get({user_ids: ctx.eventMemberId});
    new_users.push({
        id: ctx.eventMemberId,
        name: `${user[0].first_name} ${user[0].last_name}`,
        kickTime: new Date().getTime() + 300000 /* 5 Минут (1000*60*5)*/ 
    });
    fs.writeFileSync('./dbs/vk-db/new-users.json', JSON.stringify(new_users, '', 4));
    ctx.send(`🌌 [id${user[0].id}|${user[0].first_name} ${user[0].last_name}], у вас есть 5 минут, чтобы войти в клан!\n❗ Или вы будете кикнуты!`);
    return next();
});

vk.updates.on('chat_kick_user', async (ctx, next) => {
    return next();
});

module.exports = { vk, logger, cfg, utils, Keyboard, ngrok, keys }

// ========= CMD ================
require('./admin-cmd');
require('./users-cmd');

// ========= USERS ==============
require('./vk-users/creator');
require('./vk-users/premium');

async function lesyaHandler(ctx){
    if(/([\w\W]+), на руках [0-9\.?]+/gim.test(ctx.text)){
        let money = ctx.text.match(/на руках ([0-9\.?]+)/im);
        let bank = ctx.text.match(/В банке: ([0-9\.?]+)/im);
        let bitcoin = ctx.text.match(/Биткоинов: ([0-9\.?]+)/im);
        let realMoney = 0;
        let realBank = 0;
        let realBitcoin = 0;
        let message = ``;
        let all = 0;
        let balanceKeys = [];

        if(money){
            money = money[1];
            message += `💲 Баланс: ${money}\n`;
            realMoney = Number(money.replace(/[\.]+/gim, ''));
            all += realMoney;
        }
        if(bank){
            bank = bank[1];
            message += `💳 Банк: ${bank}\n`;
            realBank = Number(bank.replace(/[\.]+/gim, ''));
            message += `💰 Всего: ${divideNumber(realBank+realMoney)}\n`;
            all += realBank;
        }
        if(bitcoin){
            bitcoin = bitcoin[1];
            message += `🌐 Биткоины: ${bitcoin}\n`;
            realBitcoin = bitcoin.replace(/[\.]+/gim, '');
        }
        message += '\n\n⚙ Можно купить:\n';
        if(all){
            if(all >= 250000000)
                message += `&#12288;👑 Рейтинг: ${Math.floor(all/250000000)}\n`;
                balanceKeys.push(Keyboard.textButton({
                    label: `Рейтинг ${Math.floor(all/250000000)}`,
                    color: 'positive'
                }));
            if(all >= 225000000)
                message += `&#12288;&#12288;[*] Рейтинг: ${Math.floor(all/225000000)}\n`;
                balanceKeys.push(Keyboard.textButton({
                    label: `Рейтинг ${Math.floor(all/225000000)}`,
                    color: 'secondary'
                }));
            if(all >= 900000000)
                message += `&#12288;🔋 Ферм: ${Math.floor(all/900000000)}\n`;
        }
        if(realBitcoin){
            if(realBitcoin >= 28750)
                message += `&#12288;🌐 Кристалл.кейсы: ${Math.floor(realBitcoin/28750)}\n`;
        }
        message += '\n\n[*] - Только с премиумом';
        return ctx.send(message, {
            keyboard: Keyboard.keyboard(balanceKeys).inline(true)
        });
    }
    if(/участники клана «𝓚𝖔𝝇𝖒𝖔𝝇»/gim.test(ctx.text)){
        const data = ctx.text.match(/(\[id[0-9]+\|)?(.*)(\])? \([0-9]+\) — 🏆 ([0-9\.?]+)/gim);
		let message = '[‼] Участники с рейтингом ниже 1000:\n';
		for (let i = 0; i < data.length; i++) {
			data[i] = String(data[i]).substr(4,data[i].length);
			let playerRate = data[i].match(/— 🏆 ([0-9\.?]+)/gi);
			playerRate = String(playerRate[0]).substr(4).replace('.','');
			if(playerRate < 1000){
				message += '[❌] ' + data[i] + '\n';
			}
		}
		let inClan = ctx.text.match(/\[[0-9]+\/50\]/gim);
		inClan = inClan[0];
		inClan = inClan.replace('[','').replace('/','').replace('|','').replace('50','').replace(']','');
		let chat = await vk.api.messages.getConversationMembers({peer_id: ctx.peerId});
		// chat.items.length - Кол-во в чате!
		let isNotClan = (((chat.items.length-3) - inClan) > 0) ? (chat.items.length-3) - inClan : "Нет";
		let isNotChat = ((inClan - (chat.items.length-3)) > 0) ? inClan - (chat.items.length-3) : "Нет";
		message += `&#13;\n[💬] Лишних в чате: ${isNotClan}\n[👥] Лишних в клане: ${isNotChat}`;

		ctx.send(message);
    }
    if(/([\w\W]+), страница [0-9\/?]+:/gim.test(ctx.text)){
        return ctx.send(countPetPower(ctx));
    }
    if(/([\w\W]+), Вы напали на игрока/gim.test(ctx.text)){
        let clanSettings = JSON.parse(fs.readFileSync(`./dbs/vk-db/clan-settings.json`));
        let battles = JSON.parse(fs.readFileSync('./dbs/vk-db/battles.json'));
        let date = time().format('DD.MM.YYYY');
        let parseInfo = ctx.text.match(/(\[🌌 𝓚𝖔𝝇𝖒𝖔𝝇\] )?([\w\W]+), Вы напали на игрока ([\w\W]+)(\n[\W\W]+ Питомцы противника)/i);
        parseInfo[2] = parseInfo[2].replace(/\[id[0-9]+\|/gim, '').replace(']', '');
        let info = {
            nick: parseInfo[2],
            enemy: parseInfo[3]
        }
        if(!battles[date]){
            return 0;
        }
        let user = utils.findOBJ(battles[date]['users'], 'nick', info.nick);
        if(!user){
            battles[date]['users'].push({
                nick: info.nick,
                battles: [{
                    enemy: info.enemy,
                    result: false,
                    start: time().format('HH:mm:ss'),
                    end: false
                }],
                win: 0,
                lose: 0,
                all: 0
            });
        } else {
            battles[date]['users'][user.ind].battles.push({
                enemy: info.enemy,
                result: false,
                start: time().format('HH:mm:ss'),
                end: false
            });
        }
        fs.writeFileSync('./dbs/vk-db/battles.json', JSON.stringify(battles, '', 4));
    }
    if(/([\w\W]+), Ваши питомцы (победили|проиграли)/gim.test(ctx.text)){
        let clanSettings = JSON.parse(fs.readFileSync(`./dbs/vk-db/clan-settings.json`));
        let battles = JSON.parse(fs.readFileSync('./dbs/vk-db/battles.json'));
        let date = time().format('DD.MM.YYYY');
        if(!battles[date]){
            return 0;
        }
        let parser = ctx.text.match(/(\[🌌 𝓚𝖔𝝇𝖒𝖔𝝇\] )?([\w\W]+), Ваши питомцы (победили|проиграли)/i);
        parser[2] = parser[2].replace(/\[id[0-9]+\|/gim, '').replace(']', '');
        let result = (parser[3] == 'победили') ? 'Победа' : 'Проигрыш';
        let user = utils.findOBJ(battles[date]['users'], 'nick', parser[2]);
        let message = `🌌 ${parser[2]}, бои обновлены:\n`;
        if(user){
            let lastBattle = battles[date]['users'][user.ind].battles.length - 1;
            if(battles[date]['users'][user.ind].battles && !battles[date]['users'][user.ind].battles[lastBattle].result){
                if(result == 'Победа'){
                    battles[date]['users'][user.ind].battles[lastBattle].result = result;
                    battles[date]['users'][user.ind].battles[lastBattle].end = time().format('HH:mm:ss');
                    battles[date]['users'][user.ind].win++;
                    battles[date].win++;
                }
                if(result == 'Проигрыш'){
                    battles[date]['users'][user.ind].battles[lastBattle].result = result;
                    battles[date]['users'][user.ind].battles[lastBattle].end = time().format('HH:mm:ss');
                    battles[date]['users'][user.ind].lose++;
                    battles[date].lose++;
                }
                battles[date].all++;
            } else {
                battles[date]['users'][user.ind].battles.push({
                    enemy: '[*][Бот включился позже]',
                    result: result,
                    start: time().format('HH:mm:ss'),
                    end: time().format('HH:mm:ss')
                });
                if(result == 'Победа'){
                    battles[date]['users'][user.ind].win++;
                    battles[date].win++;
                } else {
                    battles[date]['users'][user.ind].lose++;
                    battles[date].lose++;
                }  
                battles[date].all++;
            }
            battles[date]['users'][user.ind].all++;
            let uInfo = battles[date]['users'][user.ind];
            message += `✊🏻 Боев: ${uInfo.all}\n`;
            message += `⚙ Норма [${battles[date].norm}]: ${(uInfo.all >= battles[date].norm) ? 'Выполнена' : 'Не выполнена'}\n`;
            message += `😁 Побед: ${uInfo.win}\n`;
            message += `😔 Поражений: ${uInfo.lose}\n`
        } else {
            let uIndex = battles[date]['users'].push({
                nick: parser[2],
                battles: [{
                    enemy: '[*][Бот включился позже]',
                    result: result,
                    start: time().format('HH:mm:ss'),
                    end: time().format('HH:mm:ss')
                }],
                win: (result == 'Победа') ? 1 : 0,
                lose: (result == 'Победа') ? 0 : 1,
                all: 1
            });
            if(result == 'Победа'){
                battles[date].win++;
            } else {
                battles[date].lose++;
            }
            battles[date]['users'][uIndex].all++;
            battles[date].all++
            let uInfo = battles[date]['users'][uIndex];
            message += `✊🏻 Боев: ${uInfo.all}\n`;
            message += `⚙ Норма [${battles[date].norm}]: ${(uInfo.all >= battles[date].norm) ? 'Выполнена' : 'Не выполнена'}\n`;
            message += `😁 Побед: ${uInfo.win}\n`;
            message += `😔 Поражений: ${uInfo.lose}\n`
        }
        fs.writeFileSync('./dbs/vk-db/battles.json', JSON.stringify(battles, '', 4));
        return ctx.send(message);
    }
    return 1;
}

function countPetPower(ctx){
    if(!ctx.hasForwards){
        let data = ctx.text.split(/\n/gim);
        let page = data[0].match(/страница [0-9\/?]+/i);
        page = page[0].replace('страница ', '');
        data.splice(0, 1);
        let tempPetInfo = [];
        for(let i = 0; i < data.length; i++){
            let tempString = data[i].match(/([\w\W]+) (\[[0-9]+\]) ([\w\W]+) — (❤️ [0-9]+)?( \| 💢 [0-9]+)?( \| 🧿 [0-9]+)?/i);
            tempString[1] = tempString[1].substring(0, tempString[1].length - 1);
            tempPetInfo.push({
                id: tempString[1],
                name: tempString[3],
                level: (tempString[2]) ? parseInt(tempString[2].replace('[', '').replace(']', '')) : 0,
                hp: (tempString[4]) ? parseInt(tempString[4].replace(/(❤️)/i, '')) : 0,
                damage: (tempString[5]) ? parseInt(tempString[5].replace(/( \| 💢)/i, '')) : 0,
                magic: (tempString[6]) ? parseInt(tempString[6].replace(/( \| 🧿)/i, '')) : 0
            });
        }
        let maxLevel = tempPetInfo[0];
        let maxHp = tempPetInfo[0];
        let maxDamage = tempPetInfo[0];
        let maxMagic = tempPetInfo[0];
        for(let i = 0; i < tempPetInfo.length; i++){
            if(maxLevel.level < tempPetInfo[i].level){
                maxLevel = tempPetInfo[i];
            }
            if(maxHp.hp < tempPetInfo[i].hp){
                maxHp = tempPetInfo[i];
            }
            if(maxDamage.damage < tempPetInfo[i].damage){
                maxDamage = tempPetInfo[i];
            }
            if(maxMagic.magic < tempPetInfo[i].magic){
                maxMagic = tempPetInfo[i];
            }
        }
        let stats_message = `Статистика питомцев [${page}]:\n`;
        stats_message += `🌀 По Уровню: ${maxLevel.id} ${maxLevel.name} - ${maxLevel.level}\n`;
        stats_message += `❤ По ХП: ${maxHp.id} ${maxHp.name} - ${maxHp.hp}\n`;
        stats_message += `💢 По Урону: ${maxDamage.id} ${maxDamage.name} - ${maxDamage.damage}\n`;
        stats_message += `🧿 По Магии: ${maxMagic.id} ${maxMagic.name} - ${maxMagic.magic}\n`;

        stats_message += `\n(Тип: Номер. Ник - Кол-Во)\n`;
        stats_message += 'Лайфхак: Перешлите несколько сообщений с питомами мне в ЛС и я посчитаю всех сразу!';
        return stats_message;
    } else {
        let stats_message = '';
        stats_message += `\n(Тип: Номер. Ник - Кол-Во)\n\n`;
        for(let i = 0; i < ctx.forwards.length; i++){
            let message = ctx.forwards[i].text;
            let data = message.split(/\n/gim);
            let page = data[0].match(/страница [0-9\/?]+/i);
            page = page[0].replace('страница ', '');
            data.splice(0, 1);
            let tempPetInfo = [];
            for(let i = 0; i < data.length; i++){
                let tempString = data[i].match(/([\w\W]+) (\[[0-9]+\]) ([\w\W]+) — (❤️ [0-9]+)?( \| 💢 [0-9]+)?( \| 🧿 [0-9]+)?/i);
                tempString[1] = tempString[1].substring(0, tempString[1].length - 1);
                tempPetInfo.push({
                    id: tempString[1],
                    name: tempString[3],
                    level: (tempString[2]) ? parseInt(tempString[2].replace('[', '').replace(']', '')) : 0,
                    hp: (tempString[4]) ? parseInt(tempString[4].replace(/(❤️)/i, '')) : 0,
                    damage: (tempString[5]) ? parseInt(tempString[5].replace(/( \| 💢)/i, '')) : 0,
                    magic: (tempString[6]) ? parseInt(tempString[6].replace(/( \| 🧿)/i, '')) : 0
                });
            }
            let maxLevel = tempPetInfo[0];
            let maxHp = tempPetInfo[0];
            let maxDamage = tempPetInfo[0];
            let maxMagic = tempPetInfo[0];
            for(let i = 0; i < tempPetInfo.length; i++){
                if(maxLevel.level < tempPetInfo[i].level){
                    maxLevel = tempPetInfo[i];
                }
                if(maxHp.hp < tempPetInfo[i].hp){
                    maxHp = tempPetInfo[i];
                }
                if(maxDamage.damage < tempPetInfo[i].damage){
                    maxDamage = tempPetInfo[i];
                }
                if(maxMagic.magic < tempPetInfo[i].magic){
                    maxMagic = tempPetInfo[i];
                }
            }
            stats_message += `Статистика питомцев ${page}:\n`;
            stats_message += `🌀 По Уровню: ${maxLevel.id} ${maxLevel.name} - ${maxLevel.level}\n`;
            stats_message += `❤ По ХП: ${maxHp.id} ${maxHp.name} - ${maxHp.hp}\n`;
            stats_message += `💢 По Урону: ${maxDamage.id} ${maxDamage.name} - ${maxDamage.damage}\n`;
            stats_message += `🧿 По Магии: ${maxMagic.id} ${maxMagic.name} - ${maxMagic.magic}\n`;
            stats_message += `\n=-=-=-=-=-=-=-=-=-=\n`;
        }
        return stats_message;
    }
}

function divideNumber(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

setInterval(async ()=>{
    try {
        let { profiles } = await vk.api.messages.getConversationMembers({peer_id: cfg.group.peerId});
        let new_users = JSON.parse(fs.readFileSync('./dbs/vk-db/new-users.json'));
        for(let i = 0; i < profiles.length; i++){
            let user = utils.findOBJ(new_users, 'id', profiles[i].id);
            if(user && user.el.kickTime <= new Date().getTime()){
                vk.api.messages.send({
                    peer_id: cfg.group.peerId,
                    message: `[id${user.el.id}|${user.el.name}], вы не успели войти в клан!`
                });
                vk.api.messages.removeChatUser({
                    chat_id: cfg.group.chatId,
                    member_id: user.el.id
                });
                new_users.splice(user.ind, 1);
                fs.writeFileSync('./dbs/vk-db/new-users.json', JSON.stringify(new_users, '', 4));
            }
        }
        for(let i = 0; i < new_users.length; i++){
            let user = utils.findOBJ(profiles, 'id', new_users[i].id);
            if(!user){
                new_users.splice(i, 1);
                fs.writeFileSync('./dbs/vk-db/new-users.json', JSON.stringify(new_users, '', 4));
            }
        }
    } catch(error){
        logger.error(`Ошибка проверки new-users.json: ${error.message}`, 'vk');
    }
}, 10000);

setInterval(async () => {
    let { link } = JSON.parse(fs.readFileSync('./dbs/vk-db/clan-settings.json'));
    let message = '';
    message += `❤ Не забудь подписаться на нашу группу!\n`;
    message += `👀 Там ты информацию о боте, новости клана, промокоды!\n`;
    message += `🔔 Чтобы не пропустить ничего важного, включай уведомление о новых записях!`;
    return vk.api.messages.send({
        peer_id: cfg.group.peerId,
        message: message,
        keyboard: Keyboard.keyboard([
            Keyboard.urlButton({label: 'Подписаться', url: link})
        ]).inline(true)
    }).then(() => {
        logger.log(`Напоминание о подписке отправлено в беседу`, 'vk');
    }).catch((error) => {
        logger.warn(`Напоминание не отправлено! Причина: ${error.message}`, 'vk');
    });
}, 1000 * 60 * 60);