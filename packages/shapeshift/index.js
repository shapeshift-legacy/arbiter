/**
 * Created by highlander on 4/23/16.
 */
/**
 * Created by highlander on 3/18/2016.
 */
var when = require('when');
var request = require("request")
var _ = require('underscore')
var clc = require('cli-color');
// var Redis = require('promise-redis')();
// var redis = Redis.createClient();


//var prod = "http://redacted.example.com:6001"
var prod = "https://shapeshift.io"
var cloud = "http://redacted.example.com:6001"
var staging = "http://redacted.example.com:6001"
var devBitcoin = "1CN7Ld8gAgKRoP31PMSRECBdfRVwrJ2KWR"

//var wallet = require('./coins.js')

var debug = false

module.exports = {
    //API getinfo
    //coins
    coins:function(target){
        return get_coins(target)
    },
    coinsList:function(target){
        return get_coins_list(target)
    },
    //marketInfo
    marketInfo:function(target){
        return get_marketInfo_summary(target)
    },
    markets:function(target){
        return get_marketInfo(target)
    },
    //limit
    limit:function(target){
        return get_coin_limit(target)
    },
    //monitor
    monitor:function(orderId){
        return monitor_order(orderId)
    },


    //shift test
    shift:function(target,pair,address){
        return make_conduit(target,pair,address)
    },

    //shift test
    precise:function(target,pair,address,amount){
        return make_sendamount(target,pair,address,amount)
    },

    shiftAllIn:function(target){
        return shift_all_coins_input(target)
    },

    shiftAllOut:function(target,addresses){
        return shift_all_coins_output(target,addresses)
    },

    //order info
    orderInfo:function(target,orderId){
        return get_order_info(target,orderId)
    },

    //order info
    orderStatus:function(target,address){
        return get_order_status(target,address)
    },

    //test coins
    benchmark:function(coin){
        return benchmark_coin(coin)
    },

}
//primary
var monitor_order = function(orderId){
    var d = when.defer();
    var tag = " | monitor_order SS | "
    var i = 0
    var monitor = function(){
        if(debug) console.log(tag,"Checkpoint2",orderId)
        //query txid
        get_order_info("prod",orderId)
            .then(function(resp){
                if(debug || false) console.log(tag,resp)
                if(debug || true) console.log(tag,resp.status)
                if(resp.status == "no_deposits") i++
                if(resp.status == "complete") d.resolve(true)
                if(i >= 200) d.reject("Deposit not seen!")
                //return
                //if complete
                //d.resolve(resp)
            })
    }
    monitor()
    setInterval(monitor,6000)

    return d.promise
}

