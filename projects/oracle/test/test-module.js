const config = require("./../configs/configMaster").config()
const local_coin_client = require('bitcoin-promise');
console.log("LTC: ",config.daemons.LTC.daemon)
console.log("BTC: ",config.daemons.BTC.daemon)
const btc = new local_coin_client.Client(config.daemons.BTC.daemon)
const ltc = new local_coin_client.Client(config.daemons.LTC.daemon)


btc.getInfo()
    .then(function(resp){
        console.log("BTC resp: ",resp)
    })


ltc.getInfo()
    .then(function(resp){
        console.log("LTC resp: ",resp)
    })