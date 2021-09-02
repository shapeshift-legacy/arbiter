
/*
 Since there are different user types, config requires an order of precedence
 1st: setupConfig,
 2nd: environment,
 3rd: hard-coded URLs
*/

require('dotenv').config()


let config = {
    // api settings
    PORT: process.env['PORT'] || 3000,
    NODE_ENV: process.env['NODE_ENV'] || 'dev',
    SECRET: process.env['SECRET'] || '1234',

    // core if
    ARBITER_CORE_IP: process.env['ARBITER_CORE_IP'] || '127.0.0.1',
    ARBITER_CORE_PORT: process.env['ARBITER_CORE_PORT'] || 3010,

    ARBITER_URL: process.env['ARBITER_URL'] || 'https://127.0.0.1:3000',

    // exchanges
    BINANCE_PUBLIC: process.env['BINANCE_PUBLIC'] || 'notset',
    BINANCE_PRIVATE: process.env['BINANCE_PRIVATE'] || 'notset',

    // arbiter
    ARBITER_SIGNING: process.env['ARBITER_SIGNING'] || '',
    ARBITER_MASTER_ETH: process.env['ARBITER_MASTER_ETH'] || '',

    // signing privkey
    AGENT_BTC_MASTER: process.env['AGENT_BTC_MASTER'] || '',
    AGENT_BTC_SIGNING_PRIVKEY: process.env['AGENT_BTC_SIGNING_PRIVKEY'] || '',

    // db settings
    MONGO_IP: process.env['MONGO_IP'] || '127.0.0.1',
    MONGO_PORT: process.env['MONGO_PORT'] || '27017',
    REDIS_IP: process.env['REDIS_IP'] || '127.0.0.1',
    REDIS_PORT: process.env['REDIS_PORT'] || 6379,

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

    AGENT_BTC_MASTER: "mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK",

    MASTER_BTC:"",
    MASTER_LTC:"",
    MASTER_ETH:"",

    FEE_BTC: 0.0005,
    FEE_LTC: 0.0016704,

    MONGO_IP: process.env['MONGO_IP'] || '127.0.0.1',
    REDIS_IP: process.env['REDIS_IP'] || '127.0.0.1',
    REDIS_PORT: process.env['REDIS_PORT'] || 6379,


    SLACK_TOKEN: "",
    SLACK_CHANNEL_NAME: "team-arbiter",

    TRADE_PORT_LTC_BTC: 5000,
    TRADE_PORT_ETH_BTC: 5001,
    TRADE_PORT_GNT_BTC: 5002,

    MARKETS: process.env['MARKETS'],

    BTC_ALLOCATION_FOR_MARKETS: {
        LTC_BTC: process.env['BTC_ALLOCATION_PERCENTAGE_LTC_BTC'],
        ETH_BTC: process.env['BTC_ALLOCATION_PERCENTAGE_ETH_BTC'],
        GNT_BTC: process.env['BTC_ALLOCATION_PERCENTAGE_GNT_BTC']
    },

    COINS: ['BTC', 'LTC', 'ETH, GNT'],
    ETH_TOKENS: ['GNT'],
    BTC_CLONES: "LTC,BTC",


// daemon
    // BTC_DAEMON: {
    //     host: process.env['BTC_DAEMON_HOST'],
    //     port: process.env['BTC_DAEMON_PORT'],
    //     user: process.env['BTC_DAEMON_USER'],
    //     pass: process.env['BTC_DAEMON_PASS']
    // },
    //
    // LTC_DAEMON: {
    //     host: process.env['LTC_DAEMON_HOST'],
    //     port: process.env['LTC_DAEMON_PORT'],
    //     user: process.env['LTC_DAEMON_USER'],
    //     pass: process.env['LTC_DAEMON_PASS']
    // },
    //
    // ETH_DAEMON: {
    //     host: process.env['ETH_DAEMON_HOST'],
    //     port: process.env['ETH_DAEMON_PORT'],
    //     user: process.env['ETH_DAEMON_USER'],
    //     pass: process.env['ETH_DAEMON_PASS'],
    //     websocketport: process.env['ETH_DAEMON_WEBSOCKETPORT']
    // },

    EXCHANGE_PAIRS: { // coin pairs handled by an exchange
        // internally we always use ALT_PRIMARY so PPC_BTC, DOGE_BTC
        primary: 'BTC',
        alts: {
            btce: ['LTC', 'PPC', 'NMC', 'NVC'],
            bittrex: ['BTCD', 'BLK', 'BTS', 'DAO', 'DGB', 'DOGE', 'EMC', 'LTC', 'MONA', 'FTC', 'NAV', 'NEOS', 'NXT', 'POT', 'RDD', 'SDC', 'START', 'UNO', 'VIA', 'VRC', 'XAI', 'TRON', 'MONA', 'VTC', 'IOC', 'NEOS', 'TRON', 'ARCH', 'HYPER', 'FLO'],
            poloniex: ['DAO', 'FCT', 'NXT', 'LTC', 'XRP', 'NBT', 'BTS', 'DOGE', 'VRC', 'DRK', 'POT', 'MINT', 'CLAM', 'XMR', 'XCP', 'SWARM', 'MSC', 'SJCX', 'GEMZ', 'IFC', 'STR', 'MAID', 'FLO', 'ETH', 'BCY'],
            yunbi: ['DGD'],
            bitfinex: ['USDT', 'LTC'],
            kraken: ['BTC', 'ETH'],
        }
    }

}

module.exports = config
