/**
 * Created by highlander on 12/29/16.
 */
/**
 * Created by highlander on 8/12/16.
 */
/**
 * Created by highlander on 8/10/16.
 */
//
var TAG = " | ETH | "
var when = require('when')
var Redis = require('promise-redis')();
var redis = Redis.createClient();
var pubsub = require("redis")
    , subscriber = pubsub.createClient()
    , publisher  = pubsub.createClient();

const { btc } = require('./daemons-manager')

module.exports = {
    connect: function () {
        return connect_to_client();
    },

    //get new address
    getNewAddress: function () {
        return btc.getNewAddress();
    },
    //getbalance
    getBalance: function () {
        return btc.getBalance();
    },
    //sendtoaddress
    sendToAddress: function (address, amount) {
        return btc.sendToAddress(address, amount);
    },
    //sendtoaddress
    getBlockHeight: function () {
        return btc.getBlockHeight();
    },

}

/********************
 //  Primary
 //********************/
var connect_to_client = function(){
    let tag = " | connect_to_client | "
    try{
        // Ethereum

        try{
            web3.setProvider(new Web3.providers.HttpProvider('http://localhost:8545'));
        }catch(e){
            throw "ERROR:101 Ethereum Client is not listening to port 8545"
        }

        //     Listen for payments
        var process_tx = function(tx,height){
            var tag = TAG+" | process_tx | "
            //console.log(tag,"tx: ",tx)
            if(tx.to){
                redis.sismember("eth:address",tx.to)
                    .then(function(resp){
                        //console.log(tag,"resp: ",resp)
                        if(resp == 1){
                            console.log(tag,"resp: ",resp)
                            //write logfile
                            //fs.appendFile('./../logs/payments.txt', JSON.stringify(payload)+"\n", function (err) {});
                            //if true we received a payment
                            redis.zadd(height,"eth:credits",JSON.stringify(tx))
                            //TODO mongo here too?
                            //Published to engine (credit orders)
                            publisher.publish("blockchain",JSON.stringify(tx))
                        }
                    })
            }
        }

        var filter = web3.eth.filter('latest')
        filter.watch(function(err, hash) {
            if (err) {
                console.log(err.toString())
                return
            }

            var block = web3.eth.getBlock(hash,true)
            //console.log(" New Block Detected! eth:",block.number," Hash: ",block.hash)
            //for transactions check sismember
            for (var i = 0; i < block.transactions.length; i++){
                process_tx(block.transactions[i],block.number)
            }
        })

        return true
    }catch(e){
        console.error(tag,"Error: ",e)
        throw "ERROR:100 Unable to Start ETH client"
    }
}

/********************
 //  lib
 //********************/