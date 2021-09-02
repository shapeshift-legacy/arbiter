

/*
 Since there are different user types, configs requires an order of precedence
 1st: setupConfig,
 2nd: environment,
 3rd: hard-coded URLs
*/

let config = {
    //api settings
    PORT     : process.env['PORT']     || 3000,
    NODE_ENV : process.env['NODE_ENV'] || 'dev',
    SECRET   : process.env['SECRET']  || '1234',

    //exchanges
    BINANCE_PUBLIC: process.env['BINANCE_PUBLIC']  || 'notset',
    BINANCE_PRIVATE: process.env['BINANCE_PRIVATE']  || 'notset',


    //db settings
    MONGO_IP      : process.env['MONGO_IP']      || '127.0.0.1',
    REDIS_IP      : process.env['REDIS_IP']      || '127.0.0.1',
    REDIS_PORT    : process.env['REDIS_PORT']    ||  6379,
    CACHE_TIME : process.env['CACHE_TIME'] || 1000,
    AIRDROPS : {
        // ENJ:15.0,
        // GAS:0.1,
        // EON:0.8,
        // ADD:0.4,
        // MEETONE:0.4,
        // ADT:0.8,
        // EOP:0.8,
        // IQ:4.08,
        // VET:64.5,
        // VTHO:0.70404858,
        // ONG:0.00560790,
    },

    MONGO: {
        HOSTS: [{
            ip: process.env['MONGO_IP'] || '127.0.0.1',
            port: process.env['MONGO_PORT'] || 27017
            // }, {
            //     ip: '127.0.0.1',
            //     port: 27017
        }],
        DB: process.env['MONGO_DB_NAME'] || 'arbiter-mongo',
        OPTIONS: {
            // abc: 123,
            // replicaSet: 'rs01'
        }
    },


}

module.exports = config
