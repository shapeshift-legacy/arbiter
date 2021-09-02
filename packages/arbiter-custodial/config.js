
/*
 Since there are different user types, config requires an order of precedence
 1st: setupConfig,
 2nd: environment,
 3rd: hard-coded URLs
*/
const log = require('@arbiter/dumb-lumberjack')()
log.debug(`process.env`, process.env)


let BTC_CLONES, ETH_TOKENS

try {
    if(!process.env.BTC_CLONES) throw Error("101: Invalid config! missing BTC_CLONES!")
    BTC_CLONES = process.env.BTC_CLONES.split(",")
} catch (ex) {
    log.debug(`error checking env for BTC_CLONES`, ex)
}

try {
    if(!process.env.ETH_TOKENS) throw Error("101: Invalid config! missing ETH_TOKENS!")
    ETH_TOKENS = process.env.ETH_TOKENS.split(",")
} catch (ex) {
    log.debug(`error checking env for ETH_TOKENS`, ex)
}

const DEFAULT_BASE_MIN_SIZE = process.env.DEFAULT_BASE_MIN_SIZE || "0.00000001"
const DEFAULT_BASE_MAX_SIZE = process.env.DEFAULT_BASE_MAX_SIZE || "21000000"
const DEFAULT_QUOTE_INCREMENT = process.env.DEFAULT_QUOTE_INCREMENT || "0.0001"

const getMarketsConfig = () => {
    try {
        if(!process.env.MARKETS) throw Error("101: Invalid config! missing MARKETS!")
        let markets = process.env.MARKETS.split(",")
        let pairs = new Set()
        let coins = new Set()

        markets = markets.map(market => {
            market = market.toUpperCase()
            let [ base, quote ] = market.split("_")
            let pair1 = `${quote}_${base}`
            let pair2 = `${base}_${quote}`

            pairs.add(pair1)
            pairs.add(pair2)

            coins.add(quote)
            coins.add(base)

            return {
                pair1,
                pair2,
                base_currency: base,
                quote_currency: quote,
                // e.g., override with BTC_LTC_BASE_MIN_SIZE=0.0001
                base_min_size: process.env[`${quote}_${base}_BASE_MIN_SIZE`] || DEFAULT_BASE_MIN_SIZE,
                // e.g., override with BTC_LTC_BASE_MAX_SIZE=10000
                base_max_size: process.env[`${quote}_${base}_BASE_MAX_SIZE`] || DEFAULT_BASE_MAX_SIZE,
                // e.g., override according to pattern above
                quote_increment: process.env[`${quote}_${base}_QUOTE_INCREMENT`] || DEFAULT_QUOTE_INCREMENT
            }
        })

        return {
            markets,
            coins: Array.from(coins),
            pairs: Array.from(pairs)
        }
    } catch (ex) {
        let msg = `error setting up markets, aborting: ${ex.message}`
        log.error(msg, ex)
        throw msg
    }
}

const MARKETS_CONFIG = getMarketsConfig()


let config = {
    // api settings
    PORT: process.env['PORT'] || 3000,
    NODE_ENV: process.env['NODE_ENV'] || 'dev',
    SECRET: process.env['SECRET'] || '1234',
    MARKETS: MARKETS_CONFIG.markets,
    COINS: MARKETS_CONFIG.coins,
    PAIRS: MARKETS_CONFIG.pairs,

    // core if
    ARBITER_CORE_IP: process.env['ARBITER_CORE_IP'] || '127.0.0.1',
    ARBITER_CORE_PORT: process.env['ARBITER_CORE_PORT'] || 3010,

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
    },



}

module.exports = config
