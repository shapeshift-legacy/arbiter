/*
    Audit for custodial API

    Forked from exchange-controler (BUT INCOMPATIBLE)

    TODO break apart similarities and modulize shared code!


    Goals:
        Replay all trade agent events and balance changes

 */
const TAG = " | AUDIT-custodial | "
const log = require('@arbiter/dumb-lumberjack')()
const config = require("../configs/env")
const history = require('@arbiter/arb-historical-prices')
const util = require('@arbiter/arb-redis')
const redis = util.redis
const publisher = util.publisher
const subscriber = util.subscriber

let views = require('@arbiter/arb-views')
let mongo = require('@arbiter/arb-mongo')
let signing = require('@arbiter/arb-signing')

module.exports = {
    auditAccount: function (account) {
        return audit_from_scratch(account);
    },
    auditEvent: function (trade, i, balances, balanceValuesBTC, balanceValuesUSD, prevBlock) {
        return audit_event(trade, i, balances, balanceValuesBTC, balanceValuesUSD, prevBlock);
    },
    // digestTrade: function (trade) {
    //     return digest_trade(trade);
    // },
    // digestTransfer: function (transfer) {
    //     return digest_transfer(transfer);
    // },
}




const audit_from_scratch = async function(account){
    let tag = TAG + " | audit_from_scratch | "
    try{
        log.info(tag,"checkpoint1")

        // TODO select DB based on account
        // All accounts have collection
        // collection is raw tx's
        views.displayStringToChannel("Auditing Custodial LA account! ",'help')

        //get all trades
        let allTxs = await mongo['arbiterLa-txs'].find({},{sort:{time:1}})
        if(allTxs.length === 0){
            //
            views.displayStringToChannel('ERROR: you MUST build TX db first!! ')
            throw Error("102: you MUST build tx database first! ")
        }
        views.displayStringToChannel("found TX database entries:  "+allTxs.length,'help')
        log.debug(tag,"allTrades: ",allTxs.length)
        //log.debug(tag,"allTrades: ",allTrades)

        // allTrades = allTrades.sort((a, b) => {
        //     return a['time'] < b['time'];
        // });

        //log.debug(tag,"allTrades: ",allTrades[0])

        //for each
        let prevBlock = "genesis"

        let balances = {}
        let balanceValuesBTC = {}
        let balanceValuesUSD = {}


        let blockchain = []
        //verify ALL have time
        //verify sorted from high to low
        //RULE: chronologically enforced accounting


        for(let i = 0;i < allTxs.length;i++){
            let tx = allTxs[i]

            let block = await audit_event(tx, i, balances, balanceValuesBTC, balanceValuesUSD, prevBlock)

            blockchain.push(block)
        }
        log.debug(tag,"blockchain: ",blockchain)




        return blockchain[blockchain.length - 1]
    }catch(e){
        views.displayStringToChannel("KILL ALL HUMANS!!! ERROR: "+e.toString(),'help')
        log.error(tag, e)
        throw e
    }
}

/*
    Audit Crypto account
            -highlander

    Completeness:
        ALL tx's


   Highlanders Strong accounting
        Nonce on all tx's applied to ledger
        Sign all leger updates
        chain of custody on all audits allowing checkpoints and quick starts against them.



 */


