const { getMasterAddress } = require('./address-manager')
const log = require('@arbiter/dumb-lumberjack')()
const { web3 } = require('./web3-manager')
const fs = require('fs')
const path = require('path')
const Logger = require('./logger-contract')
const helpers = require('./helpers')
const { WALLET_FACTORY_ADDRESS } = require('../configs/env')


class WalletFactory {
  constructor() {
    const filename = path.join(__dirname, '../build/contracts/WalletFactory.json')
    const template = JSON.parse(fs.readFileSync(filename, 'utf-8'))

    this.contract = new web3.eth.Contract(template.abi, WALLET_FACTORY_ADDRESS, {
      data: template.bytecode
    })
  }

  async createWallet(signingAddress) {
    let factory = this.contract
    let master = await getMasterAddress()
    let logger = new Logger({ gasAddress: master })

    return new Promise((resolve, reject) => {
      let params = {
        gas: 5000000,
        from: master
      }

      factory.methods.createWallet(signingAddress).send(params)
      .on('error', reject)
      .once('transactionHash', async hash => {
        log.info('new wallet tx hash: ', hash)
      }).once('receipt', async receipt => {
        try {
          if ( !helpers.isReceiptSuccessful(receipt) ) {
            return reject("failed to create new wallet, tx status: " + receipt.status)
          }

          // fetch the events to make sure it created like we expected
          // TODO: note that this assumes only one wallet will be created per block
          let events = await logger.contract.getPastEvents('WalletCreated', {
            fromBlock: receipt.blockNumber,
            toBlock: receipt.blockNumber
          })

          let { wallet, signers, forwarders } = events[0].returnValues
          let result = { address: wallet, signers, forwarders }

          log.info(`created new wallet`, result)

          resolve(result)
        } catch (ex) {
          reject(ex)
        }
      }).catch(reject)
    })
  }
}

module.exports = WalletFactory
