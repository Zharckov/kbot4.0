const { vk, logger, cfg, utils, Keyboard, ngrok, keys } = require('./vk');
const fs = require('fs');
const os = require('os');
const time = require('moment');
const { exec } = require('child_process');

vk.updates.hear(/\/stuff( )(add|delete)/i, async (ctx) => {
    if(!utils.isAdmin(ctx.senderId)){return ctx.send(`❗ Нет доступа!`);};
    if(ctx.hasReplyMessage){
        let { replyMessage } = ctx;
        if(replyMessage.senderId == ctx.senderId){
            return ctx.send(`🌌 Ага, добавить самого себя... Гениально!`);
        } 
        if(replyMessage.senderId < 0){
            return ctx.send(`🌌 Зачем боту полный доступ?`);
        }
        let user = await vk.api.users.get({user_ids: replyMessage.senderId});
        switch(ctx.$match[2]){
            case 'add': {
                if(utils.addAdmin(replyMessage.senderId, `${user[0].first_name} ${user[0].last_name}`)){
                    return ctx.send(`🌌 Участнику [id${user[0].id}|${user[0].first_name} ${user[0].last_name}] выдан полный доступ!`);
                } else {
                    return ctx.send(`❗ Данный пользователь уже имеет полный доступ!`);
                }
            }
            case 'delete': {
                if(utils.delAdmin(replyMessage.senderId)){
                    return ctx.send(`🌌 Участник [id${user[0].id}|${user[0].first_name} ${user[0].last_name}] удален из полного доступа!`);
                } else {
                    return ctx.send(`❗ Участник не найден в списке полного доступа!`);
                }
            }
            default: {
                return ctx.send(`❗ Использовать: /stuff [add|delete] с ответом на сообщение участника!`);
            }
        }
    } else {
        return ctx.send(`❗ Использовать: /stuff [add|delete] с ответом на сообщение участника!`);
    }
});

vk.updates.hear(/\/ad( )?([\w\W]+)?/i, async (ctx) => {
    if(!utils.isAdmin(ctx.senderId)){return ctx.send(`❗ Нет доступа!`);};
    let message = ``;
    let members = await vk.api.messages.getConversationMembers({
        peer_id: cfg.group.peerId
    });
    let online = 0;
    for(let i = 0; i < members.profiles.length; i++){
        message += `[${members.profiles[i].screen_name}|&#8203;]`;
        online += (members.profiles[i].online) ? 1 : 0;
    }
    message += `👥 Онлайн: ${online}\n`;
    message += (ctx.$match[2]) ? `⚠ Объявление: ${ctx.$match[2]}\n` : '⚠ Объявление\n';
    return ctx.send(message);
});

vk.updates.hear(/\/war/i, async (ctx) => {
    if(!utils.isAdmin(ctx.senderId)){return ctx.send(`❗ Нет доступа!`);};
    let message = ``;
    let members = await vk.api.messages.getConversationMembers({
        peer_id: cfg.group.peerId
    });
    let online = 0;
    for(let i = 0; i < members.profiles.length; i++){
        message += `[${members.profiles[i].screen_name}|&#8203;]`;
        if(members.profiles[i].online){
            online++
        }
    }
    message += `👥 Онлайн: ${online}\n`;
    message += `✊🏻 Участвуем в боях!`;
    return ctx.send(message, {
        keyboard: Keyboard.keyboard([
            Keyboard.textButton({label: 'Бой', color: "positive"})
        ]).inline(true)
    });
});

vk.updates.hear(/\/rob/i, async (ctx) => {
    if(!utils.isAdmin(ctx.senderId)){return ctx.send(`❗ Нет доступа!`);};
    let message = ``;
    let members = await vk.api.messages.getConversationMembers({
        peer_id: cfg.group.peerId
    });
    let online = 0;
    for(let i = 0; i < members.profiles.length; i++){
        message += `[${members.profiles[i].screen_name}|&#8203;]`;
        online += (members.profiles[i].online) ? 1 : 0;
    }
    message += `👥 Онлайн: ${online}\n`;
    message += `✊🏻 Закупаемся на ограбление!`;
    return ctx.send(message, {
        keyboard: Keyboard.keyboard([
            Keyboard.textButton({label: 'Предметы', color: "positive"})
        ]).inline(true)
    });
});

