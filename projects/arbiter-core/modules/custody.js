/*
    Custody API auditing

    Chain of custody on all non-swap-order funds

    Goals:

    maintains pubsub on all events

    maintains in memory real time balance object exportable on all accounts

    audits and maintains completeness assertion on all custodial accounts


 */

const TAG = " | custody | "
const log = require('@arbiter/dumb-lumberjack')()
const config = require("../configs/env")
const util = require('@arbiter/arb-redis')
const redis = util.redis
let publisher = util.publisher
let subscriber = util.subscriber
const Big = require('big.js')

/*

    MONGO

        fomo schema
  [
        'arbiterLa-balances',
        'arbiterLa-credits',
        'arbiterLa-debits',
        'arbiterLa-transfers',
        'arbiterLa-trades',
        'arbiterLa-txs',
        'arbiterLa-history',
        'arbiterLa-queries',
  ]

*/

let mongo = require('@arbiter/arb-mongo')
let views = require('@arbiter/arb-views')
//let diffTool = require('@arbiter/coin-diff-tool')
let signing = require('@arbiter/arb-signing')
let audit = require('./audit.js')


const SATOSHI = 100000000
/**************************************
 // Module
 //*************************************/

module.exports = {
    initialize: function () {
        return initialize_service();
    },
    // status: function () {
    //     return view_status();
    // },
    // exchanges: function () {
    //     return exchangeNames;
    // },
    // coins: async function () {
    //     return await arbiterLa.coins();
    // },
    // clearDB: function () {
    //     return reset_database();
    // },
    // markets: function () {
    //     return exchangeNames;
    // },
    // balances: function (exchange) {
    //     return get_balance(exchange);
    // },
    // estimateUSD: function (exchange) {
    //     return get_usd_value(exchange);
    // },
    // estimateUSDValueOfBalances: function (balances) {
    //     return arbiterLa.estimateUSDValueOfBalances(balances);
    // },
    // trade: function (exchange, type, coin, amount, price) {
    //     return trade_controler(exchange, type, coin, amount, price);
    // },
    // withdraw: function (exchange, coin, address, amount) {
    //     return withdraw_from_exchange(exchange, coin, address, amount);
    // },
    // audit: function () {
    //     return audit.auditAccount('arbiterLa');
    // },
    // buildTXdb: function () {
    //     return rebuild_exchange_history();
    // },
    // auditTransfers: function (coin) {
    //     return audit_transfers(coin);
    // },
    // auditTrades: function (market) {
    //     return audit_trades(market);
    // },
    // auditAllTransfers: function () {
    //     return audit_all_transfers();
    // },
    // auditAllTrades: function () {
    //     return audit_all_trades();
    // },
}

/**************************************
 // Primary
 //*************************************/


/*

      Get last checkpoint

      check signature

      if pass
        Get current balances
        get transactions from checkpoint
        replay transactions
        if within tolerance start


    if no checkpoint,
        Build from scratch

 */

