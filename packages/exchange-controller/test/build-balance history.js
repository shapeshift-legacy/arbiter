/*


    Get all entries

    sort by time

    play array

    for each

    nonce +1

    balances = balances

    sign checkpoint
        (only sign what you can validate from scratch)


    //TODO bignum
     | audit-trade-worker |  | do_work |  events:  { credits:
   [ { id: 776375,
       time: 1525850621003,
       tradeId: 4434885,
       coin: 'BTC',
       amount: 0.05172008000000001,
       account: 'master:binance' } ],
       Rabbel

 */




require('dotenv').config({path:"../.env"});
const TAG = " | audit-trade-worker | "
const log = require('@arbiter/dumb-lumberjack')()
const config = require("../configs/env")

//
const util = require('../modules/redis')
let history = require("../modules/historical-price.js")
//const redis = util.redis
const Redis = require('then-redis')
const redis = Redis.createClient('redis://' + config.REDIS_IP + ':' + config.REDIS_PORT)
const publisher = util.publisher

let finance = require("../modules/financial.js")

//mongo
let {reportLA,credits,debits,trades,txs} = require('../modules/mongo.js')

let airdrops = {
    ENJ:15.0,
    GAS:0.1,
    EON:0.8,
    ADD:0.4,
    MEETONE:0.4,
    ADT:0.8,
    EOP:0.8,
    IQ:4.08,
    VET:64.5,
    VTHO:0.70404858,
    ONG:0.00560790,

}


const do_work = async function(){
    let tag = TAG + " | do_work | "
    try{
        //get all trades
        let allTrades = await txs.find({},{sort:{time:1}})
        log.debug(tag,"allTrades: ",allTrades.length)
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

        //COMPLETENESS: airdrops throw this off
        //MUST find date, MUST credit at correct time (before a sell)


        //Add airdrops
        Object.keys(airdrops).forEach(function(asset) {
            balances[asset] = airdrops[asset];
            balanceValuesBTC[asset] = 0.001
            balanceValuesUSD[asset] = 1
        });

        for(let i = 0;i < allTrades.length;i++){
            let totalUSDValue = 0
            let totalBTCValue = 0
            let trade = allTrades[i]
            log.debug(tag,'trade: ',trade)
            log.debug(tag,'trade: ',trade.time)
            log.debug(tag,'trade: ',typeof(trade.time))
            log.debug(tag,'trade: ',new Date(trade.time).toDateString())
            let time = trade.time
            //rate USD at time of trade
            let rateUSDBTC = await history.bestPrice("BTC",time)
            log.debug(tag,'rateUSDBTC: ',rateUSDBTC)

            let txid
            if(trade.id){
                txid = trade.id
            } else if(trade.txid){
                txid = trade.txid
            }
            log.info(tag,"txid: ",txid)
            let blockTemplate = {
                nonce:i,
                txs:[],
                time,
                txid:trade.id,
                credits:[],
                debits:[],
                balances:{},
                prevBlock:""
            }
            blockTemplate.txs.push(trade)
            //let normalizedEvents = normalized

            let credit
            let debit

            if(trade.transfer){
                log.debug(tag,' transfer detected ')
                let credit = trade
                if(!balances[credit.coin]) balances[credit.coin] = 0
                if(!balanceValuesBTC[credit.coin]) balanceValuesBTC[credit.coin] = 0
                if(!balanceValuesUSD[credit.coin]) balanceValuesUSD[credit.coin] = 0

                //TODO FEATURE AIRDROPS if BTC and pre (date) than credit BCC
                if(credit.coin === "BTC"){
                    balances['BCC'] = 0
                    balances['BCC'] = balances['BCC'] + parseFloat(credit.amount)
                    // 0.184 initial rate (2,415usd)
                    if(!balanceValuesBTC['BCC']) balanceValuesBTC['BCC'] = 0
                    if(!balanceValuesUSD['BCC']) balanceValuesUSD['BCC'] = 0
                    balanceValuesBTC['BCC'] = balanceValuesBTC['BCC'] + parseFloat(credit.amount) * 0.184
                    balanceValuesUSD['BCC'] = balanceValuesUSD['BCC'] + parseFloat(credit.amount) * 2415
                }


                if(credit.coin === "BTC"){
                    log.info(tag,"(credit) Received deposit: ",credit.amount," ",credit.coin)
                    balances[credit.coin] = balances[credit.coin] + parseFloat(credit.amount)
                    balanceValuesBTC[credit.coin] = balanceValuesBTC[credit.coin] + parseFloat(credit.amount)
                    balanceValuesUSD[credit.coin] = balanceValuesUSD[credit.coin] + parseFloat(credit.amount * rateUSDBTC)
                } else if(credit.coin === "BCC"){
                    //HACK we know only one deposit

                    let BCCBTCRate = 0.1552
                    let valueBTC = parseFloat(credit.amount) * BCCBTCRate
                    log.info(tag,"valueBTC: ",valueBTC)
                    balances[credit.coin] = balances[credit.coin] + parseFloat(credit.amount)
                    balanceValuesBTC[credit.coin] = balanceValuesBTC[credit.coin] + valueBTC
                    balanceValuesUSD[credit.coin] = balanceValuesUSD[credit.coin] + parseFloat(valueBTC * rateUSDBTC)

                } else {

                    //

                    //TODO historical price of more assets
                    throw Error('101: unsupported action! need historical data unavailable!')
                }

                blockTemplate.credits.push(credit)
            } else {
                log.debug(tag,' trade detected ')
                let events = await finance.digest(trade)
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
                    throw Error("101: can't debit a coin you do now own!")
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
            }

            log.debug(tag,"balanceValuesBTC: ",balanceValuesBTC)
            log.debug(tag,"balanceValuesUSD: ",balanceValuesUSD)

            // validate block
            // get total assets value USD
            Object.keys(balances).forEach(function(asset) {
                let balance = balances[asset];
                if(!balanceValuesBTC[asset]) {
                    log.error(tag,"asset: ",asset)
                    //throw Error('103: incomplete data balanceValueBTC')
                }

                totalBTCValue = totalBTCValue + balanceValuesBTC[asset]
                totalUSDValue = totalUSDValue + (balanceValuesBTC[asset] * rateUSDBTC)

                //if any balance is negative THROW
                if(balance < 0) {
                    log.error(tag,"DEBUG OBJECT: ",{balances,trade,credit,debit})
                    throw Error('102: overdraft!')
                }
            });

            log.info(tag,"totalUSDValue: ",totalUSDValue)

            // stringify blockInfo
            //
            // sign blockInfo
            let block = {
                nonce:i,
                time,
                balances,
                balanceValuesBTC,
                balanceValuesUSD,
                totalBTCValue,
                totalUSDValue,
                block:blockTemplate,
                signature:"" //TODO
            }
            blockchain.push(block)
            log.debug(tag,"block: ",block)

            //push to mongo
            let saveResult = await reportLA.insert(block)
            log.debug(tag,"saveResult: ",saveResult)
        }
        log.debug(tag,"blockchain: ",blockchain)




        return true
    }catch(e){
        log.error(e)
    }
}
do_work()