vk.updates.hear(/\/new( )?(delete)?( )?([0-9]+)?/i, (ctx) => {
    if(!utils.isAdmin(ctx.senderId)){return ctx.send(`❗ Нет доступа!`);};
    let new_users = JSON.parse(fs.readFileSync('./dbs/vk-db/new-users.json'));
    if(ctx.$match[2]){
        if(!ctx.$match[4]){return ctx.send(`❗ Использовать: /new delete [ID из списка]!`);}
        let del_id = ctx.$match[4]-1;
        if(new_users[del_id]){
            ctx.send(`🌌 Участник [id${new_users[del_id].id}|${new_users[del_id].name}] удален из списка невошедших!`);
            new_users.splice(del_id, 1);
            fs.writeFileSync('./dbs/vk-db/new-users.json', JSON.stringify(new_users, '', 4));
        } else {
            return ctx.send(`Участник с данным ID не найден!`);
        }
    } else {
        if(new_users.length){
            let message = '👥 Невошедшие в клан:\n';
            for(let i = 0; i < new_users.length; i++){
                message += `&#12288;${1+i}. ${new_users[i].name}\n`;
            }
            return ctx.send(message);
        } else {
            return ctx.send(`❗ Список невошедших пуст!`);
        }
    }
});

vk.updates.hear(/\/check/i, async (ctx) => {
    if(!utils.isAdmin(ctx.senderId)){return ctx.send(`❗ Нет доступа!`);};
    let uptime = utils.formatUptime(process.uptime());
    let used = Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100 + ' Мб';
    let total = Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100 + ' Мб';
    let rss = Math.round(process.memoryUsage().rss / 1024 / 1024 * 100) / 100 + ' Мб';
    let ext = Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100 + ' Мб';
    let message = `⚙ Статистика бота:\n`;
    message += `> Uptime: ${uptime}\n`;
    message += `> Used: ${used}\n`;
    message += `> Total: ${total}\n`;
    message += `> RSS: ${rss}\n`;
    message += `> EXT: ${ext}\n\n`;
    message += `> OSMF: ${Math.round(os.freemem() / 1024 / 1024 / 1024 * 100) / 100} Гб\n`;
    message += `> OSMT: ${Math.round(os.totalmem() / 1024 / 1024 / 1024 * 100) / 100} Гб\n`;

    return ctx.send(message);
});

vk.updates.hear(/\/key/i, (ctx) => {
    if(!utils.isAdmin(ctx.senderId)){return ctx.send(`❗ Нет доступа!`);};
    return ctx.send(`🌌 Клавиутура обновлена!`, {
        keyboard: Keyboard.keyboard(keys.chat)
    });
});

vk.updates.hear(/\/textad( )([\w\W]+)/i, (ctx) => {
    if(!utils.isAdmin(ctx.senderId)){return ctx.send(`❗ Нет доступа!`);};
    let data = JSON.parse(fs.readFileSync('./dbs/vk-db/clan-settings.json'));
    data.textAd = ctx.$match[2];
    fs.writeFileSync('./dbs/vk-db/clan-settings.json', JSON.stringify(data, '', 4));
    return ctx.send(`🌌 Текст рекламы изменен!`);
});

vk.updates.hear(/\/link( )((http(s):\/\/)?vk.me\/join\/[\w\W]+)/i, (ctx) => {
    if(!utils.isAdmin(ctx.senderId)){return ctx.send(`❗ Нет доступа!`);};
    let new_link = ctx.$match[2];
    let data = JSON.parse(fs.readFileSync('./dbs/vk-db/clan-settings.json'));
    data.link = new_link;
    fs.writeFileSync('./dbs/vk-db/clan-settings.json', JSON.stringify(data, '', 4));
    return ctx.send(`⚙ Новая ссылка беседы установлена!`);
});

vk.updates.hear(/\/panel/i, async (ctx) => {
    if(!utils.isAdmin(ctx.senderId)){return ctx.send(`❗ Нет доступа!`);};
    if(!ctx.isFromUser){
        return ctx.send(`❗ Команду можно использовать только в ЛС боту!`);
    } else {
        let data = fs.readFileSync('./dbs/server-db/ngrok.site', 'utf8');
        let url = await vk.api.utils.getShortLink({
            url: data
        });
        return ctx.send(`🌀 Адрес панели управления:\n🔗 ${url.short_url}`, {
            dont_parse_links: true
        });
    }
});