let initialize_service = async function () {
    let tag = TAG + ' | initialize_service | '
    try {
        let successStart = false
        await verify_tx_db()
        // HACK single LA account
        // TODO mutiple accounts

        //get balance in redis
        //let balancesRedis = await redis.hgetall(config.AGENT_BTC_MASTER)
        //let balancesRedis = await redis.hgetall('mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL')
        let balancesRedis = await get_balance_native('mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL')
        log.debug(tag,"balancesRedis: ",balancesRedis)

        //get oldest history object
        let checkpoint = await mongo['arbiterLa-balances'].findOne({},{sort:{nonce:-1}})
        log.info(tag,"checkpoint: ",checkpoint)

        //if no history rebuild
        if(!checkpoint){
            views.displayStringToChannel("No Checkpoints found! rebuilding history!",'help')

            //get all trades
            let allTrades = await mongo['arbiterLa-trades'].find()
            log.debug(tag,"allTrades: ",allTrades)

            //get all transfers
            let allTransfers = await mongo['arbiterLa-transfers'].find()
            log.debug(tag,"allTransfers: ",allTransfers)

            //get all transfers
            let allCancels = await mongo['arbiterLa-cancels'].find()
            log.debug(tag,"allCancels: ",allCancels)

            //get all tx's
            let allTxs = await mongo['arbiterLa-txs'].find()
            log.debug(tag,"allTxs: ",allTxs)

            // TODO handle if missing? rebuild?
            if(allTxs.length === 0) await build_tx_db(allTransfers,allTrades,allCancels)

            //if no mongo data
            // AND balances show value ERROR 666
            if(allTransfers.length === 0 && balancesRedis){
                //TODO audit wallet and find deposits
                // You have moniez but cant prove the source of funds. THROW
                throw Error("666: no tx history! no reference to rebuild it! history is lost! you are fucked! Goodbye dave, this conversation can no longer serve a purpose")
            } else if(allTransfers.length === 0 && !balancesRedis){
                log.info(tag," Fresh account detected! no need for audit! ")
                //if no mongo AND empty balances
                //fresh start
                //allow to startup
                successStart = true
            } else if(balancesRedis){
                log.info(tag," Rebuilding history and auditing! ")
                //rebuild

                //replay tx's via audit module
                let auditReport = await audit.auditAccount()
                log.debug(tag,"auditReport: ",auditReport)
                log.debug(tag,"auditReport balances: ",auditReport.balances)
                log.debug(tag,"balancesRedis: ",balancesRedis)
                //if reported is within tolerance of local

                //find differences
                let balanceDiffs = await diffTool(balancesRedis,auditReport.balances)
                log.debug(tag,"diff: ",balanceDiffs)

                //TODO check all not just btc
                if(balanceDiffs.complete){
                    successStart = true
                } else {
                    //666 error
                    throw Error("666: unable to audit! invalid tx's! completeness assertion failed")
                }
            } else {
                log.info(tag," Rebuilding history and auditing! ")

                // Redis is empty, but we have data, populate redis assume audit success
                let auditReport = await audit.auditAccount()
                log.debug(tag,"auditReport: ",auditReport)
                log.debug(tag,"auditReport: ",auditReport.balances)

                //update redis
                throw Error('103: unhandled case TODO')
            }



            //if empty tx's
            //dump all into tx's
            //audit

            //txs founds?
            // let txs = await mongo['arbiterLa-txs'].find()
            // log.debug(tag,"txs: ",txs)
            // if(txs.length === 0){
            //     views.displayStringToChannel("No tx history found! unable to rebuild history!",'help')
            //     //you are fucked lol
            //     //TODO backups???
            //     throw Error("666: no tx history! no reference to rebuild it! history is lost! you are fucked! Goodbye dave, this conversation can no longer serve a purpose")
            // }

            //replay all events

            //if balance === reported

        } else {
            log.info(tag," Checkpoint found!!! ")
            //validate checkpoint
            //Get current balances
            //get transactions from checkpoint
            //replay transactions
            //if within tolerance start
            let balanceDiffs = await diffTool(balancesRedis,checkpoint.balances)
            log.debug(tag,"diff: ",balanceDiffs)


            if(balanceDiffs.complete){
                successStart = true
            } else {
                await verify_tx_db()
                let auditReport = await audit.auditAccount()

                //initialize_service()


                //replay tx's via audit module
                //TODO
                //AUDIT check from checkpoint to now

                //if balances

                //else rebuild audit from start?

                //if still fail 666 error
                throw Error("106 TODO finish me!")
            }
        }


        if(successStart){
            let body = ":on_button: STARTUP successfull Audit matched reported!"
            //let body = ":on_button: STARTUP successfull Audit matched reported! credits:"+creditsAll.length+" debits:"+debitsAll.length+" :arbiterLa:  startup balances: "+balances.BTC+" (:BTC:) ("+(await get_value(balances.BTC,"BTC")).toFixed(2)+"(USD))  "+balances.LTC+" (:LTC:) ("+(await get_value(balances.LTC,"LTC")).toFixed(2)+"(USD))"
            log.info(tag,"startup: ",body)
            views.displayStringToChannel(body,'help')
        } else {
            views.displayStringToChannel("failed to start! :fail: ",'help')
        }

        return true
    } catch (e) {
        //If unable to start, begin audit
        //rebuild_exchange_history()
        console.error(tag, 'ERROR: ', e)
        throw e
    }
}


/**************************************
 // lib
 //*************************************/

