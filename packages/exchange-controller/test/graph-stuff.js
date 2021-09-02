/*
    Exchange controler

    Mange all exchange functions


    Rip history
    audit balances
    return history balances in mongo


//TODO indexify export for npm

//export event emitter to sub to events

//goal: don't touch redis in project and export interface to pubsub to redis.

 */

require('dotenv').config();
let randomHexColor = require('random-hex-color')
let app = require("./modules/liquidity.js")
//app.initialize()

//mongo
let {reportLA,credits,debits,trades} = require('./modules/mongo.js')

//redis
const util = require('./modules/redis')
const redis = util.redis

//
const log = require('@arbiter/dumb-lumberjack')()

let assetColors = {
    BTC: '#f2a900',
    BCH: '#ee8c28',
    LTC: '#662c79',
    ETH: '#c740de',
    NEO: '#8e8d3f',
    BNB: '#5fa53a',
    QTUM: '#5a9150',
    EOS: '#a73c84',
    GAS: '#6ec11f',
    OMG: '#aab4fd',
    WTC: '#96b36b',
    TRX: '#a1c2ff',
    FUN: '#a9b2d8',
    TNT: '#779d8a',
    MTL: '#efd302',
    SUB: '#686139',
    DGD: '#371734',
    VEN: '#55dd68',
    AMB: '#dca31c',
    BCPT: '#13ce5e',
    CND: '#e03dc9',
    GVT: '#c577ff',
    BCD: '#83ae7d',
    TNB: '#ec741f',
    ADA: '#745baf',
    CMT: '#9f64a3',
    ICX: '#f6ec3c',
    ELF: '#870bfc',
    AION: '#01b293',
    NEBL: '#ab1406',
    VIBE: '#22413c',
    IOST: '#dce4c5',
    NANO: '#ab7b0f',
    NCASH: '#29af39',
    ONT: '#625ed7',
    ZIL: '#1e6813',
    STORM: '#c3e9df',
    XEM: '#ce4b03',
    WAN: '#3e395e',
    QLC: '#831dd9',
    LOOM: '#3eb249'
}

//data-fetcher polling and save to redis

// //Pie chart BTC
// const run = async function(){
//     let tag = " | run | "
//     try{
//         let labels = []
//         let backgroundColor = []
//         let data = []
//         let output = {}
//
//         //get balances
//         let balances = await app.balances()
//         log.debug(tag,"balances: ",balances)
//
//         let totalBtc = 0
//         //
//         let assets = Object.keys(balances)
//         for(let i = 0; i < assets.length; i++){
//             let asset = assets[i]
//             log.debug(tag,"asset: ",asset)
//             let balance = balances[asset]
//             log.debug(tag,"balance: ",balance)
//             redis.hset("account:binance",asset,balance)
//
//             //let asset = balance
//             let rateAsset = await redis.hget("rates",asset)
//             if(rateAsset){
//                 labels.push(asset)
//                 let color = assetColors[asset]
//                 if(!color) color = randomHexColor()
//                 backgroundColor.push(color)
//                 assetColors[asset] = color
//                 log.debug(tag,"asset color : ",color," asset: ",asset )
//                 log.debug(tag,"rateAsset: ",rateAsset)
//
//                 if(asset === "BTC"){
//                     let valueBtc = balance
//                     log.debug(tag,"valueBtc: ",valueBtc)
//
//                     totalBtc = totalBtc + valueBtc
//                 }else{
//                     let valueBtc = balance * rateAsset
//                     log.debug(tag,"valueBtc: ",valueBtc)
//
//                     totalBtc = totalBtc + valueBtc
//                 }
//
//             }
//
//         }
//
//         for(let i = 0; i < assets.length; i++){
//             let asset = assets[i]
//             //let asset = balance
//             let rateAsset = await redis.hget("rates",asset)
//             if(rateAsset){
//                 let balance = balances[asset]
//                 log.debug(tag,"balance: ",balance)
//
//                 if(asset === "BTC"){
//                     let valueBtc = balance
//                     log.debug(tag,"valueBtc: ",valueBtc)
//
//                     //percentage
//                     let percentage = valueBtc / totalBtc
//                     log.debug(tag,"percentage: ",percentage)
//                     data.push(percentage)
//
//                 }else{
//                     let valueBtc = balance * rateAsset
//                     log.debug(tag,"valueBtc: ",valueBtc)
//                     //percentage
//                     let percentage = valueBtc / totalBtc
//                     log.debug(tag,"percentage: ",percentage)
//                     data.push(percentage)
//                 }
//             }
//         }
//
//
//         log.debug(tag,"assetColors: ",assetColors)
//         output = {
//             labels,
//             datasets: [{
//                 label: 'value (BTC)',
//                 backgroundColor,
//                 data
//             }]
//         }
//         log.debug(tag,"output: ",output)
//         redis.set("binance:pie:btc",JSON.stringify(output))
//         return output
//     }catch(e){
//         log.error(e)
//         throw e
//     }
// }