var benchmark_coin = function(coin){
    //Globals ******************
    var innit = false
    var startTime = null
    var endtime = null
    var tasks = []
    var session = {}


    var tag = " | benchmark_coin | "
    var TAG = "| benchmark Test: "+coin+"|"

    if(!coin)
    {
        var d = when.defer()
        d.reject("missing coin")
        return d.promise;
    }

    var orderId = false
    var deposit = false

    coin = coin.toUpperCase()
    var time = new Date().getTime()

    function stepOne()
    {
        var dOne = when.defer()

        session[coin] = {}
        session[coin].begin = startTime = time

        //test.shift("cloud", coin+"_BTC",devBitcoin)
        if(!orderId){
            make_sendamount("cloud", coin+"_BTC",devBitcoin, 0.0005)
                .then(function(resp){
                    session[coin].checkpoint1 = {}
                    if(!resp)
                    {
                        console.error("failed to make cloud conduit")
                        return dOne.reject("fail")
                    }
                    session[coin].begin = startTime

                    //resp = JSON.parse(resp)
                    //test.shift("prod","BTC_"+coin, resp.deposit)
                    console.log(TAG,resp)

                    //TODO orderId doesnt come from prod! cant handle deposit too
                    if(resp && resp.orderId){
                        if(!deposit){
                            console.log(clc.green(TAG+"cloud orderId",resp.orderId))
                            orderId = resp.orderId

                            session[coin].checkpoint1.success = true
                            session[coin].checkpoint1.time = new Date().getTime()

                            make_sendamount("prod","BTC_"+coin, resp.deposit, resp.depositAmount)
                                .then(function(resp2){
                                    innit = true
                                    //resp = JSON.parse(resp)
                                    session[coin].checkpoint2 = {}

                                    if(resp2 && resp2.deposit){
                                        console.log(clc.blue(TAG+"Fund ME: "+resp2.deposit+ "  "+resp2.depositAmount + "btc"))
                                        deposit = resp2.deposit

                                        session[coin].checkpoint2.success = true
                                        session[coin].checkpoint2.time = new Date().getTime()

                                        wallet.sendToAddress("btc",resp2.deposit,resp2.depositAmount)
                                            .then(function(resp3){
                                                session[coin].checkpoint3 = {}

                                                if(resp3){
                                                    console.log(clc.green(TAG+"Txid: ",resp3))

                                                    session[coin].checkpoint3.success = true
                                                    session[coin].checkpoint3.time = new Date().getTime()

                                                    //
                                                    dOne.resolve(true)
                                                } else {
                                                    session[coin].checkpoint3.success = false
                                                    session[coin].checkpoint3.errorMsg = "Failed to fund with generate wallet"
                                                    session[coin].checkpoint3.error = resp3
                                                }
                                            })

                                    } else {
                                        console.log(clc.red(TAG+"Failed to get address from prod! error:",resp2))
                                        dOne.resolve(true)
                                    }

                                })
                        } else {
                            console.error("THIS SHOULD NEVER HIT!")
                        }
                    } else {
                        session[coin].checkpoint1.success = false
                        session[coin].checkpoint1.errorMsg = "No orderId"
                        session[coin].checkpoint1.error = resp
                        console.log(clc.red(TAG+"cloud order FAILED! error: ",resp))
                    }
                })
        } else {
            console.log("Already made cloud persise")
        }


        return dOne.promise;
    }

    function stepTwo()
    {
        var dOne = when.defer()
        session[coin].checkpoint4 = {}

        var checkForCompletionProd = function(){
            var tick = new Date().getTime()
            console.log("elapsed time: ",(tick-startTime)/1000)
            if(deposit){
                get_order_status("prod",deposit)
                    .then(function(resp){
                        //console.log("cloud: " ,resp.status)
                        if(resp.status == "complete"){
                            session[coin].checkpoint5 = {}
                            console.log("Transaction done!")
                            session[coin].checkpoint5.success = true
                            session[coin].checkpoint5.time = new Date().getTime()
                            session[coin].checkpoint5.resp = resp
                            clearInterval(firstTaskId)
                            dOne.resolve(true)
                        }else if(resp.status == "received"){
                            console.log("waiting for a confirm to bounce off prod!")
                            session[coin].checkpoint4.success = true
                            session[coin].checkpoint4.time = new Date().getTime()
                        } else if(resp.status == "no_deposits"){
                            console.log("waiting for prod to detect the deposit!")

                        } else {
                            console.log("Prod side Status: ",resp.status)
                        }
                    })
            } else {
                //try to make conduit again
                stepOne()

                console.log("Frist try failed! Trying to make prod presice again!!")
                //d.reject(coin+":ERROR")
            }
            //console.log("time elapsed: ",(startTime - time)/1000)

        }

        var firstTaskId = setInterval(checkForCompletionProd,5000)
        tasks.push(firstTaskId)

        return dOne.promise;
    }

    function stepThree()
    {
        var dOne = when.defer()
        session[coin].checkpoint6 = {}
        var checkForCompletionCloud = function(){
            console.log("Im in step 3")
            //lookup status of order

            console.log(TAG+"time elapsed: ",(time - startTime)/1000)
            get_order_status("cloud",orderId)
                .then(function(resp){
                    console.log(TAG+"cloud: " ,resp.status)
                    if(resp.status == "complete"){
                        session[coin].checkpoint7 = {}
                        var txTime = time - startTime
                        console.log(TAG+"Transaction done! time taken: ",txTime)
                        session[coin].checkpoint7.success = true
                        session[coin].checkpoint7.time = new Date().getTime()
                        session[coin].checkpoint7.resp = resp

                        endtime = new Date().getTime()
                        session[coin].checkpoint7.endtime = endtime
                        var duration = startTime - endtime
                        session[coin].checkpoint7.duration = duration
                        session[coin].success = true
                        //if we got this far PASS
                        console.log(clc.green(coin," : ---PASSED ALL TESTS---   elapsed time: ",duration))

                        clearInterval(secondTaskId);
                        dOne.resolve(session)
                    }else if(resp.status == "errord"){
                        //TODO how many differnt ways can it error and we handle :)
                        session[coin].success = false
                        session[coin].errMsg = "ShapeShift failed to complete order:"
                        //TODO check for return!
                        clearInterval(task1id);
                    }else if(resp.status == "received"){
                        console.log(TAG+"waiting for a confirm on cloud!")
                        session[coin].checkpoint6.success = true
                        session[coin].checkpoint6.time = new Date().getTime()
                    } else {
                        console.log(TAG+"cloud side Status: ",resp.status)
                    }
                })
        }

        //check order every 30seconds till it completes

        var secondTaskId = setInterval(checkForCompletionCloud,5000)
        tasks.push(secondTaskId)
        return dOne.promise;
    }


    return stepOne()
        .then(stepTwo)
        .then(stepThree)
    //clear all tasks
    //store session results in redis
    //analize results and generate sugested action
}