vk.updates.hear(/^\/battle( )?([0-9\.]{10})?( )?([1-9]+)?( )?([\w\W]+)?/i, (ctx) => {
    if(!utils.isAdmin(ctx.senderId)){return ctx.send(`❗ Нет доступа!`);};
    let date = (ctx.$match[2]) ? ctx.$match[2] : time().format('DD.MM.YYYY');
    let dateMSG = (ctx.$match[2]) ? `${ctx.$match[2]}` : 'сегодня';
    let battlesGlobal = JSON.parse(fs.readFileSync('./dbs/vk-db/battles.json'));
    if(!battlesGlobal[date]){
        let message = `🌌 Боёв за ${dateMSG} не найдено!\n⚙ Доступные даты:\n`;
        let dates = Object.keys(battlesGlobal);
        for(let i = 0; i < dates.length; i++){
            message += `> ${dates[i]}\n`; 
        }
        return ctx.send(message);
    }
    if(ctx.$match[6]){
        let check = utils.findOBJ(battlesGlobal[date]['users'], 'nick', ctx.$match[6]);
        if(!check){return ctx.send(`🌌 ${ctx.$match[6]} не играл бои ${dateMSG}!`);}
        if(!ctx.$match[4]){
            let { nick, battles, all, win, lose } = check.el;
            let message = `🌌 Статистика ${nick} за ${dateMSG}:\n`;
            message += `✊🏻 Всего: ${all}\n`;
            message += `⚙ Норма [${battlesGlobal[date].norm}]: ${(all >= battlesGlobal[date].all) ? 'Выполнена' : 'Не выполнена'}\n`;
            message += `😁 Побед: ${win}\n`;
            message += `😔 Поражений: ${lose}\n\n`;
            for(let i = 0; i < battles.length; i++){
                let { end, result } = battles[i];
                if(result){
                    message += `${i+1}. ${end} - ${result}\n`;
                } else {
                    message += `${i+1}. Идет бой...\n`;
                }
            }
            return ctx.send(message);
        } else {
            ctx.$match[4]--;
            let { nick, battles, all, win, lose } = check.el;
            if(!battles[ctx.$match[4]]){return ctx.send(`🌌 У ${nick} боев за ${dateMSG} с номером ${ctx.$match[4]} не найдено!`);}
            let message = `🌌 Статистика боя[${ctx.$match[4]+1}] ${nick} за ${dateMSG}:\n`;
            let { enemy, start, end, result } = battles[ctx.$match[4]];
            message += `😈 Противник: ${enemy}\n`;
            message += `⚔ Начало: ${start}\n`;    
            message += `🚬 Конец: ${end}\n`; 
            message += `🏅 Результат: ${result}\n`;
            return ctx.send(message);
        }
    } else {
        let { users, all, win, lose, norm } = battlesGlobal[date];
        let message = `🌌 Статистика за ${dateMSG}:\n`;
        let takeNorm = 0;
        message += `✊🏻 Всего: ${all}\n`;
        message += `😁 Побед: ${win}\n`;
        message += `😔 Поражений: ${lose}\n`;
        for(let i = 0; i < users.length; i++){
            if(users[i].all >= norm){
                takeNorm++;
            }
        }
        message += `⚙ Выполнили норму: ${takeNorm}\n\n`;
        for(let i = 0; i < users.length; i++){
            message += `>> ${users[i].nick} - ${users[i].all} всего\n`;
        }
        return ctx.send(message);
    }
});

vk.updates.hear(/^\/setnorm( )?([0-9]{2})?/i, (ctx) => {
    if(!utils.isAdmin(ctx.senderId)){return ctx.send(`❗ Нет доступа!`);}
    if(!ctx.$match[2]){return ctx.send(`❗ Использовать: /setnorm [0-99]`);}
    let clanSettings = JSON.parse(fs.readFileSync('./dbs/vk-db/clan-settings.json'));
    let battles = JSON.parse(fs.readFileSync('./dbs/vk-db/battles.json'));
    let date = time().format('DD.MM.YYYY');
    clanSettings.norm = Number(ctx.$match[2]);
    if(!battles[date]){
        battles[date] = {
            users: [],
            all: 0,
            win: 0,
            lose: 0,
            norm: Number(clanSettings.norm)
        }
    } 
    battles[date].norm = Number(clanSettings.norm);
    fs.writeFileSync('./dbs/vk-db/clan-settings.json', JSON.stringify(clanSettings, '', 4));
    fs.writeFileSync('./dbs/vk-db/battles.json', JSON.stringify(battles, '', 4));
    return ctx.send(`⚙ Норма боев на этот день установлена [${ctx.$match[2]}]\n✊🏻 Теперь бои регистрируются!`);
});

