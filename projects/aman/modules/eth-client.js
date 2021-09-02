let TAG = " | ETH - client | "
const when = require('when')
const { redis } = require('./redis-manager')
const { web3 } = require('./web3-manager')
const config = require("../configs/env")
const fs = require("fs");
const path = require('path')
const log = require('@arbiter/dumb-lumberjack')()
const PromiseResults = require('promise-results')
const bluebird = require("bluebird");
const { getMasterAddress } = require('./address-manager')
const EthereumMultiSigWallet = require('./eth-multisig-wallet')
const WalletFactory = require('./eth-wallet-factory')
const TokenManager = require('./token-manager')
const ForwarderContract = require('./forwarder-contract')
const BN = require('bignumber.js')
const bip39 = require('bip39')
const HDKey = require('hdkey')
const coininfo = require('coininfo')
const EthereumBip44 = require('ethereum-bip44');
const { MNEMONIC } = require("../configs/env")
const { encrypt } = require('./crypt')


const { FORWARDER_BUFFER_SIZE, COIN } = config

let get_gas_price = function(){
    var tag = TAG+ " | get_gas_price | "
    var d = when.defer();
    var debug = false
    web3.eth.getGasPrice(function(error,result){
        if(!error){

            d.resolve(result)
        } else {
            console.error(error,result)
            d.reject(error)
        }
    });
    return d.promise
}

const get_new_address = async function () {
    var tag = TAG+" | get_new_address | "
    try {
        let address = await redis.spop("eth:wallet:ready")
        log.debug(tag,"address: ",address)

        //create a new
        create_new_address()

        return address
    } catch(e){
        log.error(tag,"ERROR:300 ",e)
        throw e;
    }
}

//
const create_new_address = async function () {
    var tag = TAG+" | create_account | "
    try {
        let mnemonic = MNEMONIC
        if(!mnemonic) throw Error("no mnemonic detected")
        let seed = bip39.mnemonicToSeedHex(mnemonic)

        seed = seed.toString().trim()
        seed = seed.replace(/,/gi,' ');

        var mk = new HDKey.fromMasterSeed(new Buffer(seed, 'hex'), coininfo('BTC').versions.bip32)

        // create the hd wallet
        var wallet = EthereumBip44.fromPrivateSeed(mk.privateExtendedKey);

        //get address index
        let walletInfo = await redis.hgetall("eth:wallet:info")
        let newIndex = walletInfo.addressIndex
        let i = newIndex + 1
        let address = wallet.getAddress(i).toLowerCase()
        let privKey = wallet.getPrivateKey(i)

        let addressInfo = {
            address,
            eth: true,
            path: "m/44'/60'/0'/0/"+i,
            privKey: encrypt(privKey.toString('hex'))
        }

        //save to redis
        await redis.sadd("eth:wallet",address)
        await redis.sadd("eth:wallet:ready",address)
        await redis.hmset(address,addressInfo)
        await redis.hincrby("eth:wallet:info","addressIndex",1)

        log.debug(tag, `added address to redis wallet`, addressInfo)
    } catch(e){
        console.error(tag,"ERROR:300 ",e)
        throw e;
    }
}



//list accounts
let list_accounts = async () => {
    return await web3.eth.getAccounts()
}

let get_coinbase = function(){
  return web3.eth.getCoinbase()
}

let get_balance_token = async function(address,token){
    var tag = TAG+ " | get_balance_token | "
    var d = when.defer();
    var debug = false
    //console.log(web3)
    try{
        //
        let abiPath = path.join(__dirname, "../coins/"+token.toUpperCase()+".abi.js")
        let abiInfo = require(abiPath)
        //console.log(tag,"abiInfo: ",abiInfo)

        //
        let ABI = abiInfo.ABI
        let metaData = abiInfo.metaData

        //
        let abiInterface = web3.eth.contract(ABI);
        log.debug(tag,"abiInterface: ",abiInterface)

        let contract = abiInterface.at(metaData.contractAddress);

        let getBalance = bluebird.promisify(contract.balanceOf.call);


        let balance = await getBalance(address, "pending")
        //console.log(tag,"balance: ",balance)

        return balance.toNumber()/metaData.BASE
    }catch(e){
        console.error(tag,e)
    }

    return d.promise
}


