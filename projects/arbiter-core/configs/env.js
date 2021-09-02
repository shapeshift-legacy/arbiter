

/*
 Since there are different user types, config requires an order of precedence
 1st: setupConfig,
 2nd: environment,
 3rd: hard-coded URLs
*/

const log = require('@arbiter/dumb-lumberjack')()
//log.debug(`process.env`, process.env)

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
    //api settings
    PORT     : process.env['PORT']     || 3000,
    PORT_CORE: process.env['PORT_CORE']|| 3010,
    HOST_CORE: process.env['PORT_CORE']|| '127.0.0.1',
    NODE_ENV : process.env['NODE_ENV'] || 'dev',
    SECRET   : process.env['SECRET:']  || '1234',
    VALIDATE_SIGS: process.env['VALIDATE_SIGS'] === "false" ? false : true,
    WALLET_FACTORY_ADDRESS: process.env['WALLET_FACTORY_ADDRESS'] || 'notset',
    BTC_CLONES: BTC_CLONES || ['BTC','LTC','DGB','DOGE','DASH','BCH'],
    ETH_TOKENS: ETH_TOKENS || ["1ST","ANT","BAT","BNT","CVC","DGD","DNT","EDG","EOS","FUN","GNO","GNT","GUP","ICN","MLN","MTL","NMR","OMG","PAY","QTUM","RCN","REP","RLC","SALT","SNGLS","SNT","STORJ","SWT","TKN","TRST","WINGS","ZRX"],
    MARKETS: MARKETS_CONFIG.markets,
    COINS: MARKETS_CONFIG.coins,
    PAIRS: MARKETS_CONFIG.pairs,

    //Master addresses
    MASTER_LTC : process.env['MASTER_LTC']         || process.env['ARBITER_MASTER_LTC'],
    MASTER_BTC : process.env['MASTER_BTC']         || process.env['ARBITER_MASTER_BTC'],
    MASTER_ETH : process.env['MASTER_ETH']         || process.env['ARBITER_MASTER_ETH'],
    MASTER_GNT : process.env['MASTER_GNT']         || process.env['ARBITER_MASTER_GNT'],

    //oracle
    ORACLE_IP        : process.env['ORACLE_IP']         || '127.0.0.1',
    ORACLE_PORT      : process.env['ORACLE_PORT']       || 5555,
    ORACLE_MASTER_ETH: process.env['ORACLE_MASTER_ETH'] || "",
    ORACLE_SIGNING   : process.env['ORACLE_SIGNING']    || "",

    //arbiter
    ARBITER_SIGNING   : process.env['ARBITER_SIGNING']    || "",
    ARBITER_MASTER_ETH: process.env['ARBITER_MASTER_ETH'] || "master_eth_placeholder",

    //Liquidity agent
    AGENT_BTC_MASTER: process.env['AGENT_BTC_MASTER'] || "",
    AGENT_BTC_SIGNING_PRIVKEY: process.env['AGENT_BTC_SIGNING_PRIVKEY'] || "",

    //db settings
    MONGO_IP      : process.env['MONGO_IP']      || '127.0.0.1',
    REDIS_IP      : process.env['REDIS_IP']      || '127.0.0.1',
    REDIS_PORT    : process.env['REDIS_PORT']    ||  6379,

    //services
    TRADE_IP    : process.env['TRADE_IP']    ||  '127.0.0.1',
    TRADE_PORTS : {
        "LTC_BTC": process.env['TRADE_PORT_LTC_BTC'] || 3000,
        "ETH_BTC": process.env['TRADE_PORT_ETH_BTC'] || 3001,
        "GNT_BTC": process.env['TRADE_PORT_GNT_BTC'] || 3002
    },
    TRADE_PORT_LTC:5000,
    TRADE_PORT_ETH:5001,

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

    //dust TODO improve
    DUST:{
        ETH: process.env['DUST_ETH'] || 0.001,
        LTC: process.env['DUST_LTC'] || 0.001,
        BTC: process.env['DUST_BTC'] || 0.0001,
        GNT: process.env['DUST_BTC'] || 0.01,
    },

    //fees TODO improve
    FEE_BTC:process.env['FEE_BTC']  || 0.0005,
    FEE_LTC: process.env['FEE_LTC'] || 0.0016704,

    //slack
    SLACK_TOKEN   : process.env['SLACK_TOKEN']   || "NOT SET",
    SLACK_BOT_NAME: process.env['SLACK_BOT_NAME']|| "Mr Bot",
    SLACK_CHANNEL_NAME : process.env['SLACK_CHANNEL_NAME'] || "general",
    SLACK_CHANNEL_NAME_REPORTS : process.env['SLACK_CHANNEL_NAME_REPORTS'] || "finance-toolkit",
    SLACK_CHANNEL_ID : process.env['SLACK_CHANNEL_ID'] || "general",
    SLACK_CHANNEL_TYPE : process.env['SLACK_CHANNEL_TYPE'] || false,

    //Notify
    WALLET_NOTIFY_URL: process.env['WALLET_NOTIFY_URL'] || "http://127.0.0.1:3000"

}

module.exports = config