vk.updates.hear(/^\/players/i, async (ctx) => {
    if(!utils.isAdmin(ctx.senderId)){return ctx.send(`❗ Нет доступа!`);}
    let users = JSON.parse(fs.readFileSync('./dbs/vk-db/users.json'));
    let message = `🌌 Зарегистрованы в боте:\n`;
    for(let i = 0; i < users.length; i++){
        let user = await vk.api.users.get({user_ids: users[i].id});
        message += `>> ${user[0].first_name} ${user[0].last_name} | ${users[i].nick} | ${users[i].lid}\n`;
    }
    return ctx.send(message);
});

vk.updates.hear(/\/logs( )?(vk|app|http)?/i, async (ctx) => {
    if(!utils.isAdmin(ctx.senderId)){return ctx.send(`❗ Нет доступа!`);}
    if(!ctx.$match[2]){return ctx.send(`❗ Использовать: /logs vk | app | http`);}
    switch(ctx.$match[2]){
        case 'vk':{
            let logs = await vk.upload.messageDocument({
                peer_id: ctx.peerId, 
                source: './dbs/logs/vk-logs.log',
                title: 'vk-logs.log'
            }).catch((error) => {logger.error(`1) Отправка логов: ${error.message}`)});
            let errors = await vk.upload.messageDocument({
                peer_id: ctx.peerId, 
                source: './dbs/logs/vk-errors.log',
                title: 'vk-errors.log'
            }).catch((error) => {logger.error(`2) Отправка логов: ${error.message}`)});
            let warns = await vk.upload.messageDocument({
                peer_id: ctx.peerId, 
                source: './dbs/logs/vk-warns.log',
                title: 'vk-warns.log'
            }).catch((error) => {logger.error(`3) Отправка логов: ${error.message}`)});
            return vk.api.messages.send({
                peer_id: ctx.peerId,
                attachment: [logs.toString(), errors.toString(), warns.toString()]
            });
        }
        case 'app':{
            let logs = await vk.upload.messageDocument({
                peer_id: ctx.peerId, 
                source: './dbs/logs/app-logs.log',
                title: `app-logs.log`
            }).catch((error) => {logger.error(`1) Отправка логов: ${error.message}`)});;
            let errors = await vk.upload.messageDocument({
                peer_id: ctx.peerId, 
                source: './dbs/logs/app-errors.log',
                title: `app-erros.log`
            }).catch((error) => {logger.error(`2) Отправка логов: ${error.message}`)});;
            let warns = await vk.upload.messageDocument({
                peer_id: ctx.peerId, 
                source: './dbs/logs/app-warns.log',
                title: `app-warns.log`
            }).catch((error) => {logger.error(`3) Отправка логов: ${error.message}`)});;
            return vk.api.messages.send({
                peer_id: ctx.peerId,
                attachment: [logs.toString(), errors.toString(), warns.toString()]
            });
        }
        case 'http':{
            let logs = await vk.upload.messageDocument({
                peer_id: ctx.peerId,
                source: './dbs/logs/http-logs.log',
                title: 'http-logs.log'
            });
            let errors = await vk.upload.messageDocument({
                peer_id: ctx.peerId,
                source: './dbs/logs/http-errors.log',
                title: 'http-errors.log'
            });
            let warns = await vk.upload.messageDocument({
                peer_id: ctx.peerId,
                source: './dbs/logs/http-warns.log',
                title: 'http-warns.log'
            });
            return vk.api.messages.send({
                peer_id: ctx.peerId,
                attachment: [logs.toString(), errors.toString(), warns.toString()]
            });
        }
        default: {
            return ctx.send(`❗ Использовать: /logs vk | app | http`);
        }
    }
});

vk.updates.hear(/\/restart/i, (ctx) => {
    let data = JSON.parse(fs.readFileSync('./dbs/server-db/controller.json'));
    data.isRestarted = true;
    fs.writeFileSync('./dbs/server-db/controller.json', JSON.stringify(data, '', 4));
    ctx.send(`🌌 Начинаю перезагрузку...`);
    logger.log(`Перезагрузка началась...`, 'app');
    return exec('pm2 restart 0');
});