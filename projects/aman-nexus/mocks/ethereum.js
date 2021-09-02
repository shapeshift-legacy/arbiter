const uuid = require('node-uuid')
const util = require('@arbiter/arb-redis')
const redis = util.redis
let publisher = util.publisher


//console.log(uuid.v4())

let lastAddress
let lastAmount

let coin = "ETH"

module.exports = {
    getNewAddress: function () {
        return  "FAKE"+uuid.v4()
    },
    sendToAddress: function(address,amount) {
        //fire off credit event
        let output = {}
        output.coin = coin
        lastAmount = amount
        output.value = amount
        lastAddress = address
        output.to = address
        output.fee = 0.001
        output.from = "0x33b35c665496bA8E71B22373843376740401F106"
        //output.txid = uuid.v4()
        output.txid = "Thisisafaketxidbro"+uuid.v4()
        publisher.publish("credits",JSON.stringify(output))

        redis.hmset(output.txid,output)

        return output.txid
    },
    getTransaction: async function(txid) {
        // console.log("txid: ",txid)
        //
        // let output = {}
        // output.coin = coin
        // output.value = lastAmount
        // output.to = lastAddress
        // output.fee = "0.001"
        // output.from = "0x33b35c665496bA8E71B22373843376740401F106"
        // //output.txid = uuid.v4()
        // output.txid = "Thisisafaketxidbro"+uuid.v4()
        // redis.hmset(output.txid,output)

        let output = {}
        output.payments = []
        let payment = await redis.hgetall(txid)
        console.log("payment: ",payment)
        output.payments.push(payment)
        //let output = await redis.hgetall(txid)
        console.log("output: ",output)
        return output
    },
    eth_accounts: async function() {


        let output = {accounts:"asdfsfd"}
        return output
    },
    getforwarder: function(contractAddress) {
        let output = {}
        output.address = uuid.v4()
        return JSON.stringify(output)
    },
    createForwarder: function(contractAddress, gasAddress) {
        let output = {}
        output.address = uuid.v4()
        return JSON.stringify(output)
    },
    createRawTransaction: function() {
        return {}
    },
    createRawMultisigTransaction: function(toAddress, expireTime, amountInEth, data, sequenceId) {
        return {ophash:"thisisanophashahaha"}
    },
    signRawTransaction: function(tx) {
        return {signature:"thisisansignaturehehehe"}
    },
    getSequenceId: function() {
        return 1
    },
    validateAddress: function() {
        return {
            "isvalid": true,
            "address": "n2xJemqwi4nKDVUDqnzZmWx1zAjBN75w6Z",
            "scriptPubKey": "76a914eb2608abe4c100d501e3556d5630988b3c6c723e88ac",
            "ismine": true,
            "iswatchonly": false,
            "isscript": false,
            "iswitness": false,
            "pubkey": "03c9e6459b7077c89168b41aeb3d65b83aa67b05a770bb63dd0e6e801f19ed6cdc",
            "iscompressed": true,
            "account": "",
            "timestamp": 1526065775,
            "hdkeypath": "m/0'/0'/2021'",
            "hdmasterkeyid": "971c341b615edb6342990a8e456d557d33f3bd86"
        }

    },
    addMultisigAddress: function(addresses) {
        let output = {}
        output.address = uuid.v4()
        return JSON.stringify(output)
    },
    sendMultiSig: function(contractAddress, gasAddress, toAddress, expireTime, amountInEth, data, sequenceId, otherSig) {
        return {txid:"thisisapaymentBro"}
    },
}


let make_fake_address = async function(){
    let tag = TAG+" | unlock_all_accounts | "
    let debug = true
    try{



        return
    }catch(e){
        console.error(tag,"error: ",e)
    }
}
