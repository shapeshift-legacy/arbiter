/**
 * Created by highlander on 9/7/17.
 */
/**
 * Created by highlander on 9/4/17.
 */

//redis
const util = require('@arbiter/arb-redis')
const redis = util.redis

let TAG = " | FOMO-command | "
const log = require('@arbiter/dumb-lumberjack')()
/*
    MONGO

        fomo schema
  [
  'binance-balances',
  'binance-credits',
  'binance-debits',
  'binance-transfers',
  'binance-trades',
  'binance-txs',
  'binance-history'
  ]
 */

let mongo = require('@arbiter/arb-mongo')
let views = require('@arbiter/arb-views')
let exchangeService  = require('@arbiter/arbiter-exchange-controller')


module.exports = {
    //
    usdValue: async function (account, user)
    {
        let tag = TAG + " | account | "
        let debug = true
        try{
            return exchangeService.estimateUSD("binance")
        }catch(e){
            console.error(tag,"e: ",e)
        }
    },
    // audit all trades
    audit: async function (user)
    {
        let tag = TAG + " | account | "
        let debug = true
        try{
            return exchangeService.audit()
        }catch(e){
            console.error(tag,"e: ",e)
        }
    },
    // audit all trades
    buildTXDB: async function (user)
    {
        let tag = TAG + " | account | "
        let debug = true
        try{
            return exchangeService.buildTXdb()
        }catch(e){
            console.error(tag,"e: ",e)
        }
    },
    auditAllTrades: async function (market, user)
    {
        let tag = TAG + " | auditAllTrades | "
        let debug = true
        try{
            log.info(tag,"market: ",market)
            log.debug(tag,"user: ",user)
            return exchangeService.auditAllTrades()
        }catch(e){
            console.error(tag,"e: ",e)
        }
    },
    //audit all transfers
    auditAllTransfers: async function (user)
    {
        let tag = TAG + " | auditAllTransfers | "
        let debug = true
        try{
            return exchangeService.auditAllTransfers()
        }catch(e){
            console.error(tag,"e: ",e)
        }
    },
    //audit all transfers
    auditTransfers: async function (coin, user)
    {
        let tag = TAG + " | auditTransfers | "
        let debug = true
        try{
            return exchangeService.auditTransfers(coin)
        }catch(e){
            console.error(tag,"e: ",e)
        }
    },
    //audit all transfers
    auditTrades: async function (market,user)
    {
        let tag = TAG + " | auditTrades | "
        let debug = true
        try{
            log.info(tag,"market: ",market)
            log.debug(tag,"user: ",user)
            return exchangeService.auditTrades(market)
        }catch(e){
            console.error(tag,"e: ",e)
        }
    },

    //liquidate entire position at market rate
    balancesbinance: async function (user)
    {
        let tag = TAG + " | account | "
        let debug = true
        try{
            let output = []
            log.debug(tag,"user: ",user)
            //get userId



            return exchangeService.balances('binance')
        }catch(e){
            console.error(tag,"e: ",e)
        }
    },

    balances: async function (user)
    {
        let tag = TAG + " | account | "
        let debug = true
        try{
            let output = {}
            //get oldest history object
            let checkpoint = await mongo['binance-balances'].findOne({},{sort:{nonce:-1}})
            if(!checkpoint){
                //just display remote!
                //get remote balances
                let response = await exchangeService.estimateUSD('binance')
                return response
            }else{
                log.debug(tag,"checkpoint: ",checkpoint)

                //estimate USD value AT TODAYS BTC PRICE!
                let newDataLocal = await exchangeService.estimateUSDValueOfBalances(checkpoint.balances)



                let totalValueUSDLocal = newDataLocal.totalValueUSD
                let balancesLocal = checkpoint.balances
                output.totalValueUSDLocal = totalValueUSDLocal
                //output.rateBTCUSDLocal = checkpoint.rateUSDBTC

                //get remote balances
                let response = await exchangeService.estimateUSD('binance')
                log.debug(tag,"response: ",response)
                let totalValueUSDRemote = response.totalValueUSD
                let balancesRemote = response.balances
                output.totalValueUSDRemote = totalValueUSDRemote
                output.balancesRemote = balancesRemote
                output.balancesLocal = balancesLocal
                //output.rateBTCUSDRemote = response.rateUSDBTC


                log.debug(tag,"LOCAL USD value map: ",checkpoint.balanceValuesUSD)
                log.debug(tag,"REMOTE USD value map: ",response.valueUSDMap)

                log.debug(tag,"totalValueUSDLocal: ",totalValueUSDLocal)
                //log.debug(tag,"balancesLocal: ",balancesLocal)
                log.debug(tag,"totalValueUSDRemote: ",totalValueUSDRemote)
                //log.debug(tag,"balancesRemote: ",balancesRemote)


                //find differences
                let balanceDiffs = await diffTool(balancesLocal,balancesRemote)
                log.debug(tag,"diff: ",balanceDiffs)
                log.debug(tag,"diff: ",balanceDiffs['BTC'])
                log.debug(tag,"diff: ",balanceDiffs['BCC'])
                log.debug(tag,"diff: ",balanceDiffs['ETH'])
                //get usd value
                output.balanceDiffsNative = balanceDiffs

                let balanceDiffsUSD = await diffTool(checkpoint.balanceValuesUSD,response.valueUSDMap)
                log.debug(tag,"diff: ",balanceDiffsUSD)
                log.debug(tag,"diff: ",balanceDiffsUSD['BTC'])
                log.debug(tag,"diff: ",balanceDiffsUSD['BCC'])
                log.debug(tag,"diff: ",balanceDiffsUSD['ETH'])
                //get usd value
                //output.balanceDiffsUSD = balanceDiffsUSD

                //if within tolerance
                let diff = Math.floor((totalValueUSDLocal / totalValueUSDRemote) * 100)
                log.debug(tag,"diff: ",diff)


                return output
            }


        }catch(e){
            console.error(tag,"e: ",e)
            views.displayStringToChannel("ERROR: KILL ALL HUMANS! e: "+e.toString(),'help')
            throw e
        }
    },

    //liquidate entire position at market rate
    balancesHistory: async function (user)
    {
        let tag = TAG + " | account | "
        let debug = true
        try{
            let output = []
            log.debug(tag,"user: ",user)
            //get userId



            return exchangeService.balances('binance')
        }catch(e){
            console.error(tag,"e: ",e)
        }
    },
    //oldest entry
    oldest: async function (user)
    {
        let tag = TAG + " | account | "
        let debug = true
        try{
            let output = []
            log.debug(tag,"user: ",user)
            //get userId

            let oldest = await trades.findOne({},{sort:{time:1}})

            let oldestTime = oldest.time
            oldestTime = new Date(oldestTime).toString()
            oldest.oldestTime = oldestTime
            return oldest
        }catch(e){
            console.error(tag,"e: ",e)
        }
    },
    //most recent entry
    //oldest entry
    newest: async function (user)
    {
        let tag = TAG + " | account | "
        let debug = true
        try{
            let output = []
            log.debug(tag,"user: ",user)
            //get userId

            let oldest = await trades.findOne({},{sort:{time:-1}})

            let oldestTime = oldest.time
            oldestTime = new Date(oldestTime).toString()
            oldest.oldestTime = oldestTime
            return oldest
        }catch(e){
            console.error(tag,"e: ",e)
        }
    },
    //lookup trade by id
    tradeById: async function (user,id)
    {
        let tag = TAG + " | account | "
        let debug = true
        try{
            let output = []
            log.debug(tag,"user: ",user)
            //get userId

            let entry = await trades.findOne({id})

            let oldestTime = entry.time
            oldestTime = new Date(oldestTime).toString()
            entry.oldestTime = oldestTime
            return entry
        }catch(e){
            console.error(tag,"e: ",e)
            throw e
        }
    },
    //credits

    //debits

    //lookup trade by coin
    transfersByCoin: async function (user,coin)
    {
        let tag = TAG + " | account | "
        let debug = true
        try{
            let output = []
            log.debug(tag,"coin: ",coin)
            //get userId

            let entry = await trades.findOne({id})

            let oldestTime = entry.time
            oldestTime = new Date(oldestTime).toString()
            entry.oldestTime = oldestTime
            return entry
        }catch(e){
            console.error(tag,"e: ",e)
            throw e
        }
    },
    //balance on date

}