var get_order_status = function(target,address){
    var d = when.defer();
    var tag = " | get_status | "
    ////Create User
    if(target === "prod"){
        var url = prod + "/txstat/"+address
    } else if(target === "cloud") {
        var url = cloud + "/txstat/"+address
    } else {
        var url = "https://"+target + "/txstat/"+address
    }

    //console.log(tag,"url" , url)
    get_request(url)
        .then(function(resp){
            if(resp){

                resp = JSON.parse(resp)

                //var output = {}

                //pairs

                //for (var i = 0; i < resp.length; i++) {
                //    output[resp[i].pair] = resp[i]
                //}
                d.resolve(resp)
            }else{
                d.reject(false)
            }
        })
    return d.promise
}

var get_order_info = function(target,orderId){
    var d = when.defer();
    var tag = " | get_status | "
    ////Create User
    if(target === "prod"){
        var url = prod + "/orderInfo/"+orderId
    } else if(target === "cloud") {
        var url = cloud + "/orderInfo/"+orderId
    } else {
        var url = "https://"+target + "/orderInfo/"+orderId
    }

    //console.log(tag,"url" , url)
    get_request(url)
        .then(function(resp){
            if(resp){

                resp = JSON.parse(resp)

                //var output = {}

                //pairs

                //for (var i = 0; i < resp.length; i++) {
                //    output[resp[i].pair] = resp[i]
                //}
                d.resolve(resp)
            }else{
                d.reject(false)
            }
        })
    return d.promise
}

var get_marketInfo = function(target){
    var d = when.defer();
    var tag = " | get_status | "
    ////Create User
    if(target === "prod"){
        var url = prod + "/marketinfo/"
    } else if(target === "cloud") {
        var url = cloud + "/marketinfo/"
    } else {
        var url = "https://"+target + "/marketinfo/"
    }

    console.log(tag,"url" , url)
    get_request(url)
        .then(function(resp){
            if(resp){

                resp = JSON.parse(resp)

                var output = {}

                //pairs

                for (var i = 0; i < resp.length; i++) {
                    output[resp[i].pair] = resp[i]
                }
                d.resolve(output)
            }else{
                d.reject(false)
            }
        })
    return d.promise
}

var get_marketInfo_summary = function(target){
    var d = when.defer();
    var tag = " | get_status | "
    ////Create User
    if(target === "prod"){
        var url = prod + "/marketinfo/"
    } else if(target === "cloud") {
        var url = cloud + "/marketinfo/"
    } else {
        var url = "https://"+target + "/marketinfo/"
    }

    //console.log(tag,"url" , url)
    get_request(url)
        .then(function(resp){
            if(resp){

                resp = JSON.parse(resp)
                //pairs
                var pairs = []
                var rates = []
                var norate = []
                var limit = []
                var noLim = []
                var noMin = []
                var lowLim = []
                for (var i = 0; i < resp.length; i++) {
                    pairs.push(resp[i].pair)
                    //console.log(resp[i])
                    //console.log(typeof(resp[i]))
                    //rates
                    var rate = parseFloat(resp[i].rate)
                    if(rate > 0){rates.push({rate:resp[i].rate,pair:resp[i].pair})}
                    if(rate == 0){norate.push(resp[i].pair)}
                    //pairs without limits
                    if(resp[i].limit == 0){noLim.push(resp[i].pair)}
                    //pairs without mins
                    if(resp[i].min == 0){noMin.push(resp[i].pair)}
                    //pairs where usd < 50
                }
                var output = {}
                output.summary = {}
                output.summary.pairs = pairs.length
                output.summary.rates = rates.length
                output.summary.norate = norate.length
                output.summary.noLim = noLim.length
                output.summary.noMin = noMin.length
                output.pairs = pairs
                output.rates = rates
                output.norate = norate
                output.noLim = noLim
                output.noMin = noMin

                d.resolve(output)
            }else{
                d.reject(false)
            }
        })
    return d.promise
}

