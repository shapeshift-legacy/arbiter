require('dotenv').config({path: '../.env'});
const config = require("../configs/env")
const { BTC_DAEMON, LTC_DAEMON, ETH_DAEMON } = config
const { Client: Daemon } = require('@arbiter/aman-client');

//console.log("BTC_DAEMON: ",{BTC_DAEMON})
const btc = new Daemon(BTC_DAEMON)
const ltc = new Daemon(LTC_DAEMON)
const eth = new Daemon(ETH_DAEMON)

module.exports = {
  btc, ltc, eth
}