const audit_event = async function(trade, i, balances, balanceValuesBTC, balanceValuesUSD, prevBlock){
    let tag = TAG + " | do_work | "
    try{
        let totalUSDValue = 0
        let totalBTCValue = 0
        log.debug(tag,'trade: ',trade)
        log.debug(tag,'trade: ',trade.time)
        log.debug(tag,'trade: ',typeof(trade.time))
        log.debug(tag,'trade: ',new Date(trade.time).toDateString())
        let time = trade.time
        //rate USD at time of trade
        // let rateUSDBTC = await history.bestPrice("BTC",time)
        // log.debug(tag,'rateUSDBTC: ',rateUSDBTC)
        let rateUSDBTC = 6400
        log.debug(tag,'rateUSDBTC: ',rateUSDBTC)

        let txid
        if(trade.id){
            txid = trade.id
        } else if(trade.txid){
            txid = trade.txid
        }
        log.debug(tag,"txid: ",txid)
        let blockTemplate = {
            txid:trade.id,
            txs:[],
            credits:[],
            debits:[],
        }
        blockTemplate.txs.push(trade)
        //let normalizedEvents = normalized

        let credit
        let debit

        if(trade.transfer){
            log.debug(tag,' transfer detected ')

            if(!balances[trade.coin]) balances[trade.coin] = 0
            if(!balanceValuesBTC[trade.coin]) balanceValuesBTC[trade.coin] = 0
            if(!balanceValuesUSD[trade.coin]) balanceValuesUSD[trade.coin] = 0

            if(!trade.withdrawal){
                let credit = trade
                //TODO dont use parseFloat/ use bigInt
                balances[credit.coin] = balances[credit.coin] + parseFloat(credit.value)
                balanceValuesBTC[credit.coin] = balanceValuesBTC[credit.coin] + parseFloat(credit.value)
                balanceValuesUSD[credit.coin] = balanceValuesUSD[credit.coin] + parseFloat(credit.value * rateUSDBTC)
                log.info(tag,"(credit) deposit: + "+credit.value+" ("+credit.coin+") txid: ",credit.txid)
                blockTemplate.credits.push(credit)
            }else{
                //withdraw
                let debit = trade
                //TODO dont use parseFloat/ use bigInt
                balances[debit.coin] = balances[debit.coin] + parseFloat(debit.value)
                balanceValuesBTC[debit.coin] = balanceValuesBTC[debit.coin] + parseFloat(debit.value)
                balanceValuesUSD[debit.coin] = balanceValuesUSD[debit.coin] + parseFloat(debit.value * rateUSDBTC)

                blockTemplate.debits.push(debit)
            }

        } else {
            if(trade.match){
                log.debug(tag,' trade detected ')
                let events = await digest_trade(trade)
                log.debug(tag,"events: ",events)
                //credit:
                credit = events.credits[0]
                debit = events.debits[0]

                //
                if(credit) blockTemplate.credits.push(credit)
                if(debit) blockTemplate.debits.push(debit)

                //apply
                if(!balances[credit.coin]) balances[credit.coin] = 0
                if(!balanceValuesBTC[credit.coin]) balanceValuesBTC[credit.coin] = 0
                if(!balanceValuesUSD[credit.coin]) balanceValuesUSD[credit.coin] = 0
                if(!balanceValuesBTC[debit.coin]) balanceValuesBTC[debit.coin] = 0
                if(!balanceValuesUSD[debit.coin]) balanceValuesUSD[debit.coin] = 0


                if(!balances[debit.coin]) {
                    log.error(tag,"DEBUG OBJECT: ",{balances,trade,credit,debit})
                    throw Error("101: can't debit a coin you dont own!")
                }

                //native value balances
                balances[credit.coin] = balances[credit.coin] + parseFloat(credit.amount)
                balances[debit.coin] = balances[debit.coin] - parseFloat(debit.amount)

                //value BTC
                balanceValuesBTC[credit.coin] = balanceValuesBTC[credit.coin] + parseFloat(credit.valueBTC)
                balanceValuesBTC[debit.coin] = balanceValuesBTC[debit.coin] - parseFloat(debit.valueBTC)

                //value USD
                balanceValuesUSD[credit.coin] = balanceValuesUSD[credit.coin] + parseFloat(credit.valueUSD)
                balanceValuesUSD[debit.coin] = balanceValuesUSD[debit.coin] - parseFloat(debit.valueUSD)

                log.info(tag,"(credit) Acquisition: ",credit.amount," ",credit.coin,"  USD: ",credit.valueUSD)
                log.info(tag,"(debit) Disposial: ",debit.amount," ",debit.coin,"  USD: ",debit.valueUSD)
                log.debug(tag,"Balances:",JSON.stringify(balances))
            } else if(trade.event === 'submit'){
                //log.info(tag," Submit order! ")
                // TODO credit order (epic track orders indpendent from accounts)
                // debit account
                let debit = trade.debit
                log.debug(tag,"debit: ",debit)
                //apply
                if(!balances[debit.coin]) balances[debit.coin] = 0
                if(!balanceValuesBTC[debit.coin]) balanceValuesBTC[debit.coin] = 0
                if(!balanceValuesUSD[debit.coin]) balanceValuesUSD[debit.coin] = 0


                if(!balances[debit.coin]) {
                    log.error(tag,"DEBUG OBJECT: ",{balances,trade,credit,debit})
                    throw Error("101: can't debit a coin you dont own!")
                }

                //native value balances
                balances[debit.coin] = balances[debit.coin] - parseFloat(debit.amount)

                //value BTC
                balanceValuesBTC[debit.coin] = balanceValuesBTC[debit.coin] - parseFloat(debit.valueBTC)

                //value USD
                balanceValuesUSD[debit.coin] = balanceValuesUSD[debit.coin] - parseFloat(debit.valueUSD)

                log.info(tag,"(debit) order placed: ",debit.amount," ",debit.coin,"  USD: ",debit.valueUSD)
                //log.info(tag,"Balances:",JSON.stringify(balances))

            }else if (trade.event === 'cancel'){
                log.debug(tag," cancel order! ")
                // credit account
                // TODO debit order
                // TODO partial (handle remaining)

                let credit = {}
                log.debug("trade: ",trade)
                //detect coin
                if (trade.balanceIn > 0) {
                    credit.amount = trade.balanceIn
                    credit.coin = trade.orderInfo.coinIn
                    //apply
                    if(!balances[credit.coin]) balances[credit.coin] = 0
                    if(!balanceValuesBTC[credit.coin]) balanceValuesBTC[credit.coin] = 0
                    if(!balanceValuesUSD[credit.coin]) balanceValuesUSD[credit.coin] = 0


                    //native value balances
                    balances[credit.coin] = balances[credit.coin] + parseFloat(credit.amount)

                    //value BTC
                    balanceValuesBTC[credit.coin] = balanceValuesBTC[credit.coin] + parseFloat(credit.valueBTC)

                    //value USD
                    balanceValuesUSD[credit.coin] = balanceValuesUSD[credit.coin] + parseFloat(credit.valueUSD)

                    log.info(tag,"(credit) cancel order: +",credit.amount," (",credit.coin,")  USD: ",credit.valueUSD)
                    log.debug(tag,"Balances:",JSON.stringify(balances))
                }


            }

        }

        log.debug(tag,"balanceValuesBTC: ",balanceValuesBTC)
        log.debug(tag,"balanceValuesUSD: ",balanceValuesUSD)

        // validate block
        // get total assets value USD
        // Object.keys(balances).forEach(function(asset) {
        //     let balance = balances[asset];
        //     if(!balanceValuesBTC[asset]) {
        //         //log.error(tag,"asset: ",asset)
        //         //throw Error('103: incomplete data balanceValueBTC')
        //     }
        //
        //     totalBTCValue = totalBTCValue + balanceValuesBTC[asset]
        //     totalUSDValue = totalUSDValue + (balanceValuesBTC[asset] * rateUSDBTC)
        //
        //     //if any balance is negative THROW
        //     if(balance < 0) {
        //         log.error(tag,"DEBUG OBJECT: ",{balances,trade,credit,debit})
        //         throw Error('102: overdraft!')
        //     }
        // });

        log.debug(tag,"totalUSDValue: ",totalUSDValue)
        log.info(tag,"Balances:",JSON.stringify(balances))
        // stringify blockInfo
        //
        // sign blockInfo
        let block = {
            nonce:i+1,
            txid,
            time,
            rateUSDBTC,
            balances,
            balanceValuesBTC,
            balanceValuesUSD,
            totalBTCValue,
            totalUSDValue,
            block:blockTemplate,
            prevBlock,
        }
        let signature
        if(config.NODE_ENV === 'production') signature = await signing.sign(config.AGENT_BTC_MASTER,JSON.stringify(block))
        block.signature = signature
        log.debug(tag,i+1," block: ",block)

        //push to mongo
        try{
            let saveResult = await mongo['arbiterLa-balances'].insert(block)
            log.debug(tag,"saveResult: ",saveResult)
        }catch(e){

        }
        return block
    }catch(e){
        views.displayStringToChannel("KILL ALL HUMANS!!! ERROR: "+e.toString(),'help')
        log.error(e)
        throw e
    }
}