var shift_all_coins_input = function(target){

    var coins = uwallet.coins()
    coins.splice(0,1)
    var debug = []
    var conduit = []
    var errored = []
    return when.all(coins.map(function (coin) {
        return make_conduit_btc_out(target,coin.toUpperCase()+"_BTC")
            .then(function (result) {
                if(result.success) {
                    //live[coin] = true
                    conduit.push(result)
                }else {
                    debug.push(coin.toUpperCase()+"_BTC")
                    result.target = target
                    result.pair = coin.toUpperCase()+"_BTC"
                    errored.push(result)
                }

                //return(all_wallet_transactions)
            })
            .catch(function (error) {
                console.error('ERROR: ',error)
            })
    }))
        .then(function() {
            var results = {
                success:conduit.length,
                failed:errored.length,
                conduit:conduit,
                debug:debug,
                errored:errored
            }
            //console.log(results)
            return results
        })

}

var shift_all_coins_output = function(target,addresses){

    var coins = uwallet.coins()
    coins.splice(0,1)
    var debug = []
    var conduit = []
    var errored = []
    return when.all(coins.map(function (coin) {
        return make_conduit_btc_in(target,"BTC_"+coin.toUpperCase(),addresses[coin.toUpperCase()])
            .then(function (result) {
                if(result.success) {
                    //live[coin] = true
                    conduit.push(result)
                }else {
                    debug.push("BTC_"+coin.toUpperCase())
                    result.target = target
                    result.pair = "BTC_"+coin.toUpperCase()
                    errored.push(result)
                }

                //return(all_wallet_transactions)
            })
            .catch(function (error) {
                console.error('ERROR: ',error)
            })
    }))
        .then(function() {
            var results = {
                success:conduit.length,
                failed:errored.length,
                conduit:conduit,
                debug:debug,
                errored:errored
            }
            //console.log(results)
            return results
        })

}

var make_conduit_btc_in = function(target,pair,address){
    var d = when.defer();
    var tag = " | make_conduit | "

    //5 seconds or timeout coin
    //setTimeout(timeout,5000)

    if(target === "prod"){
        var url = prod
    } else if(target === "cloud") {
        var url = cloud
    } else {
        var url = "https://"+target
    }

    if(address){

        var timeout = function(){
            var output={}
            output.pair = pair
            output.pair = target
            output.success = false
            output.error = "Timeout"
            d.resolve(output)
        }

        //console.log("pair",pair)
        //console.log("address",address)

        //if special
        if(pair === "BTC_XMR"){
            var output={}
            output.pair = pair
            output.pair = target
            output.success = false
            output.error = "Not Supported"
            d.resolve(output)
        } else if(pair === "BTC_NXT"){
            var output={}
            output.pair = pair
            output.pair = target
            output.success = false
            output.error = "Not Supported"
            d.resolve(output)
        }else {
            //console.log("pair",pair)
            //console.log("address",address)


            ss(prod,"shift",address,pair)
                .then(function(response){
                    //console.log("resp: ",response)
                    if(typeof(response) === "string"){
                        try{
                            response = JSON.parse(response)
                        } catch(e){
                            var output = {}
                            output.pair = pair
                            output.success = false
                            output.response = response
                            output.error = e
                            d.resolve(response)
                        }
                    }
                    if(response.deposit){
                        //success
                        response.success = true
                        d.resolve(response)
                    } else {
                        var output = {}
                        output.pair = pair
                        output.success = false
                        output.error = response
                        d.resolve(response)
                    }
                })
        }


    } else {
        console.error("No deposit Address for: ",pair)
        var output={}
        output.pair = pair
        output.pair = target
        output.success = false
        output.error = "No deposit Address"
        d.resolve(output)
    }


    return d.promise
}

