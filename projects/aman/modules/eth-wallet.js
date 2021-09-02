

/*
    AMAN
        life after the middle earth
                        -Highlander

    New paradigms

    Eventing
        all major events emit

        new address creation
        payment received (credit)
        payment sent (debit)

    Auditablity Upgrade
            get my address COUNT
            get known addresses COUNT
            get my txs COUNT
            get known txs COUNT
            get TXIDs COUNT
            get Credits COUNT
            get Debits COUNT

    indexed by time
        Redis Scored sets

    Functions
        get address count
        get oldest address
        get addresses start(UNIX) end(UNIX)

        txs/txids ect...


    Bitcoin json-RPC drop in replacement

    clients using npm bitcoin RPC

    custom CLI listens to RPC

 */
const TAG = " | ETH-Wallet | "
const config = require("../configs/env")
const { redis } = require('./redis-manager')
const { getMasterAddress } = require("./address-manager");
const log = require('@arbiter/dumb-lumberjack')()
const helpers = require('../modules/helpers')
const util = require('ethereumjs-util');
const EthereumMultiSigWallet = require('./eth-multisig-wallet')
const { web3 } = require('./web3-manager')
const sender = require('./sender')
const { decrypt } = require('./crypt')
const { COIN } = config

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

//TODO getinfo
/*
       Bitcoin getInfo

       {
          "version": 149900,
          "protocolversion": 70015,
          "walletversion": 130000,
          "balance": 1.39135021,
          "blocks": 473382,
          "timeoffset": 0,
          "connections": 8,
          "proxy": "",
          "difficulty": 0.0002441371325370145,
          "testnet": true,
          "keypoololdest": 1519084714,
          "keypoolsize": 100,
          "paytxfee": 0.00000000,
          "relayfee": 0.00100000,
          "errors": "This is a pre-release test build - use at your own risk - do not use for mining or merchant applications"
        }



 */



const send_to_address = async function(address,amount){
  const sendObject = {
      to: address,
      value: web3.utils.toWei(amount,"ether"),
      gas: 250000 //higher gas
  }

  let txid = await sender.signAndSend(sendObject, 'txid')

  return txid
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
  value, // in eth
  data, // should be 0x
  expireTime,
  sequenceId
}) => {
  let hash = helpers.getSha3ForConfirmationTx(
    toAddress,
    value,
    data || '',
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
  let bal = await web3.eth.getBalance(address)
  return web3.utils.fromWei(bal, 'ether')
}

/*
get my address COUNT
get known addresses COUNT
get my txs COUNT
get known txs COUNT
get TXIDs COUNT
get Credits COUNT
get Debits COUNT
*/

const sendmultisig = async ({
  contractAddress,
  gasAddress,
  toAddress,
  expireTime,
  value, // in eth
  data,
  sequenceId,
  otherSig
}) => {
  const wallet = new EthereumMultiSigWallet({
    atAddress: contractAddress,
    gasAddress
  })

  let txid = await wallet.sendMultiSig({
    toAddress,
    expireTime,
    value,
    data,
    sequenceId,
    otherSig
  })

  return { txid }
}

const sendrawtransaction = hex => {

}
