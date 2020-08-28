const { vk, app, http, cfg, logger, ngrok, io } = require('../index');
const fs = require('fs');

fs.writeFileSync('./dbs/server-db/ngrok.site', 'Панель не работает!');


http.listen(cfg.server.port, () => {
    logger.log(`Express Started`, 'app');
    logger.log(`IO Started`, 'app');
    vk.updates.start().then((data)=>{
        logger.log(`VK Started`, 'vk');
    }).catch((e)=>{
        logger.error(`VK Not Started >> ${e.message}`, 'vk');
    });
    ngrok.connect({
        proto: 'http',
        addr: cfg.server.port,
        region: 'eu',
        onStatusChange: (status) => {},
        onLogEvent: (event) => {}
    }).then((data)=>{
        fs.writeFileSync('./dbs/server-db/ngrok.site', data);
        logger.log(`NGROK Started >> ${data}`, 'app');
    }).catch((e)=>{
        logger.error(`NGROK Error >> ${e.message}`, 'app');
    });
});
