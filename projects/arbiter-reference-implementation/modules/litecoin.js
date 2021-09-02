/**
 * Created by highlander on 3/1/17.
 */
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

//secrets
// var Secret = require("./../secrets.js")
// var secret = new Secret;
let config = require('../configs/env')

var bitcoin = require( 'bitcoin-promise' ) ;
let { ltc } = require('./daemons-manager')
/**********************
 //    exports module
 //**********************/

module.exports = {
    connect: function () {
        return connect_to_client();
    },

    //get new address
    getNewAddress: function () {
        return ltc.getNewAddress();
    },
    //getbalance
    getBalance: function () {
        return ltc.getBalance();
    },
    //sendtoaddress
    sendToAddress: function (address, amount) {
        return ltc.sendToAddress(address, amount);
    },
    //sendtoaddress
    getBlockHeight: function () {
        return ltc.getBlockHeight();
    },

}

/********************
 //  Primary
 //********************/


/********************
 //  lib
 //********************/