var make_conduit_btc_out = function(target,pair){
    var d = when.defer();
    var tag = " | make_conduit | "

    if(target === "prod"){
        var url = prod
    } else if(target === "cloud") {
        var url = cloud
    } else {
        var url = "https://"+target
    }

    //console.log("pair",pair)

    ss(cloud,"shift",devBitcoin,pair)
        .then(function(response){
            //console.log("resp: ",response)
            if(typeof(response) === "string"){
                try{
                    response = JSON.parse(response)
                } catch(e){
                    var output = {}
                    output.pair = pair
                    output.success = false
                    output.response = response
                    output.error = e
                    d.resolve(response)
                }
            }

            if(response.deposit){
                //success
                response.success = true
                d.resolve(response)
            } else {
                var output = {}
                output.pair = pair
                output.success = false
                output.error = response
                d.resolve(response)
            }
        })

    return d.promise
}

var make_conduit = function(target,pair,address){
    var d = when.defer();
    var tag = " | make_conduit | "
    var debug = true
    if(debug) console.log(tag,"target: ",target)
    if(debug) console.log(tag,"pair: ",pair)
    if(debug) console.log(tag,"address: ",address)
    if(target === "prod"){
        var url = prod
    } else if(target === "cloud") {
        var url = cloud
    } else {
        var url = "https://"+target
    }

    //console.log("pair",pair)

    ss(url,"shift",address,pair)
        .then(function(response){
            //console.log("resp: ",response)
            if(typeof(response) === "string"){
                try{
                    response = JSON.parse(response)
                } catch(e){
                    var output = {}
                    output.pair = pair
                    output.success = false
                    output.response = response
                    output.error = e
                    d.resolve(response)
                }
            }

            if(response.deposit){
                //success
                response.success = true
                d.resolve(response)
            } else {
                var output = {}
                output.pair = pair
                output.success = false
                output.error = response
                d.resolve(response)
            }
        })

    return d.promise
}

var make_sendamount = function(target,pair,address,amount){
    var d = when.defer();
    var tag = target+" | make_sendamount | "+pair+"|"

    if(target === "prod"){
        var url = prod
    } else if(target === "cloud") {
        var url = cloud
    } else if(target === "staging") {
        var url = staging
    }else {
        var url = "https://"+target
    }

    //console.log("pair",pair)

    ss(url,"sendamount",address,pair,amount)
        .then(function(response){
            console.log(tag+"resp: ",response)
            console.log(tag+"resp: ",typeof response)
            if(typeof(response) === "string"){
                try{
                    response = JSON.parse(response)
                    response = response.success;
                } catch(e){
                    console.log(tag+"failed to parse.  ",e)
                    var output = {}
                    output.pair = pair
                    output.success = false
                    output.response = response
                    output.error = e
                    d.resolve(response)
                }
            }

            if(response && response.deposit){
                //success
                response.success = true
                d.resolve(response)
            } else {
                var output = {}
                output.pair = pair
                output.success = false
                output.error = response
                d.resolve(response)
            }
        })

    return d.promise
}

var get_coins = function(target){
    var d = when.defer();
    var tag = " | get_status | "
    ////Create User
    if(target === "prod"){
        var url = prod + "/getcoins/"
    } else if(target === "cloud") {
        var url = cloud + "/getcoins/"
    } else {
        var url = "https://"+target + "/getcoins/"
    }

    //console.log(tag,"url" , url)
    get_request(url)
        .then(function(resp){
            if(resp){
                //console.log("type: ",typeof(resp))
                //console.log("type: ",resp)
                resp = JSON.parse(resp)
                var coins = []
                var offline = []

                for (var property in resp) {
                    if (resp.hasOwnProperty(property)) {
                        //
                        if(resp[property].status === "available"){
                            coins.push(resp[property].symbol)
                        } else {
                            offline.push(resp[property].symbol)
                            //
                            //console.log("Offline: ",resp[property].name)
                        }
                    }
                }

                var report = {}
                report.status = coins.length
                report.online = coins
                report.offline = offline
                //percent


                d.resolve(report)
            }else{
                d.reject(false)
            }
        })
    return d.promise
}

