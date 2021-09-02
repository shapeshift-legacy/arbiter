const bitcoin = require('bitcoinjs-lib') // v3.x.x
//const networks = require('bitcoinjs-lib').networks
const bitcoinMessage = require('bitcoinjs-message')

//global
//let testnet = false
console.log(" | SIGNING | IS_TESTNET: ", process.env.REACT_APP_IS_TESTNET)
let testnet = process.env.REACT_APP_IS_TESTNET === "true" ? true : false
if(testnet === 'false') testnet = false

//
let PRIVKEY = process.env['AGENT_BTC_SIGNING_PRIVKEY']
let ACCOUNT = process.env['AGENT_BTC_SIGNING_PUBKEY']
//const config = require('./configs.js')
const log = require('@arbiter/dumb-lumberjack')()
const TAG = " | Signing module | "

module.exports = {
    init: function (isTestnet,account,privKey) {
        testnet = isTestnet
        ACCOUNT = account
        PRIVKEY = privKey
        return testnet;
    },
    sign: function (address,msg,privKey) {
        if(typeof(msg)==='object')msg = JSON.stringify(msg)
        return sign_message(address,msg,privKey);
    },
    verify: function (msg, address, sig) {
        return bitcoinMessage.verify(msg, address, sig);
    },
    validate: function (address,sig,msg) {
        if(!address) throw Error("101: missing address!")
        if(!sig) throw Error("102: missing sig!")
        if(!msg) throw Error("103: missing msg!")
        log.debug("address: ",address)
        log.debug("sig: ",sig)
        log.debug("msg: ",msg)
        log.debug("msg: ",typeof(msg))
        if(typeof(msg)==='object')msg = JSON.stringify(msg)
        return bitcoinMessage.verify(msg, address, sig);
    },
    //Notice order.... TODO fix this bs
    verifyMessage: function (address,sig,msg) {
        return bitcoinMessage.verify(msg, address, sig);
    },
}

var sign_message = async function(address,msg,privKey) {
    let tag = TAG + " | sign_message | "
    try {
        if(typeof(msg) != 'string') msg = JSON.stringify(msg)
        log.debug(tag, "address: ", address)
        log.debug(tag, "msg: ", msg)
        log.debug(tag, "privKey: ", privKey)
        if(!address) throw Error("104: missing address!")
        if(!msg) throw Error("105: missing msg!")
        //log.debug(tag,"coin: ",coin)

        if (!privKey) privKey = PRIVKEY
        if (!privKey) throw Error("101: unable to sign! no privKey!")
        log.debug(tag, 'privKey: ', privKey)
        //log.debug(tag,'testnet: ',networks.testnet)
        //log.debug(tag,'testnet: ',networks)
        // var keyPair = bitcoin.ECPair.fromWIF(privKey,networks.testnet)



        const networks = require('bitcoinjs-lib').networks
        let keyPair
        if(testnet){
            log.debug("testnet detected")
            keyPair = bitcoin.ECPair.fromWIF(privKey, networks.testnet)
        } else {
            log.debug("mainnet detected")
            keyPair = bitcoin.ECPair.fromWIF(privKey)
        }
        var privateKey = keyPair.d.toBuffer(32)
        if (!privateKey) throw Error("106: unable to build privkey buffer!")
        var message = msg

        var signature = bitcoinMessage.sign(message, privateKey, keyPair.compressed)
        if (!signature) throw Error("107: unable to build signature!")
        return signature.toString('base64')

    } catch (e) {
        console.error(tag, "Error: ", e)
        throw e
    }
}
