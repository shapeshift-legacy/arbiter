const { web3 } = require('./web3-manager')
const log = require('@arbiter/dumb-lumberjack')()
const helpers = require('./helpers')
const { DEFAULT_GAS_LIMIT } = require('../configs/env')
const { getMasterAddress } = require("./address-manager")
const sender = require('./sender')

// embetter sending
class Contract {
  constructor(opts) {
    this._validateOpts(opts)

    this.contract = new web3.eth.Contract(opts.abi, opts.address)

    let self = this

    for (let method in this.contract.methods) {
      let f = this.contract.methods[method]

      this[method] = function() {
        let tx = f(...arguments)

        return Object.assign(tx, {
          sendResolvesOnTxid: options => self._sendResolvesOn('txid', tx, options),
          sendResolvesOnReceipt: options => self._sendResolvesOn('receipt', tx, options),
          sendResolvesOnSuccess: options => self._sendResolvesOn('success', tx, options)
        })
      }
    }
  }

  _sendResolvesOn(ev, tx, opts) {
    log.info(`sendResolvesOn`, ev, tx._method.name, opts)

    opts = opts || {}
    opts.data = opts.data || tx.encodeABI()
    opts.to = opts.to || this.contract.options.address

    return sender.signAndSend(opts, ev, tx)
  }

  _validateOpts(opts) {
    if ( !opts.abi ) throw new Error("abi required")
  }
}

module.exports = Contract
