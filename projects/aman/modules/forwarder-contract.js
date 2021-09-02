
const fs = require('fs')
const path = require('path')
const log = require('@arbiter/dumb-lumberjack')()
const filename = path.join(__dirname, '../build/contracts/Forwarder.json')
const Contract = require('./contract')
const FORWARDER_TEMPLATE = JSON.parse(fs.readFileSync(filename, 'utf-8'))

/*
 Instance of a contract that's live on the network
*/
class ForwarderContract {
  constructor({ atAddress, gasAddress }) {
    this.address = atAddress
    this.gasAddress = gasAddress
    this.contract = new Contract({
      abi: FORWARDER_TEMPLATE.abi,
      address: atAddress
    })
  }

  async flush() {
    log.debug(`flushing contract at address`, this.address, 'gas:', this.gasAddress)

    return this.contract.flush().sendResolvesOnTxid({ gas: 100000, from: this.gasAddress })
  }

  parentAddress() {
    return this.contract.parentAddress().call()
  }
}

module.exports = ForwarderContract
