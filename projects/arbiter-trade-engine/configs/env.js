
/*
 Since there are different user types, configs requires an order of precedence
 1st: setupConfig,
 2nd: environment,
 3rd: hard-coded URLs
*/

let config = {
    // api settings
    PORT: process.env['PORT'] || 3000,
    NODE_ENV: process.env['NODE_ENV'] || 'dev',
    SECRET: process.env['SECRET:'] || '1234',

    // logging
    //Liquidity agent
    AGENT_BTC_MASTER: process.env['AGENT_BTC_MASTER'] || "",

    // oracle
    ORACLE_IP: process.env['ORACLE_IP'] || '127.0.0.1',
    ORACLE_PORT: process.env['ORACLE_PORT'] || 5555,
    ORACLE_MASTER_ETH: process.env['ORACLE_MASTER_ETH'] || '',
    ORACLE_SIGNING: process.env['ORACLE_SIGNING'] || '',

    // arbiter
    ARBITER_SIGNING: process.env['ARBITER_SIGNING'] || '',
    ARBITER_MASTER_ETH: process.env['ARBITER_MASTER_ETH'] || '',

    // db settings
    MONGO_IP: process.env['MONGO_IP'] || '127.0.0.1',
    REDIS_IP: process.env['REDIS_IP'] || '127.0.0.1',
    REDIS_PORT: process.env['REDIS_PORT'] || 6379,

    // services
    TRADE_IP: process.env['TRADE_IP'] || '127.0.0.1',
    TRADE_PORTS : {
        "LTC_BTC": process.env['TRADE_PORT_LTC_BTC'] || 3000,
        "ETH_BTC": process.env['TRADE_PORT_ETH_BTC'] || 3001,
        "GNT_BTC": process.env['TRADE_PORT_GNT_BTC'] || 3002
    },

    // coins
    BTC: process.env['BTC'] || true,
    LTC: process.env['LTC'] || true,
    ETH: process.env['ETH'] || true,

    // dust
    DUST: {
        ETH: process.env['DUST_ETH'] || 0.001,
        LTC: process.env['DUST_LTC'] || 0.001,
        BTC: process.env['DUST_BTC'] || 0.0001,
    },

    // daemon
    BTC_DAEMON: {
        host: process.env['BTC_DAEMON_HOST'],
        port: process.env['BTC_DAEMON_PORT'],
        user: process.env['BTC_DAEMON_USER'],
        pass: process.env['BTC_DAEMON_PASS']
    },

    LTC_DAEMON: {
        host: process.env['LTC_DAEMON_HOST'],
        port: process.env['LTC_DAEMON_PORT'],
        user: process.env['LTC_DAEMON_USER'],
        pass: process.env['LTC_DAEMON_PASS']
    },

    ETH_DAEMON: {
        host: process.env['ETH_DAEMON_HOST'],
        port: process.env['ETH_DAEMON_PORT'],
        user: process.env['ETH_DAEMON_USER'],
        pass: process.env['ETH_DAEMON_PASS'],
        websocketport: process.env['ETH_DAEMON_WEBSOCKETPORT']
    }

}

module.exports = config