let get_balance_tokens = async function(address){
    var tag = TAG+ " | get_balance_tokens | "
    try{
        let output = {}
        //get dir of tokens
        let tokenListABI = fs.readdirSync("./coins/")
        log.debug(tag,"tokenListABI: ",tokenListABI)
        //return balance

        // output.ETH = await get_balance(address)
        // output.ETH = output.ETH.toNumber()/BASE

        for (let i = 0; i < tokenListABI.length; i++) {
            let token = tokenListABI[i]
            token = token.split(".")
            log.debug(tag,"tokenArray: ",token)
            token = token[0]
            let tokenBalance = await get_balance_token(address,token)
            if(tokenBalance > 0) output[token] = tokenBalance
        }
        return output
    } catch(e) {
        console.error(tag,e)
        throw e
    }
}


var get_transaction_receipt = function(txid){
    var d = when.defer();
    var tag = TAG+" | get_transaction | "
    var debug = true
    log.debug(tag,"txid: ",txid)
    //console.log(tag," web3.eth: ", web3.eth)

    web3.eth.getTransactionReceipt(txid, function (err, result) {
        if (err) console.error(tag," ERROR: ",err)
        if (err) d.reject(err)
        if (!result) d.reject("tx not found ");

        log.debug(tag,"result: ",result)
        var tx = {}
        // tx.address = result.to
        // tx.amount = web3.fromWei(result.value);
        // tx.confirmations = 1; //confirmation is checked after the 25 hours in wallet monitor, this is when it's already included in the blockchain.
        // tx.txid = result.hash;
        // tx.source = result.from;
        // // tx.fee = web3.fromWei(result.gasPrice)
        // //tx.isOur = isOurBoolean(result.to)
        // //if(tx.isOur) tx.category = 'receive'
        // //tx.category = 'send'
        // log.debug(tag,"tx: ",tx)
        d.resolve(result)
    })

    return d.promise
}

const _parseTxData = results => {
  let jsonKeys = ["event","params"]
  jsonKeys.forEach(key => {
    if ( typeof results[key] === "string" ) {
      try {
        results[key] = JSON.parse(results[key])
      } catch (ex) {
        log.warn(`unable to parse json for tx.${key}`, results[key], ex)
      }
    }
  })

  if ( results.payments && results.payments.length ) {
    results.payments = results.payments.map(payment => {
      try {
        payment = JSON.parse(payment)
      } catch (ex) {
        log.warn(`error trying to parse payment JSON`, payment, ex)
      }

      return payment
    })
  }

  return results
}

const get_transaction = async txid => {
  let results = await PromiseResults({
    tx: web3.eth.getTransaction(txid),
    receipt: web3.eth.getTransactionReceipt(txid),
    payments: redis.smembers(`payments:${txid.toLowerCase()}`),
    event: redis.hgetall(`tx:${txid.toLowerCase()}:event`),
    params: redis.hgetall(`tx:${txid.toLowerCase()}:params`)
  })

  results = _parseTxData(results)

  let { tx, receipt, payments, event, params } = results

  if ( !params && !event && !tx && !receipt && !payments.length ) {
    throw Error(`no data available for txid ${txid}`)
  }

  if ( receipt && tx ) {
    let gasUsed = new BN(receipt.gasUsed)
    let gasPrice = new BN(tx.gasPrice)
    let total = gasUsed.times(gasPrice).toString()
    tx.fee = web3.utils.fromWei(total, 'ether')
  }

  // merge it all together into one big blob
  tx = Object.assign({}, tx, { txid, payments, event, params }, receipt)

  return tx
}

const addmultisigaddress = async (addresses) => {
  const factory = new WalletFactory()

  // note that all storage of things in redis happens via contract-listner worker
  const wallet = await factory.createWallet(addresses[2])

  return wallet
}

// first address is gas address
function _backfillForwarders(addr) {
  addr = addr.toLowerCase()

  setTimeout(async () => {
    let count = await redis.scard(`forwarders:${addr}`)
    let elements = await redis.lrange("createforwarderqueue", 0, -1)

    log.debug(`${count} forwarders available for ${addr}`)

    let pending = 0
    elements.forEach(e => {
      if ( e === addr ) {
        pending++
      }
    })

    log.debug(`${pending} forwarders pending for ${addr}`)

    let needed = FORWARDER_BUFFER_SIZE - (pending + count)

    for (let i = 0; i < needed; i++) {
      // backfill however many forwarder addresses we need so we always have at least 5 available
      redis.rpush("createforwarderqueue", addr)
    }
  }, 1)
}

