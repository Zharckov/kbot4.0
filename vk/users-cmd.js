const { vk, logger, cfg } = require('./vk');
const fs = require('fs');
const time = require('moment');
const countdown = require('countdown');

let ARRAY_CMD = require('../dbs/vk-db/cmds.json');
const utils = require('../modules/utils');
let STRING_CMD = `🌌 Команды бота [${ARRAY_CMD.length}]:\n`;
for(let i = 0; i < ARRAY_CMD.length; i++){
    STRING_CMD += `> ${ARRAY_CMD[i]}\n`;
}
STRING_CMD += "\n\n❗ * - Работает только с П.Д\n";
STRING_CMD += "❗ ! - Не обяз.аргумент\n";
STRING_CMD += "❗ + - Только зарегистрированным";

vk.updates.hear(/^\/stuff( )?/i, (ctx) => {
    if(ctx.$match[1]){return 1;}
    let stuff = JSON.parse(fs.readFileSync('./dbs/server-db/admins.json'));
    let message = `⚙ Полный доступ [${stuff.length}]:\n`;
    for(let i = 0; i < stuff.length; i++){
        message += `> ${stuff[i].name}\n`;
    }
    return ctx.send(message);
});

vk.updates.hear(/^\/cmd/i, (ctx)=>{
    return ctx.send(STRING_CMD);
});

vk.updates.hear(/клан (вступить|войти) 26274/i, (ctx) => {
    let new_users = JSON.parse(fs.readFileSync('./dbs/vk-db/new-users.json'));
    let user = utils.findOBJ(new_users, 'id', ctx.senderId);
    if(user){
        ctx.send(`🌌 [id${user.el.id}|${user.el.name}], вы успели войти в клан!`);
        new_users.splice(user.ind, 1);
        return fs.writeFileSync('./dbs/vk-db/new-users.json', JSON.stringify(new_users, '', 4));
    }
});

vk.updates.hear(/^\/textad/i, (ctx) => {
    let data = JSON.parse(fs.readFileSync('./dbs/vk-db/clan-settings.json')).textAd;
    return ctx.send(data, {
        dont_parse_links: true
    });
});

vk.updates.hear(/^\/lesya/i, (ctx) => {
    let data = JSON.parse(fs.readFileSync('./dbs/vk-db/clan-settings.json')).lesyaLink;
    return ctx.send(`🌌 Кидать рекламу сюда:\n${data}`, {
        dont_parse_links: true
    });
});

vk.updates.hear(/^\/link/i, (ctx) => {
    let data = JSON.parse(fs.readFileSync('./dbs/vk-db/clan-settings.json')).link;
    return ctx.send(`🌌 Приглашай друзей по ссылке:\n${data}`, {
        dont_parse_links: true
    });
});

vk.updates.hear(/^\/reg( )?([0-9]+)?( )?([\w\W]+)?/i, (ctx) => {
    let users = JSON.parse(fs.readFileSync('./dbs/vk-db/users.json'));
    if(!ctx.$match[2] || !ctx.$match[4]){ return ctx.send(`❗ Использовать: /reg [ID из Lesya] [Ник из Lesya]`); }
    if(!utils.findOBJ(users, 'id', ctx.senderId)){
        users.push({
            id: ctx.senderId,
            nick: ctx.$match[4],
            lid: ctx.$match[2]
        });
        fs.writeFileSync('./dbs/vk-db/users.json', JSON.stringify(users, '', 4));
        return ctx.send(`🌌 Вы зарегистрировались!\n😁 Открыт доступ к новым командам!\n⚙ Чтобы сменить данные:\n&#12288;⚙ /nick [Новый ник]\n&#12288;⚙ /id [Новый ID]`);
    } else {
        return ctx.send(`❗ Вы уже зарегистрованы!`);
    }
});

