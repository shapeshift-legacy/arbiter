const config = require('../configs/env')
const { web3 } = require('./web3-manager')
const fs = require('fs')
const path = require('path')
const log = require('@arbiter/dumb-lumberjack')()
const softUnlock = require('./soft-unlock')
const { sendResolvesOnReceipt } = require('./helpers')
const { LOGGER_ADDRESS } = config
const filename = path.join(__dirname, '../build/contracts/Logger.json')
const CONTRACT_TEMPLATE = JSON.parse(fs.readFileSync(filename, 'utf-8'))


/*
 Instance of a contract that's live on the network
*/
class LoggerContract {
  constructor({ gasAddress, atAddress }) {
    let address = atAddress || LOGGER_ADDRESS

    log.debug(`logger address`, address, atAddress, LOGGER_ADDRESS)

    this.gasAddress = gasAddress
    this.contract = new web3.eth.Contract(CONTRACT_TEMPLATE.abi, address, {
      from: gasAddress,
      data: CONTRACT_TEMPLATE.bytecode
    })
  }

  async addAuthorizer(address) {
    await softUnlock(this.gasAddress)

    let method = this.contract.methods.addAuthorizer(address)
    return sendResolvesOnReceipt(method, { gas: 300000 })
  }

  isAuthorizer(address) {
    return this.contract.methods.authorizers(address).call()
  }

  isLogger(address) {
    return this.contract.methods.loggers(address).call()
  }

  getContract() {
    return this.contract
  }
}

module.exports = LoggerContract
