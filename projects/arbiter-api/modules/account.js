const { redis } = require('@arbiter/arb-redis')
const { eth } = require('@arbiter/arb-daemons-manager').daemons
const log = require('@arbiter/dumb-lumberjack')()
const filterObject = require('./filter-object')

class Account {
  constructor(address) {
    if ( !address ) {
      throw Error("a bitcoin address must be used to initialize an account")
    }

    this.address = address
  }

  async setEthWalletAddress(walletAddress, signerAddress) {
      // validate that the wallet is valid and the user's address is a signer
      const result = await eth.validateWalletAddress({
        signerAddress,
        walletAddress
      })

      if ( result.valid ) {
        await redis.hmset(this.address, {
          contractAddress: walletAddress,
          ethAddress: signerAddress,
          eth: true
        })
      } else {
        throw Error(`could not validate wallet ${walletAddress}`)
      }
  }

  // creates multisig address internally, which we probably don't want to do
  // but keeping it available as an option
  async addEthMultisigAddress() {
    let account = await redis.hgetall(account)

    if ( !account.ethAddress ) {
      throw Error("no eth address set for this account")
    }

    let contract = await eth.addMultisigAddress([account.ethAddress])
    await redis.sadd('contracts:eth:ms', contract.address)

    // save the contract address in the redis account object
    let response = await redis.hmset(this.address, { contractAddress: contract.address })

    if ( response !== "OK" ) {
      log.error(`error saving contract address`, response, contract)
      throw Error("error saving contract address")
    }
  }

  setData(data) {
    // filter out fields
    let supportedFields = ['account', 'contractAddress', 'eth', 'ethAddress' ]
    let fields = filterObject(data, supportedFields)

    return redis.hmset(this.address, fields)
  }

  getData() {
    return redis.hgetall(this.address)
  }
}

module.exports = Account