const to_amount_usd = function(amountBTC){
    const d = when.defer();
    btc.fromBTC(amountBTC,"USD",function(err, amountUSD){
        console.log("amountUSD: ",amountUSD);
        d.resolve(amountUSD)
    });
    return d.promise
}

/**************************************
 // lib
 //*************************************/

function toFixed(num, fixed) {
    var re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
    return num.toString().match(re)[0];
}

let diffTool = function(balancesLocal,balancesRemote){
    let tag = TAG + " | diffToll | "
    let longest
    let longestKeys
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
    //iterate over longest
    for(let i = 0; i < longestKeys.length; i++){
        let asset = longestKeys[i]
        if(!balancesLocal[asset]) balancesLocal[asset] = 0
        if(!balancesRemote[asset]) balancesRemote[asset] = 0

        let roundedLocal  = toFixed(balancesLocal[asset],6)
        let roundedRemote = toFixed(balancesRemote[asset],6)
        log.info(tag,asset,"roundedLocal: ",roundedLocal)
        log.info(tag,asset,"balancesRemote: ",balancesRemote)

        //trim to 7~ decimicals to compare
        //TODO take this to 8 baby every satoshi accounted for
        if(roundedLocal === roundedRemote){
            output[asset] = "WINNING!!! MATCH!"
        } else {
            let diff = {
                remote:balancesRemote[asset],
                local:balancesLocal[asset],
                diff:balancesRemote[asset] - balancesLocal[asset]
            }
            output[asset] = diff
        }

    }
    return output
}


const pause = function(length){
    return new Promise(function(resolve, reject) {
        var done = function(){resolve(true)}
        setTimeout(done,length*1000)
    })
}
