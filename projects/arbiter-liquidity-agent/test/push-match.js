

const util = require('../modules/redis')
//const redis = util.redis
const publisher = util.publisher




let match = { market: 'LTC_BTC',
    orderId: '71c83345-bff1-4d91-83b2-c7a9558306bf',
    event: 'trade',
    time: 1530906746617,
    type: 'bid',
    quantity: 0.03604172,
    price: '0.012602' }

publisher.publish("trade",JSON.stringify(match))