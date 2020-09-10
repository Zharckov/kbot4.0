const fs = require('fs');

function findOBJ (array, key, value){
    if(!Array.isArray(array)){ throw Error('It\'s isn\'t array!');}
    for(let i = 0; i < array.length; i++){
        if(array[i][key] == value){
            return {
                ind: i,
                arr: array,
                el: array[i]
            };
        }
    }
    return false;
}

function formatUptime (time){
    function pad(s){
        return (s < 10 ? '0' : '') + s;
    }
    let hours = Math.floor(time / (60*60));
    let minutes = Math.floor(time % (60*60) / 60);
    let seconds = Math.floor(time % 60);
    return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
}

function isAdmin (id){
    let admins = JSON.parse(fs.readFileSync('./dbs/server-db/admins.json'));
    return findOBJ(admins, 'id', id);
}

function addAdmin(id, name){
    let admins = JSON.parse(fs.readFileSync('./dbs/server-db/admins.json'));
    if(!findOBJ(admins, 'id', id)){
        admins.push({
            id: id,
            name: name
        });
        fs.writeFileSync('./dbs/server-db/admins.json', JSON.stringify(admins, '',4));
        return 1;
    } else {
        return 0;
    }
}

function delAdmin(id){
    let admins = JSON.parse(fs.readFileSync(`${__dirname}/../dbs/server-db/admins.json`));
    let info = findOBJ(admins, 'id', id);
    if(info){
        admins.splice(info.ind, 1);
        fs.writeFileSync(`${__dirname}/../dbs/server-db/admins.json`, JSON.stringify(admins, '', 4));
        return 1;
    } else {
        return 0;
    }
}

module.exports = {
    findOBJ, formatUptime, isAdmin, addAdmin, delAdmin
}