const getforwarder = async({ contractAddress }) => {
  contractAddress = contractAddress.toLowerCase()

  let address

  try {
    address = await redis.spop(`forwarders:${contractAddress}`)
  } catch (ex) {
    throw Error(`Error getting forwarder address for ${contractAddress}: ${ex.message}`)
  }

  _backfillForwarders(contractAddress)

  if ( address ) {
    // TODO: kill adding to redis here, hacky workaround
    await redis.sadd(`eth:wallet`, address.toLowerCase())
    return { address }
  } else {
    throw Error("No addresses available, try again shortly")
  }
}

const createforwarder = async ({ contractAddress, gasAddress }) => {
  const wallet = new EthereumMultiSigWallet({
    atAddress: contractAddress,
    gasAddress
  })

  let address = await wallet.createForwarder()

  await redis.sadd("eth:wallet", address.toLowerCase())

  return { address }
}

const flush_forwarder_tokens = async ({ token, wallet, forwarder }) => {
  let tokenContractAddress = TokenManager.contractAddress(token)
  if ( !tokenContractAddress ) {
    throw Error(`Unknown token symbol ${token}`)
  }

  const isWallet = await redis.sismember("wallets", wallet.toLowerCase())
  if ( !isWallet ) {
    throw Error("unknown wallet address, or wallet address is not ours")
  }

  let _forwarder = new ForwarderContract({ atAddress: forwarder })
  let _parent = await _forwarder.parentAddress()

  if ( wallet.toLowerCase() !== _parent.toLowerCase() ) {
    throw Error(`${forwarder} is not a forwarder for wallet at ${wallet}`)
  }

  let _wallet = new EthereumMultiSigWallet({
    atAddress: wallet,
    gasAddress: await getMasterAddress()
  })

  let txid = await _wallet.flushForwarderTokens(token, forwarder)

  return { txid }
}


let get_wallet_info = async function(){
    let tag = TAG+" | get_wallet_info | "
    try{
        let output = {
            version:"aman-0.0.1",
            parity:"",
            coin: COIN
        }
        //network info stuffs
        //output.isMining = web3.eth.isMining()
        //output.hashrate = web3.eth.getHashrate()
        let gasPrice = await get_gas_price()
        output.gasPrice = gasPrice.toString()

        //coinbase
        // let coinbase = await get_coinbase()
        // log.debug(tag,"coinbase: ",coinbase)
        // output.coinbase = coinbase

        //address count
        let accounts = await web3.eth.getAccounts()
        log.debug(tag,"accounts: ",accounts)
        let keypoolsize = accounts.length

        output.keypoolsize = keypoolsize
        output.accounts = accounts

        //detect mainnet/testnet
        output.protocolVersion = await web3.eth.getProtocolVersion()
        output.isSyncing = await web3.eth.isSyncing()
        output.network = await web3.eth.net.getNetworkType()
        output.peers = await web3.eth.net.getPeerCount()

        //blockheight
        output.blockNumber = await web3.eth.getBlockNumber()

        //get known tokens

        //get token balances
        // output.balances = await get_balance_tokens(coinbase)

        return output
    }catch(e){
        log.error(tag,"error: ",e)
        throw e
    }
}

const validatewalletaddress = async ({ signerAddress, walletAddress }) => {
  walletAddress = walletAddress.toLowerCase()
  signerAddress = signerAddress.toLowerCase()

  // first, make sure we know this is our wallet
  const isWallet = await redis.sismember("wallets", walletAddress)

  if ( !isWallet ) {
    return { valid: false, reason: "unknown wallet address" }
  }

  // then, confirm that the address is a signer
  const wallet = new EthereumMultiSigWallet({
    atAddress: walletAddress
  })

  let isSigner = await wallet.isSigner(signerAddress)
  let response = { valid: isSigner }

  if ( !isSigner ) {
    response.reason = "address is not a signer on the contract"
  }

  return response
}

const getsequenceid = async contractAddress => {
  const wallet = new EthereumMultiSigWallet({
    atAddress: contractAddress
  })

  return { sequenceId: await wallet.getNextSequenceId() }
}