const digest_trade = async function(trade){
    let tag = TAG + " | digest_trade | "
    try{

        //market info
        let marketInfo = await redis.hget('binance:markets',trade.symbol)
        if(!marketInfo) {
            let marketInfoAll = await binance.markets()
            marketInfo = await redis.hget('binance:markets', trade.symbol)
        }
        marketInfo = JSON.parse(marketInfo)

        log.debug(tag,'marketInfo: ',marketInfo)

        //rate USD at time of trade
        let rateUSDBTC = await history.bestPrice("BTC",trade.time)
        log.debug(tag,'rateUSDBTC: ',rateUSDBTC)

        let credit = {}
        let debit = {}

        credit.id = trade.id
        debit.id = trade.id

        credit.time = trade.time
        debit.time = trade.time

        credit.tradeId = trade.orderId
        debit.tradeId = trade.orderId



        //TODO multi-asset handle
        if(trade.isBuyer){
            log.info("IsBuyer acquiring quote disposing base")
            credit.coin = marketInfo.baseAsset
            debit.coin = marketInfo.quoteAsset

            let amountQUOTE = trade.qty / (1/trade.price)
            log.debug(tag,"amountQUOTE: ",amountQUOTE)

            let amountBASE = trade.qty - trade.commission
            log.debug(tag,"amountBASE: ",amountBASE)

            credit.amount = amountBASE
            credit.valueUSD = amountQUOTE * rateUSDBTC
            credit.valueBTC = amountQUOTE

            debit.amount = amountQUOTE
            debit.valueBTC = amountBASE * trade.price
            debit.valueUSD = debit.valueBTC * rateUSDBTC

        }else{
            log.info("IsSeller acquiring quote disposing base")
            credit.coin = marketInfo.quoteAsset
            debit.coin = marketInfo.baseAsset

            let amountQUOTE = trade.qty / (1/trade.price)
            log.debug(tag,"amountQUOTE: ",amountQUOTE)

            let amountBASE = trade.qty - trade.commission
            log.debug(tag,"amountBASE: ",amountBASE)

            credit.amount = amountQUOTE
            credit.valueBTC = amountBASE * trade.price
            credit.valueUSD = credit.valueBTC * rateUSDBTC

            debit.amount = amountBASE
            debit.valueBTC = amountQUOTE
            debit.valueUSD = amountQUOTE * rateUSDBTC
        }


        credit.account = "master:binance"
        debit.account  = "master:binance"


        return {credits:[credit],debits:[debit]}
    }catch(e){
        log.error(e)
    }
}
