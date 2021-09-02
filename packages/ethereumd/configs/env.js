

/*
 Since there are different user types, config requires an order of precedence
 1st: setupConfig,
 2nd: environment,
 3rd: hard-coded URLs
*/



let config = {
    //api settings
    PORT     : process.env['PORT']     || 3010,
    NODE_ENV : process.env['NODE_ENV'] || 'dev',
    SECRET   : process.env['SECRET:']  || '1234',


    //db settings
    MONGO_IP      : process.env['MONGO_IP']      || '127.0.0.1',
    REDIS_IP      : process.env['REDIS_IP']      || '127.0.0.1',
    REDIS_PORT    : process.env['REDIS_PORT']    ||  6379,

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

    //coins
    BTC:process.env['BTC'] || true,
    LTC:process.env['LTC'] || true,
    ETH:process.env['ETH'] || true,
    GNT:process.env['ETH'] || true,

    //dust
    DUST:{
        ETH: process.env['DUST_ETH'] || 0.001,
        LTC: process.env['DUST_LTC'] || 0.001,
        BTC: process.env['DUST_BTC'] || 0.0001,
        GNT: process.env['DUST_BTC'] || 0.01,
    },

    //wallets
    MNEMONIC:process.env['MNEMONIC'],

    //forced coinbase
    COINBASE_PUB:process.env['COINBASE_PUB'],
    COINBASE_PRIV:process.env['COINBASE_PRIV'],

    ETH_DAEMON: {
        host: process.env['ETH_DAEMON_HOST'],
        port: process.env['ETH_DAEMON_PORT'],
        user: process.env['ETH_DAEMON_USER'],
        pass: process.env['ETH_DAEMON_PASS'],
        unlock: process.env['ETH_DAEMON_UNLOCK'] || '123',
        websocketport: process.env['ETH_DAEMON_WEBSOCKETPORT']
    },

    //Notify
    WALLET_NOTIFY_URL: process.env['WALLET_NOTIFY_URL'] || "http://127.0.0.1:3000"

}

module.exports = config