var get_coins_list = function(target){
    var d = when.defer();
    var tag = " | get_status | "
    ////Create User
    if(target === "prod"){
        var url = prod + "/getcoins/"
    } else if(target === "cloud") {
        var url = cloud + "/getcoins/"
    } else {
        var url = "https://"+target + "/getcoins/"
    }

    //console.log(tag,"url" , url)
    get_request(url)
        .then(function(resp){
            if(resp){
                //console.log("type: ",typeof(resp))
                //console.log("type: ",resp)
                resp = JSON.parse(resp)
                var coins = []
                var offline = []

                for (var property in resp) {
                    if (resp.hasOwnProperty(property)) {
                        //
                        if(resp[property].status === "available"){
                            coins.push(resp[property].symbol)
                        } else {
                            offline.push(resp[property].symbol)
                            //
                            //console.log("Offline: ",resp[property].name)
                        }
                    }
                }

                //var report = {}
                //report.live = coins.length
                //report.offline = offline
                ////percent


                d.resolve(coins)
            }else{
                d.reject(false)
            }
        })
    return d.promise
}

var get_all_blockheights = function(){
    var coins = uwallet.coins()
    //console.log("total: ",coins.length)
    var completed = []
    var live = []
    var errored = []
    return when.all(coins.map(function (coin) {
        return coinHeight(coin)
            .then(function (result) {
                if(result.success) {
                    live.push(coin+":"+result.data)
                    completed.push(coin)
                }else {
                    errored.push(coin)
                }
                //return(all_wallet_transactions)
            })
            .catch(function (error) {
                console.error('ERROR: ',error)
            })
    }))
        .then(function() {
            var results = {
                live:live,
                errored:errored
            }
            //console.log("results:",results)
            return results
        })

}

var get_all_addresses = function(){
    var coins = uwallet.coins()
    //console.log("total: ",coins.length)
    var completed = []
    var live = []
    var errored = []
    return when.all(coins.map(function (coin) {
        return checkCoin(coin)
            .then(function (result) {
                if(result.success) {
                    live.push(coin+":"+result.address)
                    completed.push(coin)
                }else {
                    errored.push(coin)
                }
                //return(all_wallet_transactions)
            })
            .catch(function (error) {
                console.error('ERROR: ',error)
            })
    }))
        .then(function() {
            var results = {
                live:live,
                errored:errored
            }
            //console.log("results:",results)
            return results
        })

}

var get_exchange_deposit_addresses = function(exchanges){
    var coins = uwallet.coins()
    //console.log("exchanges: ",exchanges)
    var live = []
    var errored = []
    var data = {}
    return when.all(exchanges.map(function (exchange) {
        return get_exchange_deposit_address(exchange)
            .then(function (result) {
                if(result.success) {
                    live.push(exchange)
                    //iterate over and add
                    //console.log(result.result)
                    //data[exchange]
                }else {
                    errored.push(exchange)
                }
                var todo = _.difference(coins, completed)
                //console.log("todo: ", todo)
                //return(all_wallet_transactions)
            })
            .catch(function (error) {
                console.error('ERROR: ',error)
            })
    }))
        .then(function() {
            var results = {
                live:live,
                data:data,
                errored:errored
            }
            //console.log("results:",results)
            return results
        })

}

//lib


var ss = function(url,method,withdrawl,pair,amount){
    var d = when.defer()
    var tag = " | ss | "
    var timeout = function(){
        var output={}
        output.success = false
        output.error = "Timeout"
        d.resolve(output)
    }

    //5 seconds or timeout coin
    //setTimeout(timeout,30000)

    var headers = {
        'User-Agent':       'Super Agent/0.0.1',
        'Content-Type':     'application/x-www-form-urlencoded'
    }

    var options = {
        url: url + "/" + method,
        method: 'POST',
        headers: headers,
        form: {"withdrawal":withdrawl, "pair":pair, "amount":amount}
    }
    console.log(tag,"options: ",options)
    // Start the request
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // Print out the response body
            //console.log(body)

            d.resolve(body)
        } else {
            var output={}
            output.success = false
            output.error = error
            output.body = body
            d.resolve(output)
        }
    })
    return d.promise;
}

var newAddress = function(coin) {
    var d = when.defer();
    //timeout
    var timeout = function(){
        var output={}
        output.success = false
        output.error = "Timeout"
        d.resolve(output)
    }
    //5 seconds or timeout coin
    setTimeout(timeout,5000)

    try{
        uwallet.getNewAddress(coin)
            .then(function (result) {
                if (result) {
                    //console.log(result)
                    var output = {}
                    output.coin = coin
                    output.success = true
                    output.address = result
                    d.resolve(output)
                }
                else {
                    var output = {}
                    output.coin = coin
                    output.success = false
                    output.error = result
                    d.resolve(output)
                }
            })
            .catch(function (e) {
                //console.error(coin, ": ", result);
                var output = {}
                output.coin = coin
                output.success = false
                output.error = e
                d.resolve(output)
            })
    } catch(e){
        var output = {}
        output.coin = coin
        output.success = false
        output.error = e
        d.resolve(output)
    }
    return d.promise;
};

