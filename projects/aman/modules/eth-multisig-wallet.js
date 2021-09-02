const { COIN } = require('../configs/env')
const { web3 } = require('./web3-manager')
const fs = require('fs')
const path = require('path')
const log = require('@arbiter/dumb-lumberjack')()
const helpers = require('./helpers')
const Logger = require('./logger-contract')
const softUnlock = require('./soft-unlock')
const TokenManager = require('./token-manager')
const BN = require('bignumber.js')
const Contract = require('./contract.js')

/*
 Instance of a contract that's live on the network
*/
class EthereumMultiSigWallet {
  /*
   address is the address of the contract
  */
  constructor({ atAddress, gasAddress, loggerAddress }) {
    const filename = path.join(__dirname, '../build/contracts/WalletSimple.json')
    const template = JSON.parse(fs.readFileSync(filename, 'utf-8'))

    log.debug(`instantiating eth ms wallet`, { atAddress, gasAddress, loggerAddress })

    this.address = atAddress
    this.gasAddress = gasAddress
    this.logger = new Logger({ gasAddress, atAddress: loggerAddress })
    this.contract = new Contract({
      abi: template.abi,
      address: atAddress
    })
  }

  async _checkWalletCode() {
    let code, isAuthorized

    try {
      // check to make sure contract is on chain before proceeding
      code = await web3.eth.getCode(this.address)
    } catch (ex) {
        log.warn(`error checking for wallet at ${this.address})`, ex)
        throw {
          WALLET_CHECK_ERROR: true,
          message: `attempt to verify code for wallet at ${this.address} failed`,
          error: ex
        }
    }

    if ( code === '0x' ) {
      throw {
        WALLET_CHECK_ERROR: true,
        message: `attempt to create forwarder for wallet at address ${this.address}, which is not on chain`
      }
    }

    try {
      isAuthorized = await this.logger.isAuthorizer(this.address)
    } catch (ex) {
      if ( ex.message === "Couldn't decode bool from ABI: 0x" ) {
        log.warn(ex.message, "but assuming it's fine ¯\_(ツ)_/¯")
        // it's fine O_o
        return
      }

      log.warn(`error checking auth for wallet at ${this.address})`, ex.message)
      throw {
        WALLET_CHECK_ERROR: true,
        message: `error checking auth for wallet at ${this.address}`,
        error: ex
      }
    }

    if ( !isAuthorized ) {
      throw {
        WALLET_CHECK_ERROR: true,
        message: `wallet ${this.address} is not yet authorized to create forwarders`
      }
    }
  }

  async createForwarder() {
    log.info(`creating forwarder for contract`, this.address, this.gasAddress)

    await this._checkWalletCode()
    let receipt = await this.contract.createForwarder().sendResolvesOnSuccess({ gas: 1000000 })
    let events = await this.contract.contract.getPastEvents('ForwarderCreated', {
      fromBlock: receipt.blockNumber,
      toBlock: receipt.blockNumber
    })

    log.debug(`createforwarder events`, events)

    // TODO: should this use .filter instead?
    let event = events.find(ev => {
      return ev.transactionHash === receipt.transactionHash
    })

    return event.returnValues.forwarder
  }

  async getNextSequenceId() {
    log.info(`getting next sequence ID`)
    return parseInt(await this.contract.getNextSequenceId().call(), 10)
  }

  async flushForwarderTokens(token, forwarderAddress) {
    let tokenContractAddress = TokenManager.contractAddress(token)

    if ( !tokenContractAddress ) {
      throw Error("Unknown token")
    }

    let contract = TokenManager.contractForToken(token)
    let balance = await contract.methods.balanceOf(forwarderAddress).call()
    if ( +balance === 0 ) {
      throw Error(`${token} token balance for ${forwarderAddress} is ${balance}, not flushing`)
    }

    log.info(`flushing ${token} on forwarder ${forwarderAddress}`)
    let txid = await this.contract.flushForwarderTokens(forwarderAddress, tokenContractAddress).sendResolvesOnTxid()

    return { txid }
  }

  async isSigner(address) {
    return this.contract.isSigner(address).call()
  }

  /*
  opHash = helpers.getSha3ForConfirmationTx(
    otherSigningAddress,
    balance,
    data,
    expireTime,
    sequenceId
  )
  otherSig = web3.eth.sign(oracleAddress, operationHash)
  */
  async sendMultiSig({ toAddress, expireTime, value, data, sequenceId, otherSig }) {
    log.info(`sending multisig`, toAddress, expireTime, value, data, sequenceId, otherSig)

    if ( data === "0x" || "0" ) {
      // TODO, this might need to be environmental. Some nodes/networks seem to be ok with "0x" whereas others need "0x0"
      data = "0x"
    }

    let txid = await this.contract.sendMultiSig(
      toAddress,
      web3.utils.toWei(value.toString(), 'ether'),
      data,
      expireTime,
      sequenceId,
      otherSig
    ).sendResolvesOnTxid({ gas: 450000 })

    return txid
  }

  async sendMultiSigToken({
      toAddress, /* address */
      value, /* uint */
      tokenContractAddress, /* address */
      expireTime, /* uint */
      sequenceId, /* uint */
      signature /* bytes */
  }) {
    log.info(`sending multisig token`, toAddress, value, tokenContractAddress, expireTime, sequenceId, signature)

    // convert to the integer token value based on it's BASE
    let base = TokenManager.baseForToken(COIN)
    value = new BN(value).times(base).toString()

    let txid = await this.contract.sendMultiSigToken(
      toAddress,
      value,
      tokenContractAddress,
      expireTime,
      sequenceId,
      signature
    ).sendResolvesOnTxid({ gas: 200000 }) // normally takes ~87k

    return txid
  }

}

module.exports = EthereumMultiSigWallet