//Pie chart USD
const run = async function(){
    let tag = " | run | "
    try{
        let labels = []
        let backgroundColor = []
        let data = []
        let output = {}

        //get balances
        let balances = await app.balances()
        log.debug(tag,"balances: ",balances)

        //
        let assets = Object.keys(balances)
        for(let i = 0; i < assets.length; i++){
            let asset = assets[i]
            log.debug(tag,"asset: ",asset)
            let balance = balances[asset]
            log.debug(tag,"balance: ",balance)
            redis.hset("account:binance",asset,balance)

            //let asset = balance
            let rateAsset = await redis.hget("rates",asset)
            if(rateAsset){

                let color = assetColors[asset]
                if(!color) color = randomHexColor()
                backgroundColor.push(color)
                assetColors[asset] = color
                log.debug(tag,"asset color : ",color," asset: ",asset )
                log.debug(tag,"rateAsset: ",rateAsset)


                let valueUSD = balance * rateAsset
                log.debug(tag,"valueUSD: ",valueUSD.roundTo(2)+" (USD)")
                data.push(valueUSD)

                //TODO sort by heightest
                labels.push(asset+": "+valueUSD.roundTo(2)+" (USD)")

            }

        }

        // for(let i = 0; i < assets.length; i++){
        //     let asset = assets[i]
        //     //let asset = balance
        //     let rateAsset = await redis.hget("rates",asset)
        //     if(rateAsset){
        //         let balance = balances[asset]
        //         log.debug(tag,"balance: ",balance)
        //
        //         if(asset === "BTC"){
        //             let valueBtc = balance
        //             log.debug(tag,"valueBtc: ",valueBtc)
        //
        //             //percentage
        //             let percentage = valueBtc / totalBtc
        //             log.debug(tag,"percentage: ",percentage)
        //             data.push(percentage)
        //
        //         }else{
        //             let valueBtc = balance * rateAsset
        //             log.debug(tag,"valueBtc: ",valueBtc)
        //             //percentage
        //             let percentage = valueBtc / totalBtc
        //             log.debug(tag,"percentage: ",percentage)
        //             data.push(percentage)
        //         }
        //     }
        // }


        log.debug(tag,"assetColors: ",assetColors)
        log.debug(tag,"data: ",data)
        output = {
            labels,
            datasets: [{
                label: 'value (BTC)',
                backgroundColor,
                data
            }]
        }
        log.debug(tag,"output: ",output)
        redis.set("binance:pie:btc",JSON.stringify(output))
        return output
    }catch(e){
        log.error(e)
        throw e
    }
}

/*

      Line chart


{
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
        {
            label: 'Debit',
            backgroundColor: utils.hex2rgb(palette.primary, 0.6).css,
            borderColor: palette.transparent,
            data: [40, 39, 10, 40, 39, 80, 40]
        },
        {
            label: 'Credit',
            backgroundColor: utils.hex2rgb(palette.info, 0.6).css,
            borderColor: palette.transparent,
            data: [50, 20, 70, 30, 10, 5, 70]
        }
    ],
}


        Balances Over time. (done right)

        mongo

        get all events between x and y time


        convert to values btc/usd








 */


// const run = async function(){
//     let tag = " | run | "
//     try{
//         let labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July']
//         let datasets = [
//             {
//                 label: 'BTC',
//                 backgroundColor: "#ee8c28",
//                 borderColor: "",
//                 data: [40, 39, 10, 40, 39, 80, 40]
//             },
//             {
//                 label: 'LTC',
//                 backgroundColor: "#dce4c5",
//                 borderColor: "",
//                 data: [50, 20, 70, 30, 10, 5, 70]
//             }
//         ]
//
//
//         let output = {
//             labels,
//             datasets
//         }
//         log.debug(tag,"output: ",output)
//         redis.set("binance:balances:line",JSON.stringify(output))
//         return output
//     }catch(e){
//         log.error(e)
//         throw e
//     }
// }


/*



 */


run()