var checkCoin = function(coin) {
    var d = when.defer();
    //timeout
    var timeout = function(){
        var output={}
        output.success = false
        output.error = "Timeout"
        d.resolve(output)
    }
    //5 seconds or timeout coin
    setTimeout(timeout,5000)

    try{
        uwallet.getNewAddress(coin)
            .then(function (result) {
                if (result) {
                    //console.log(result)
                    var output = {}
                    output.coin = coin
                    output.success = true
                    output.address = result
                    d.resolve(output)
                }
                else {
                    var output = {}
                    output.coin = coin
                    output.success = false
                    output.error = result
                    d.resolve(output)
                }
            })
            .catch(function (e) {
                //console.error(coin, ": ", result);
                var output = {}
                output.coin = coin
                output.success = false
                output.error = e
                d.resolve(output)
            })
    } catch(e){
        var output = {}
        output.coin = coin
        output.success = false
        output.error = e
        d.resolve(output)
    }
    return d.promise;
};

var coinHeight = function(coin) {
    var d = when.defer();
    //timeout
    var timeout = function(){
        var output={}
        output.success = false
        output.error = "Timeout"
        d.resolve(output)
    }
    //5 seconds or timeout coin
    setTimeout(timeout,5000)

    try{
        uwallet.getInfo(coin)
            .then(function (result) {
                if (result) {
                    //console.log(result)
                    var output = {}
                    output.coin = coin
                    output.success = true
                    output.data = result
                    d.resolve(output)
                }
                else {
                    var output = {}
                    output.coin = coin
                    output.success = false
                    output.error = result
                    d.resolve(output)
                }
            })
            .catch(function (e) {
                //console.error(coin, ": ", result);
                var output = {}
                output.coin = coin
                output.success = false
                output.error = e
                d.resolve(output)
            })
    } catch(e){
        var output = {}
        output.coin = coin
        output.success = false
        output.error = e
        d.resolve(output)
    }
    return d.promise;
};

var get_exchange_deposit_address = function(exchange){
    var d = when.defer();
    //timeout
    var timeout = function(){
        var output={}
        output.success = false
        output.error = "Timeout"
        d.resolve(output)
    }
    //10 seconds or timeout coin
    setTimeout(timeout,10000)


    pte.addresses(exchange)
        .then(function(resp){
            if(resp){
                var output={}
                output.success = true
                output.result = resp
                d.resolve(output)
            } else {
                var output={}
                output.success = false
                output.error = "no response"
                d.resolve(output)
            }
        })
    return d.promise;
}

var post_request = function(url,body){
    var d = when.defer();
    var tag = " | buy_asset | "
    var options = { method: 'POST',
        url: url,
        headers:
            { 'content-type': 'application/x-www-form-urlencoded' },
        form:body
    };

    request(options, function (error, response, body) {
        if (error) {
            d.reject(error)
        };
        //console.log(body);
        d.resolve(body)
    });
    return d.promise
}

var get_request = function(url){
    var d = when.defer();
    var tag = " | get_request | "
    //console.log(tag,"url:",url)
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            //console.log(body) // Show the HTML for the Google homepage.
            d.resolve(body)
        }
    })
    //request(url, function (error, response, body) {
    //    if (error) {
    //        d.reject(error)
    //    };
    //    //console.log(body);
    //    d.resolve(body)
    //});
    return d.promise
}

var get_limit = function(pair) {

    var date = new Date();
    var n = date.getTime();
    //console.log("n",n)
    //testing prod
    //var url = "https://shapeshift.io/rate/"+pair
    //testing dev
    //var url = "http://192.168.100.103:3000/limit/"+pair
    var url = "http://192.168.100.105/coins/xcp"

    //testing generate
    //var url = "https://shapeshift.io/rate/"+pair


    var d = when.defer()

    request({
        url: url,
        json: true
    }, function (error, response, body) {

        if (!error && response.statusCode === 200) {
            //console.log("body", body)
            //var txData = {
            //    pair   : body.pair,
            //    rate : body.rate
            //}
            var dateNew = new Date();
            var newT = dateNew.getTime();
            //console.log("newT",newT)
            //console.log("Time: ",n - newT)
            //body.confidence
            return d.resolve(body);

        } else {
            if (!error){error = "error"}
            //console.log("response: "+JSON.stringify(response), error, body)
            return d.reject(error);
        }
    })

    return d.promise;
}