//verify tx db
let verify_tx_db = async function(){
    let tag = TAG+' | verify_tx_db | '
    try{
        let output = {}

        //get all trades
        let allTrades = await mongo['arbiterLa-trades'].find()
        log.debug(tag,"allTrades: ",allTrades.length)

        //get all transfers
        let allTransfers = await mongo['arbiterLa-transfers'].find()
        log.debug(tag,"allTransfers: ",allTransfers.length)

        //get all transfers
        let allCancels = await mongo['arbiterLa-cancels'].find()
        log.debug(tag,"allTransfers: ",allCancels.length)


        //get all tx's
        let allTxs = await mongo['arbiterLa-txs'].find()
        log.debug(tag,"allTxs: ",allTxs.length)

        let totalEntries = allTrades.length + allTransfers.length + allCancels.length
        if(totalEntries != allTxs.length){
            log.debug(tag,"building tx db!")
            try{
                await build_tx_db(allTransfers, allTrades, allCancels)
                output.rebuild = true
            }catch(e){
            }

        } else {
            output.valid = true
        }


        return output
    }catch(e){
        log.error(e)
        throw e
    }
}

//rebuild balance history


//TODO build from nonce



//get balance native
let get_balance_native = async function(account){
    try{
        let output = {}
        //
        let balancesSat = await redis.hgetall(account)
        if(!balancesSat) return null
        //iterate over object
        let coins = Object.keys(balancesSat)
        for(let i = 0; i < coins.length; i++){
            output[coins[i]] = balancesSat[coins[i]]/ SATOSHI
        }

        return output
    }catch(e){
        log.error(e)
        throw e
    }
}


let diffTool = function(balancesLocal,balancesRemote){
    let tag = TAG + " | diffToll | "
    let longest
    let longestKeys
    //dont let nonce break
    delete balancesLocal.nonce
    delete balancesRemote.nonce

    let keysLocal = Object.keys(balancesRemote)
    let keysRemote = Object.keys(balancesLocal)



    if(keysLocal.length > keysRemote.length){
        longest = balancesRemote
        longestKeys = keysLocal
    } else {
        longest = balancesRemote
        longestKeys = keysRemote
    }
    let output = {}
    output.complete = true
    //iterate over longest
    for(let i = 0; i < longestKeys.length; i++){
        let asset = longestKeys[i]
        if(!balancesLocal[asset]) balancesLocal[asset] = 0
        if(!balancesRemote[asset]) balancesRemote[asset] = 0

        let roundedLocal  = Big(balancesLocal[asset])
        let roundedRemote = Big(balancesRemote[asset])
        log.debug(tag,asset,"roundedLocal: ",roundedLocal.toString())
        log.debug(tag,asset,"balancesRemote: ",roundedRemote.toString())

        log.info(tag,asset,"roundedLocal: ",roundedLocal.round(6).toString())
        log.info(tag,asset,"balancesRemote: ",roundedRemote.round(6).toString())

        //TODO take this to 8 baby every satoshi accounted for
        if(roundedLocal.round(6).toString() == roundedRemote.round(6).toString()){
            output[asset] = "WINNING!!! MATCH!"
        } else {
            output.complete = false
            let diff = {
                remote:balancesRemote[asset],
                local:balancesLocal[asset],
                diff:roundedLocal - roundedLocal
            }
            output[asset] = diff
        }

    }
    return output
}


let build_tx_db = async function (allTransfers,allTrades,allCancels) {
    let tag = TAG + ' | build_tx_db | '
    try {
        //dump transfers AND trades into tx's
        for(let i = 0; i < allTransfers.length; i++){
            let entry = allTransfers[i]
            entry.transfer = true
            try{
                await mongo['arbiterLa-txs'].insert(entry)
            }catch(e){
            }

        }
        for(let i = 0; i < allCancels.length; i++){
            let entry = allCancels[i]
            entry.transfer = true
            try{
                await mongo['arbiterLa-txs'].insert(entry)
            }catch(e){
            }

        }
        for(let i = 0; i < allTrades.length; i++){
            try{
                await mongo['arbiterLa-txs'].insert(entry)
            }catch(e){
            }
        }

        return true
    } catch (e) {
        console.error(tag, 'ERROR: ', e)
        throw 'ERROR:BALANCE:100 failed to find balance'
    }
}
