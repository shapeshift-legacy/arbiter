
const TAG = " | nexus | "
require('dotenv').config({path:"../.env"});
const log = require('@arbiter/dumb-lumberjack')()

//redis
const util = require('@arbiter/arb-redis')
const redis = util.redis
const publisher = util.publisher

//mongo
// let {reportLA,credits,debits,trades,transfers,balances} = require('./mongo.js')
// let balancesDB = balances
// let transfersDB = transfers
// let tradesDB = trades


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

module.exports = {
    balancesPieBTC:function(){
        return pie_chart_btc()
    },
    balancesPieUSD:function(){
        return pie_chart_usd()
    },
    balanceHistory:function(){
        return histogram_balances_btc()
    },
    balanceHistoryUSD:function(){
        return balances_value_usd_time()
    }
}



//Pie chart BTC
const pie_chart_usd = async function(){
    let tag = " | run | "
    try{
        let labels = []
        let backgroundColor = []
        let data = []
        let output = {}

        //get most recent balances
        let balances = await mongo['binance-balances'].findOne({},{sort:1})
        log.debug(tag,"balances: ",balances)

        let totalBtc = 0
        //
        let assets = Object.keys(balances)

        for(let i = 0; i < assets.length; i++){
            let asset = assets[i]
            //let asset = balance
            let rateAsset = await redis.hget("rates",asset)
            if(rateAsset){
                let balance = balances[asset]
                log.debug(tag,"balance: ",balance)

                log.debug(tag,"asset: ",asset)
                log.debug(tag,"balance: ",balance)
                log.debug(tag,"rateAsset: ",rateAsset)


                let valueBtc = balance * rateAsset
                //percentage
                // let percentage = valueBtc / totalBtc
                // log.debug(tag,"percentage: ",percentage)
                data.push({x:asset,value:valueBtc})
            }
        }

        return data
    }catch(e){
        log.error(e)
        throw e
    }
}




/*

        Histogram

            [
            ['Powder', 11861, 10919, 8034, 18012],
            ['Mascara', 11261, 10419, 6134, 18712],
            ['Lip gloss', 22998, 12043, 4572, 4008],
            ['Foundation', 10342, 10119, 5231, 13701],
            ['Eyeliner', 12321, 15067, 3417, 5432],
            ['Eyeshadows', 12998, 12043, 4572, 3308],
            ['Pomade', 8814, 9054, 4376, 9256],
            ['Rouge', 11624, 7004, 3574, 5221],
            ['Eyebrow pencil', 13012, 5067, 3987, 3932],
            ['Nail polish', 12814, 3054, 4376, 4229]
            ]



            Stacked_Step_Area_Chart


 */
const histogram_balances_btc = async function(){
    let tag = " | histogram_balances_btc | "
    try{
        let labels = []
        let backgroundColor = []
        let data = []
        let output = {}

        //get most recent balances
        let balances = await mongo['binance-balances'].find({},{sort:1})
        log.debug(tag,"balances: ",balances)

        //get all assets
        let assets = ['BTC','BCC','ETH','TRX']

        for(let i = 0; i <  balances.length; i++){
            //
            let balance = balances[i]
            log.debug(tag,"balance: ",balance)


            data.push([new Date(balance.time).toDateString(),balance.totalUSDValue,balance.balanceValuesUSD['BTC'],balance.balanceValuesUSD['BCC'],balance.balanceValuesUSD['ETH'],balance.balanceValuesUSD['TRX']])
        }

        log.debug(tag,"data: ",data)

        return [ 'Thu Jan 04 2018',
            1794.3787939200001,
            1515.5226300000002,
            241.5,
            0,
            0 ],
            [ 'Thu Jan 04 2018',
                3590.2729389128385,
                1.686908234554494,
                241.5,
                0,
                0 ]
    }catch(e){
        log.error(e)
        throw e
    }
}


/*

        Value USD over time

            [
            ['Powder', 11861, 10919, 8034, 18012],
            ['Mascara', 11261, 10419, 6134, 18712],
            ['Lip gloss', 22998, 12043, 4572, 4008],
            ['Foundation', 10342, 10119, 5231, 13701],
            ['Eyeliner', 12321, 15067, 3417, 5432],
            ['Eyeshadows', 12998, 12043, 4572, 3308],
            ['Pomade', 8814, 9054, 4376, 9256],
            ['Rouge', 11624, 7004, 3574, 5221],
            ['Eyebrow pencil', 13012, 5067, 3987, 3932],
            ['Nail polish', 12814, 3054, 4376, 4229]
            ]



            Stacked_Step_Area_Chart


 */
const balances_value_usd_time = async function(){
    let tag = " | histogram_balances_btc | "
    try{
        let labels = []
        let backgroundColor = []
        let data = []
        let output = {}

        //get most recent balances
        let balances = await mongo['binance-balances'].find({},{sort:1})
        log.debug(tag,"balances: ",balances)

        //get all assets
        let assets = ['BTC','BCC','ETH','TRX']

        for(let i = 0; i <  balances.length; i++){
            //
            let balance = balances[i]
            log.debug(tag,"balance: ",balance)

            data.push([new Date(balance.time).toLocaleDateString(),balance.totalUSDValue])
        }

        log.debug(tag,"data: ",data)

        return data
    }catch(e){
        log.error(e)
        throw e
    }
}