var make_new_shift = function(){
    var d = when.defer();
    ////Create User
    var url = "http://localhost:5000/shift"

    trade.get_lowest_ask('BTC_LTC')
        .then(function(order){
            if(order){
                var rate = order.rate
                //console.log("rate: ",rate)
                rate = rate / 100000000
                //console.log("rate: ",rate)

                // ad a buffer to make sure it fills
                //percent
                rate = rate * (1 + 0.35);
                rate = 1/rate
                //console.log("rate: ",rate)

                //rate = Math.floor(rate)

                //
                //console.log("rate: ",rate)

                var body = {
                    experiation: Date.now() + 1000000,
                    pair: 'BTC_LTC',
                    rate: rate,
                    returnAddress: 'LebNjqeHG5Q5yoUtmEw1iLQJuBybk8Ud2X',
                    withdrawAddress: 'LgZyhgca7omoN8j6vsXLFvYUgJeoYV67Bz'
                }

                post_request(url,body)
                    .then(function(resp){
                        if(resp){
                            d.resolve(resp)
                        }else{
                            d.reject(false)
                        }
                    })
            } else {
                console.error("unable to get a rate")
            }
        })

    return d.promise
}

var get_status = function(orderId){
    var d = when.defer();
    var tag = " | get_status | "
    ////Create User
    var url = "http://localhost:5000/status/"+orderId
    //console.log(tag,"url" , url)
    get_request(url)
        .then(function(resp){
            if(resp){
                d.resolve(resp)
            }else{
                d.reject(false)
            }
        })
    return d.promise
}

var get_health = function(pair){
    var d = when.defer();
    var tag = " | get_status | "
    ////Create User
    var url = "http://localhost:3001/health/"+pair
    //console.log(tag,"url" , url)
    get_request(url)
        .then(function(resp){
            if(resp){
                d.resolve(resp)
            }else{
                d.reject(false)
            }
        })
    return d.promise
}


var get_all_coin_status = function(){

    var coins = uwallet.coins()
    var live = {}
    var status = []
    var errored = []
    return when.all(coins.map(function (coin) {

        return checkCoin(coin)
            .then(function (result) {
                if(result.success) {
                    live[coin] = true
                    status.push(result)
                }else {
                    live[coin] = false
                    errored.push(result)
                }

                //return(all_wallet_transactions)
            })
            .catch(function (error) {
                console.error('ERROR: ',error)
            })
    }))
        .then(function() {
            var results = {
                live:live,
                status:status,
                errored:errored
            }
            //console.log(results)
            return results
        })

}

//var test_coins = function(){
//    coins = uwallet.coins()
//   //console.log(coins.length,"coins on")
//
//
//    for (var i = 0; i < coins.length; i++) {
//        checkCoin(coins[i])
//            .then(function (result) {
//               //console.log(result);
//            })
//    }
//}
 

//lib
var checkCoin = function(coin) {
    var d = when.defer();
    var timeout = function(){
        output={}
        output.coin = coin
        output.success = false
        output.error = "Timeout"
        d.resolve(output)
    }
    //5 seconds or timeout coin
    setTimeout(timeout,5000)
    try{
        uwallet.getInfo(coin)
            .then(function (result) {
                if (result) {
                    //console.log(result)
                    var output = {}
                    output.coin = coin
                    output.success = true
                    output.result = result
                    d.resolve(output)
                }
                else {
                    var output = {}
                    output.coin = coin
                    output.success = false
                    output.error = result
                    d.resolve(output)
                }
            })
            .catch(function (e) {
                //console.error(coin, ": ", result);
                var output = {}
                output.coin = coin
                output.success = false
                output.error = e
                d.resolve(output)
            })
    } catch(e){
        var output = {}
        output.coin = coin
        output.success = false
        output.error = e
        d.resolve(output)
    }
    return d.promise;
};