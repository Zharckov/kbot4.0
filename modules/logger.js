const time = require('moment');
const fs = require('fs');
time.locale('ru');

const col = {
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    reset: "\x1b[0m"
}

module.exports = {
    log: (text, type) => {
        let path = './dbs/logs/';
        switch(type){
            case 'vk': {
                path += 'vk-logs.log';
                break;
            }
            default: {
                return console.log(text);
            }
        }
        let data = fs.readFileSync(path, {encoding: "utf-8"});
        let message = `[${time().format('HH:mm:ss, DD.MM.YYYY')}] | [${type}] >> ${text}`;
        console.log(`${col.green}${message}${col.reset}`);
        return fs.writeFileSync(path, data + '\n' + message, {encoding: "utf-8"});
    },
    error: (text, type) => {
        let path = './dbs/logs/';
        switch(type){
            case 'vk': {
                path += 'vk-errors.log';
                break;
            }
            default: {
                return console.log(text);
            }
        }
        let data = fs.readFileSync(path, {encoding: "utf-8"});
        let message = `[${time().format('HH:mm:ss, DD.MM.YYYY')}] | [${type}] >> ${text}`;
        console.log(`${col.red}${message}${col.reset}`);
        return fs.writeFileSync(path, data + '\n' + message, {encoding: "utf-8"});
    },
    warn: (text, type) => {
        let path = './dbs/logs/';
        switch(type){
            case 'vk': {
                path += 'vk-warns.log';
                break;
            }
            default: {
                return console.log(text);
            }
        }
        let data = fs.readFileSync(path, {encoding: "utf-8"});
        let message = `[${time().format('HH:mm:ss, DD.MM.YYYY')}] | [${type}] >> ${text}`;
        console.log(`${col.yellow}${message}${col.reset}`);
        return fs.writeFileSync(path, data + '\n' + message, {encoding: "utf-8"});
    },
    debug: (text) => {
        let message = `[${time().format('HH:mm:ss, DD.MM.YYYY')}] | [DEBUG] >> ${text}`;
        return console.log(message);
    }
}  