const init_wallet = async function () {
    let tag = TAG+" | create_account | "
    let debug = true
    try {
        let mnemonic = MNEMONIC
        if(!mnemonic) throw Error("no mnemonic detected")
        if(debug) console.log("mnemonic: ",mnemonic)
        let seed = bip39.mnemonicToSeedHex(mnemonic)

        seed = seed.toString().trim()
        seed = seed.replace(/,/gi,' ');
        if(debug) console.log("seed: ",seed)

        let mk = new HDKey.fromMasterSeed(new Buffer(seed, 'hex'), coininfo('BTC').versions.bip32)
        if(debug) console.log(mk.privateExtendedKey)

        // create the hd wallet
        let wallet = EthereumBip44.fromPrivateSeed(mk.privateExtendedKey);

        //generate 100 addresses
        for (let i = 0; i < 100; i++) {
            let address = wallet.getAddress(i).toLowerCase()
            let privKey = wallet.getPrivateKey(i)
            redis.hincrby("eth:wallet:info","addressIndex",1)
            let addressInfo = {
                address,
                eth: true,
                path: "m/44'/60'/0'/0/"+i,
                privKey: encrypt(privKey.toString('hex'))
            }

            if(debug) console.log(tag,"address: ",address);
            if(debug) console.log(tag,"addressInfo: ",addressInfo);

            //save to redis
            redis.sadd("eth:wallet",address)
            redis.sadd("eth:wallet:ready",address)
            redis.hmset(address,addressInfo)
        }

    } catch(e){
        console.error(tag,"ERROR:300 ",e)
        throw e;
    }
}

//
const initialize_wallet = async function () {
    var tag = TAG+" | initialize_wallet | "
    let debug = true
    try {
        //
        let walletInfo = await redis.hgetall("eth:wallet:info")

        //
        if(!walletInfo){
            init_wallet()
        }
    } catch(e){
        console.error(tag,"ERROR:300 ",e)
        throw e;
    }
}

const validate_address = async function(address){
    const tag = TAG+" | validate_address | "

    try{
        const master = await getMasterAddress()
        let addressInfo = await redis.hgetall(address)
        if(addressInfo.privKey) delete addressInfo.privKey
        //isMaster
        addressInfo.isMaster = false
        if(address === master) addressInfo.isMaster = true

        //isMine
        let isMine = await redis.sismember("eth:wallet",address)
        addressInfo.isMine = isMine

        //TODO
        //isKeystore

        //isSeed
        return addressInfo
    }catch(e){
        log.error(tag,e)
        throw e
    }
}

// functions that are not coin specific
module.exports = {
    initialize: function () {
        return initialize_wallet()
    },
    getInfo: function () {
        return get_wallet_info()
    },
    getCoinbase: () => {
      return get_coinbase()
    },
    getGasPrice: () => {
        return get_gas_price()
    },
    getNewAddress: () => {
      return get_new_address()
    },
    getTransaction: function (txid) {
        return get_transaction(txid)
    },
    getBlockHeight: function () {
        return web3.eth.getBlockNumber
    },
    getBlockFromHeight: function (height) {
        return web3.eth.getBlock(height).hash
    },
    getHeight: async function (hash) {
        let blockInfo = await web3.eth.getBlock(hash)
        return blockInfo.number
    },
    validateAddress: function (address) {
        return validate_address(address)
    },
    validateWalletAddress: function() {
        return validatewalletaddress.apply(this, arguments)
    },
    createForwarder: function() {
        return createforwarder.apply(this, arguments)
    },
    getForwarder: function() {
        return getforwarder.apply(this, arguments)
    },
    flushForwarderTokens: function(token, contract, forwarder) {
        return flush_forwarder_tokens({ token, contract, forwarder })
    },
    // getAddressBalance: (address) => {
    //   return get_address_balance(address)
    // },
    // getBalanceToken: (address, token) => {
    //   return get_balance_token(address, token)
    // },
    getBalanceTokens: (address) => {
      return get_balance_tokens(address)
    },
    // getBalanceAddress: (address) => {
    //     return get_balance(address)
    // },
    // sendToAddress: (address,amount) => {
    //   return send_to_address(address,amount)
    // },
    getAccounts: () => {
        return list_accounts()
    },
    addMultisigAddress: function() {
        return addmultisigaddress.apply(this, arguments)
    },
    getSequenceId: function() {
        return getsequenceid.apply(this, arguments)
    }
}