vk.updates.hear(/^\/nick( )?([\w\W]+)?/i, (ctx) => {
    if(!ctx.$match[2]){
        return ctx.send(`❗ Использовать: /nick [Новый ник]`);
    }
    let users = JSON.parse(fs.readFileSync('./dbs/vk-db/users.json'));
    let check = utils.findOBJ(users, 'id', ctx.senderId);
    if(!check){ 
        return ctx.send(`❗ Сначала зарегистрируйтесь: /reg [ID из Lesya] [Ник из Lesya]`);
    }
    users[check.ind].nick = ctx.$match[2];
    fs.writeFileSync('./dbs/vk-db/users.json', JSON.stringify(users, '', 4));
    return ctx.send(`🌌 Новый ник сохранен!`);
});

vk.updates.hear(/^\/id( )?([0-9]+)?/i, (ctx) => {
    if(!ctx.$match[2]){
        return ctx.send(`❗ Использовать: /id [Новый ID]`);
    }
    let users = JSON.parse(fs.readFileSync('./dbs/vk-db/users.json'));
    let check = utils.findOBJ(users, 'id', ctx.senderId);
    if(!check){ 
        return ctx.send(`❗ Сначала зарегистрируйтесь: /reg [ID из Lesya] [Ник из Lesya]`);
    }
    users[check.ind].lid = ctx.$match[2];
    fs.writeFileSync('./dbs/vk-db/users.json', JSON.stringify(users, '', 4));
    return ctx.send(`🌌 Новый ID сохранен!`);
});

vk.updates.hear(/^\/mybattle( )?([0-9\.]{10})?( )?([1-9]+)?/i, (ctx) => {
    let users = JSON.parse(fs.readFileSync('./dbs/vk-db/users.json'));
    let check = utils.findOBJ(users, 'id', ctx.senderId);
    if(!check){return ctx.send(`❗ Сначала зарегистрируйтесь: /reg [ID из Lesya] [Ник из Lesya]`);}
    let battles = JSON.parse(fs.readFileSync('./dbs/vk-db/battles.json'));
    let date = ctx.$match[2] || time().format('DD.MM.YYYY');
    let dateMSG = (ctx.$match[2]) ? `за ${ctx.$match[2]}` : 'за сегодня';
    if(battles[date]){
        let player = utils.findOBJ(battles[date]['users'], 'nick', check.el.nick);
        if(player){
            if(!ctx.$match[4]){
                player = player.el;
                let message = `🌌 ${player.nick}, статистика ${dateMSG}:\n`;
                message += `⚙ Норма [${battles[date].norm}]: ${(player.all >= battles[date].norm) ? 'Выполнена' : 'Не выполнена'}\n`;
                message += `✊🏻 Всего: ${player.all}\n`;
                message += `😁 Побед: ${player.win}\n`;
                message += `😔 Проигрышей: ${player.lose}\n\n`;
                for(let i = 0; i < player.battles.length; i++){
                    let { result, end } = player.battles[i];
                    if(!result){
                        message += `${i+1}. Идет бой...\n`;
                    } else {
                        message += `${i+1}. ${end} - ${result}\n`;
                    }
                }
                message += `\n💢 Чтобы узнать статистику конкретного боя: /mybattle [Дата] [Номер боя]\n`;
                return ctx.send(message);
            } else {
                ctx.$match[4] -= 1;
                if(player.el.battles[ctx.$match[4]]){
                    let message = `🌌 ${player.el.nick}, статистика боя ${dateMSG}:\n`;
                    let { enemy, result, end, start } = player.el.battles[ctx.$match[4]];
                    message += `😈 Противник: ${enemy}\n`;
                    message += `⚔ Начало: ${start}\n`;    
                    message += `🚬 Конец: ${(!end) ? 'Идет бой...' : end}\n`; 
                    message += `🏅 Результат: ${(!result) ? 'Идет бой...' : result}\n`;
                    return ctx.send(message);   
                } else {
                    return ctx.send(`❗❗ Бой с укзанным номером не найден!`)
                }
            }
        } else {
            return ctx.send(`🌀 У вас не было боёв ${dateMSG}!`);
        }
    } else {
        return ctx.send(`🌀 Боёв ${dateMSG} не было!`);
    }
});

