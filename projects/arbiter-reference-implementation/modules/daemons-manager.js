
const config = require("../configs/env")
const { BTC_DAEMON, LTC_DAEMON } = config
const { Client: Daemon } = require('@arbiter/aman-client');
const btc = new Daemon(BTC_DAEMON)
const ltc = new Daemon(LTC_DAEMON)

module.exports = {
  btc,
  ltc
}
