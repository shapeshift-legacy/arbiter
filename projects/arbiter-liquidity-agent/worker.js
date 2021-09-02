/**
 * Created by highlander on 9/10/17.
 */


const when = require('when');
const Redis = require('then-redis')
const redis = Redis.createClient('tcp://localhost:6379');

const views = require('./modules/views.js')

const exchanges = {}
exchanges.bittrex  = require('./exchanges/bittrex-client.js')
exchanges.binance  = require('./exchanges/binance-client.js')
// exchanges.kraken  = require('./exchanges/kraken-client.js')
// exchanges.poloniex  = require('./exchanges/poloniex-client.js')
// exchanges.bitfinex  = require('./exchanges/bitfinex-client.js')

const config = require("./configs/configMaster").config()

//globals
let accounts = Object.keys(config.api)
let TAG = " | worker | "

let nerf = false

Number.prototype.roundTo = function(num) {
    var resto = this%num;
    if (resto <= (num/2)) {
        return this-resto;
    } else {
        return this+num-resto;
    }
}

let do_work = async function(){
    let debug = true
    let tag = TAG+" | do_work | "
    try{
        //TODO nerf any user turned off!

        let action = await redis.spop("arbiter:actionQueue")
        if(debug && action) console.log(tag,"action: ",action)

        // let override = false
        // if(!nerf) {
        //     override = await redis.get("isNerfed")
        //     if(override) console.log("redis nerf!!! ")
        //     if(override) nerf = true
        // }

        if(action && !nerf){
            //
            action = JSON.parse(action)
            if(!action.account) throw Error("100 invalid action!")
            if(!action.type) throw Error("101 invalid action!")
            if(!action.asset) throw Error("102 invalid action! yo")
            if(!action.exchange) throw Error("103 invalid action!")
            if(debug) console.log(tag,"action: ",action)

            let asset = action.asset
            let account = action.account
            let exchange = action.exchange
            //if account is not online, DONT DO ACTION
            if(debug) console.log(tag,"account: ",account)
            let isOnline = await redis.sismember("arbiter:online",account)
            if(debug) console.log(tag,"isOnline: ",isOnline)

            let coinInfo

            if(isOnline){

                if(exchange === 'bittrex'){
                    switch(action.type) {
                        case "acquisition":
                            if(!action.amount) throw Error("103 invalid action!")

                            //
                            let market = "BTC-"+asset
                            let ticker = await exchanges.bittrex.getTicker(market)
                            if(!ticker.Bid || !ticker.Bid) throw Error("Invalid ticker!" + ticker.toString())
                            if(debug) console.log(tag,"ticker: ",ticker)

                            let pair = "BTC_"+asset
                            let rate =  ticker.askPrice
                            let amount = action.amount / rate
                            if(debug) console.log(tag,"amount: ",amount)

                            let orderId = await exchanges.bittrex.bid(account,pair,rate,amount)
                            views.displayJsonToChannel(orderId,account+" results "+action.description+" "+asset,"actions")

                            break;
                        case "disposal":

                            let balances = await exchanges.bittrex.balances(account)
                            if(debug) console.log(tag,this.opt+" balances: ",balances)
                            if(debug) console.log(tag,this.opt+" asset: ",asset)

                            //buy exactly target btc worth of asset
                            let market1 = "BTC-"+asset
                            let ticker1 = await exchanges.bittrex.getTicker(market1)
                            if(debug) console.log(tag,"ticker: ",ticker1)

                            let pair1 = "BTC_"+asset
                            let rate1 =  ticker1.Bid
                            let amount1 = balances[asset]
                            if(debug) console.log(tag," pair: ",pair1)
                            if(debug) console.log(tag," rate: ",rate1)
                            if(debug) console.log(tag," amount: ",amount1)

                            let orderId1 = await exchanges.bittrex.ask(account,pair1,rate1,amount1)
                            views.displayJsonToChannel(orderId1,account+" results "+action.description+" "+asset,"actions")

                            break;
                        case "cancel":

                            let success = await exchanges.bittrex.cancel(account,orderId)
                            views.displayJsonToChannel(success,account+" results "+action.description+" "+asset,"actions")
                            break;
                        case "limit":



                            break;
                        default:
                            throw Error("Uknown action type!!!")
                    }
                }else if(exchange === 'binance'){
                    switch(action.type) {
                        case "acquisition":
                            if(!action.amount) throw Error("103 invalid action!")

                            //
                            let market = asset+"BTC"
                            let ticker = await exchanges.binance.getTicker(market)
                            //if(!ticker.Bid || !ticker.Bid) throw Error("Invalid ticker!" + ticker)
                            if(debug) console.log(tag,"ticker: ",ticker)

                            let pair = asset+"BTC"
                            let rate =  ticker.askPrice
                            let amount = action.amount / rate
                            if(debug) console.log(tag,"amount: ",amount)

                            coinInfo = await redis.get("binance:info:"+asset)
                            coinInfo = JSON.parse(coinInfo)
                            if(debug) console.log(tag,"1coinInfo: ",coinInfo)
                            if(!coinInfo){
                                if(debug) console.log(tag,"Getting coinInfo! ")
                                coinInfo = await exchanges.binance.coinInfo(asset)
                                if(debug) console.log(tag,"2coinInfo: ",coinInfo)
                                redis.set("binance:info:"+asset,JSON.stringify(coinInfo))
                            }

                            //apply filters
                            //apply filters
                            for(let i = 0; i < coinInfo.filters.length; i++){
                                let filter = coinInfo.filters[i]
                                if(debug) console.log(tag,"filter: ",filter)
                                switch(filter.filterType) {
                                    case "PRICE_FILTER":
                                        //

                                        break;
                                    case "LOT_SIZE":
                                        //
                                        // if(filter.stepSize === '1.00000000'){
                                        //     amount = parseInt(amount)
                                        // }

                                        //get lot size
                                        let stepSize = parseFloat(filter.stepSize)
                                        //round amount to lot
                                        amount = amount.roundTo(stepSize)

                                        break;
                                    default:
                                        console.error("unhandled filter: ",filter)
                                }

                            }


                            let orderId = await exchanges.binance.bid(account,pair,rate,amount)
                            views.displayJsonToChannel(orderId,account+" results "+action.description+" "+asset,"actions")

                            break;
                        case "disposal":

                            let balances = await exchanges.binance.balances(account)
                            if(debug) console.log(tag," balances: ",balances)
                            if(debug) console.log(tag," asset: ",asset)

                            //buy exactly target btc worth of asset
                            let market1 = asset+"BTC"
                            let ticker1 = await exchanges.binance.getTicker(market1)
                            if(debug) console.log(tag,"ticker: ",ticker1)

                            let pair1 = asset+"BTC"
                            let rate1 =  ticker1.bidPrice
                            if(debug) console.log(tag," rate(pre): ",rate1)
                            //1pct of rate
                            //let onePctRate = (rate1 * 0.01)
                            rate1 = rate1 * .99
                            rate1 = rate1.toFixed(8)
                            let amount1 = balances[asset]
                            if(debug) console.log(tag," pair: ",pair1)
                            if(debug) console.log(tag," rate(post): ",rate1)
                            if(debug) console.log(tag," amount: ",amount1)


                            coinInfo = await redis.get("binance:info:"+asset)
                            coinInfo = JSON.parse(coinInfo)
                            if(debug) console.log(tag,"1coinInfo: ",coinInfo)
                            if(!coinInfo){
                                if(debug) console.log(tag,"Getting coinInfo! ")
                                coinInfo = await exchanges.binance.coinInfo(asset)
                                if(debug) console.log(tag,"2coinInfo: ",coinInfo)
                                redis.set("binance:info:"+asset,JSON.stringify(coinInfo))
                            }

                            //apply filters
                            for(let i = 0; i < coinInfo.filters.length; i++){
                                let filter = coinInfo.filters[i]
                                if(debug) console.log(tag,"filter: ",filter)
                                switch(filter.filterType) {
                                    case "PRICE_FILTER":
                                        //

                                        break;
                                    case "LOT_SIZE":
                                        //lazy worthless hack
                                        // if(filter.stepSize === '1.00000000'){
                                        //     amount1 = parseInt(amount1)
                                        // }

                                        //get lot size
                                        let stepSize = parseFloat(filter.stepSize)
                                        //round amount to lot
                                        amount1 = amount1.roundTo(stepSize)
                                        break;
                                    default:
                                        console.error("unhandled filter: ",filter)
                                }

                            }

                            let orderId1 = await exchanges.binance.ask(account,pair1,rate1,amount1)
                            views.displayJsonToChannel(orderId1,account+" results "+action.description+" "+asset,"actions")

                            break;
                        case "cancel":

                            let success = await exchanges.binance.cancel(action.orderId, action.symbol, action.account)
                            views.displayJsonToChannel(success,account+" results "+action.description+" "+asset,"actions")
                            break;
                        case "limit":



                            break;
                        default:
                            throw Error("Unknown action type!!!")
                    }
                }else{
                    console.error(tag," invalid exchange! ",exchange)
                }

            } else {
                console.log(account+ " Not online! ")
                views.displayJsonToChannel(action,account+" NOT ONLINE! not gonna do this! "+action.description+" "+asset,"actions")
            }


        } else {
            //console.log("idle!")
        }
    } catch(e){
        console.error(tag,"e: ",e)
        console.error(tag,"Bad action: ",e)

    }
}

do_work()
setInterval(do_work,1000)