vk.updates.hear(/^\/norm/i, (ctx) => {
    let battles = JSON.parse(fs.readFileSync('./dbs/vk-db/battles.json'));
    let date = time().format('DD.MM.YYYY');
    if(!battles[date]){return ctx.send(`🌌 Норма боёв не установлена!`);}
    return ctx.send(`🌌 Норма боев на сегодня: ${battles[date].norm}`);
});

vk.updates.hear(/^\/top( )?([0-9\.]{10})?( )?(all|win|lose)?/i, (ctx) => {
    let battlesGlobal = JSON.parse(fs.readFileSync('./dbs/vk-db/battles.json'));
    let date = ctx.$match[2] || time().format('DD.MM.YYYY');
    let dateMSG = (ctx.$match[2]) ? ctx.$match[2] : 'сегодня';
    let sortType = ctx.$match[4] || false;
    if(!battlesGlobal[date]){
        return ctx.send(`🌌 Не найдено боёв за ${dateMSG}!`);
    }
    let { users, all, win, lose, norm} = battlesGlobal[date];
    if(sortType){
        switch(sortType){
            case 'all': { 
                let message = `[🌌] Топ игроков за ${dateMSG} по боям:\n`;
                let sort = users.sort((a, b) => {
                    return b.all - a.all;
                });
                sort.forEach((value, i) => {
                    if(i == 4){return 1;}
                    message += `[👑] ${value.nick} - ${value.all}\n`;
                });
                return ctx.send(message);
            }
            case 'win': { 
                let message = `[🌌] Топ игроков за ${dateMSG} по победам:\n`;
                let sort = users.sort((a, b) => {
                    return b.win - a.win;
                });
                sort.forEach((value, i) => {
                    if(i == 4){return 1;}
                    message += `[🏅] ${value.nick} - ${value.win}\n`;
                });
                return ctx.send(message);
            }
            case 'lose': { 
                let message = `[🌌] Топ игроков за ${dateMSG} по проигрышам:\n`;
                let sort = users.sort((a, b) => {
                    return b.lose - a.lose;
                });
                sort.forEach((value, i) => {
                    if(i == 4){return 1;}
                    message += `[🚬] ${value.nick} - ${value.lose}\n`;
                });
                return ctx.send(message);
            }
        }
        return 1;
    } else {
        let message = `[🌌] Топ игроков за ${dateMSG} по боям:\n`;
        let sort = users.sort((a, b) => {
            return b.all - a.all;
        });
        sort.slice(sort.length, 4);
        sort.forEach((value, i) => {
            if(i == 4){return 1;}
            message += `[👑] ${value.nick} - ${value.all}\n`;
        });
        return ctx.send(message);
    }
});

vk.updates.hear(/^\/summer/i, (ctx) => {
    let message = `🌌 До лета осталось:\n`;
    let date = countdown(time(), new Date('2021/06/01'));
    message += `🌕 Месяцев: ${date.months}\n`;
    message += `🔥 Дней: ${date.days}\n`;
    message += `🍎 Часов: ${date.hours}\n`;
    message += `🍓 Минут: ${date.minutes}\n`;
    message += `🍉 секунд: ${date.seconds}`;
    return ctx.send(message);
});

vk.updates.hear(/^\/2021/i, (ctx) => {
    let message = `🌌 До 2021 года осталось:\n`;
    let date = countdown(time(), new Date('2021/01/01'));
    message += `🌑 Месяцев: ${date.months}\n`;
    message += `🌨 Дней: ${date.days}\n`;
    message += `❄ Часов: ${date.hours}\n`;
    message += `🥗 Минут: ${date.minutes}\n`;
    message += `🍊 секунд: ${date.seconds}`;
    return ctx.send(message);
});

vk.updates.hear(/^\/profile/i, (ctx) => {});