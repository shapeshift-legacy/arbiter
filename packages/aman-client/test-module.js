


const local_coin_client = require('./index.js');

//const configs = require("./../configs/configMaster").configs()
const btc = new local_coin_client.Client()
// const ltc = new local_coin_client.Client(config.daemons.LTC.daemon)
// const eth = new local_coin_client.Client(config.daemons.ETH.daemon)



btc.getNewAddress()
    .then(function(resp){
        console.log("btc: ",resp)
    })