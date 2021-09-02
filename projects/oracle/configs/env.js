

/*
 Since there are different user types, config requires an order of precedence
 1st: setupConfig,
 2nd: environment,
 3rd: hard-coded URLs
*/


let config = {
    //api settings
    PORT     : process.env['PORT']     || 3000,
    NODE_ENV : process.env['NODE_ENV'] || 'dev',
    SECRET   : process.env['SECRET:']  || '1234',
    LOCAL_SSL_CERT_PATH: process.env['LOCAL_SSL_CERT_PATH'],
    LOCAL_SSL_KEY_PATH: process.env['LOCAL_SSL_KEY_PATH'],
    //oracle
    ORACLE_IP        : process.env['ORACLE_IP']         || '127.0.0.1',
    ORACLE_PORT      : process.env['ORACLE_PORT']       || 5555,
    ORACLE_MASTER_ETH: process.env['ORACLE_MASTER_ETH'] || "",
    ORACLE_SIGNING   : process.env['ORACLE_SIGNING']    || "",

    //arbiter
    ARBITER_SIGNING   : process.env['ARBITER_SIGNING']    || "",
    ARBITER_MASTER_ETH: process.env['ARBITER_MASTER_ETH'] || "",
    ARBITER_MASTER_LTC : process.env['MASTER_LTC']         || process.env['ARBITER_MASTER_LTC'],
    ARBITER_MASTER_BTC : process.env['MASTER_BTC']         || process.env['ARBITER_MASTER_BTC'],
    ARBITER_MASTER_GNT : process.env['MASTER_GNT']         || process.env['ARBITER_MASTER_GNT'],

    //db settings
    MONGO_IP      : process.env['MONGO_IP']      || '127.0.0.1',
    REDIS_IP      : process.env['REDIS_IP']      || '127.0.0.1',
    REDIS_PORT    : process.env['REDIS_PORT']    ||  6379,

    //services
    TRADE_IP    : process.env['TRADE_IP']    ||  '127.0.0.1',
    TRADE_PORTS: process.env['TRADE_PORTS']  || {
        "LTC_BTC":3000,
        "ETH_BTC":3001
    },

    //coins
    BTC:process.env['BTC'] || true,
    LTC:process.env['LTC'] || true,
    ETH:process.env['ETH'] || true,

    //dust
    DUST:{
        ETH: process.env['BTC_DAEMON_HOST'] || 0.001,
        LTC: process.env['BTC_DAEMON_HOST'] || 0.001,
        BTC: process.env['BTC_DAEMON_HOST'] || 0.0001
    }
}


module.exports = config
