const { vk, cfg, logger } = require('../index');
const fs = require('fs');

vk.updates.start().then((data)=>{
    logger.log(`VK Started`, 'vk');
}).catch((e)=>{
    logger.error(`VK Not Started >> ${e.message}`, 'vk');
});
