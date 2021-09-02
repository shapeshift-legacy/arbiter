const config = require("../configs/env");
const { getMasterAddress } = require("./address-manager");
const log = require('@arbiter/dumb-lumberjack')()
const helpers = require('../modules/helpers')
const util = require('ethereumjs-util');
const Big = require('bignumber.js');
const Contract = require('./contract');
const EthereumMultiSigWallet = require('./eth-multisig-wallet')
const TokenManager = require('./token-manager')
const { web3 } = require('./web3-manager')
const { redis } = require('./redis-manager')
const { decrypt } = require('./crypt')

const {
  COIN
} = config


// functions that are ETH specific
module.exports = {
    //import
    getCoin: function() {
      return COIN
    },
    getBalance: function () {
        return getbalance.apply(this, arguments)
    },
    getBalanceAddress: function (address) {
      return getbalance.apply(this, arguments)
    },
    sendToAddress: function (address,amount) {
        return send_to_address(address,amount.toString())
    },
    sendFrom: function (from,to,amount) {
        return send_from_address(from,to,amount)
    },

    sendMultiSig: function() {
        return sendmultisig.apply(this, arguments)
    },
    createRawTransaction: function() {
        return createrawtransaction.apply(this, arguments)
    },
    createRawMultisigTransaction: function() {
        return createrawmultisigtransaction.apply(this, arguments)
    },
    signRawTransaction: function() {
        return signrawtransaction.apply(this, arguments)
    }
}


const send_to_address = async function(address, amount) {
    log.info(`sending tokens ${COIN} ${address} ${amount}`)

    let contract = TokenManager.contractForToken(COIN)
    let base = TokenManager.baseForToken(COIN)
    amount = Big(amount).times(base).toString()

    let txid = await contract.transfer(address, amount).sendResolvesOnTxid()

    return { txid }
}


const send_from_address = async function(from,to,amount) {
  log.info(`sending tokens ${COIN} from ${from} to ${to} amount ${amount}`)

  let contract = TokenManager.contractForToken(COIN)
  let base = TokenManager.baseForToken(COIN)
  amount = Big(amount).times(base).toString()

  let txid = await contract.transfer(to, amount).sendResolvesOnTxid({ from })

  return { txid }
}


const signrawtransaction = async hex => {
  let buf = Buffer.from(hex, 'hex')
  let master = await getMasterAddress()
  let info = await redis.hgetall(master.toLowerCase())
  let decrypted = decrypt(info.privKey)
  let pk = Buffer.from(decrypted, 'hex')
  let sig = util.ecsign(buf, pk)

  return { signature: helpers.serializeSignature(sig) }
}

const createrawmultisigtransaction = ({
  toAddress,
  value,
  expireTime,
  sequenceId
}) => {
  if ( typeof value !== "string" ) {
    throw Error("value must be a string to ensure appropriate precision")
  }

  // convert to the integer token value based on it's base
  // NOTE: this doesn't happen directly in sendMultiSigToken because it
  // gets converted in the eth-multisig-wallet class
  let base = TokenManager.baseForToken(COIN)
  value = new Big(value).times(base).toString()

  let contractAddress = TokenManager.contractAddress(COIN)

  let hash = helpers.getSha3ForConfirmationTokenTx(
    toAddress,
    value,
    contractAddress,
    expireTime,
    sequenceId
  )

  return { ophash: hash.toString('hex') }
}

const createrawtransaction = ({}) => {
  // TODO
}

const decoderawtransaction = async txid => {
  // TODO
}

async function getbalance(address) {
  // only returns master address for now
  address = address || await getMasterAddress()
  let contract = TokenManager.contractForToken(COIN)
  let base = TokenManager.baseForToken(COIN)
  let bal = await contract.balanceOf(address).call()

  return Big(bal).dividedBy(base).toString()
}

const sendmultisig = async ({
  contractAddress,
  gasAddress,
  toAddress,
  expireTime,
  value,
  sequenceId,
  otherSig
}) => {
  if ( typeof value !== "string" ) {
    throw Error("value must be a string to ensure appropriate precision")
  }

  const wallet = new EthereumMultiSigWallet({
    atAddress: contractAddress,
    gasAddress
  })

  let txid = await wallet.sendMultiSigToken({
    toAddress,
    value,
    tokenContractAddress: TokenManager.contractAddress(COIN),
    expireTime,
    sequenceId,
    signature: otherSig
  })

  return { txid }
}

const sendrawtransaction = hex => {

}
