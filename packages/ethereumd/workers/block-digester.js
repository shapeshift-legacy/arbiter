

/**
 * Created by highlander on 9/10/17.
 */


const when   = require('when');
const Redis  = require('promise-redis')();
const redis  = Redis.createClient();
const monk   = require('monk')
const fs     = require('fs')
const config = require("./../configs/configMaster").config()

let pubsub = require("redis")
    , subscriber = pubsub.createClient()
    , publisher  = pubsub.createClient();

const db = monk(config.mongred.ip+':'+config.mongred.mongoPort+'/aman');

const global = db.get("global");
const credits = db.get("credits");
const debits = db.get("debits");

//globals
let TAG = " | Block worker | "

let nerf = false

var Web3Utils = require('web3-utils');
var txDecoder = require('ethereum-tx-decoder');
let Web3 = require('web3');
let web3 = new Web3();
web3.setProvider(new Web3.providers.HttpProvider('http://'+config.daemons.ETH.daemon.host+":"+config.daemons.ETH.daemon.port));

//read dir of abi's
let tokenListABI = fs.readdirSync("../coins/")
//if(debug) console.log(tag,"tokenListABI: ",tokenListABI)

//parse
let knownTokens = {}
let knownTokensAddys = []

for (let i = 0; i < tokenListABI.length; i++) {
    let token = tokenListABI[i]
    token = token.split(".")
    token = token[0]
    let abiInfo = require("../coins/"+token.toUpperCase()+".abi.js")
    let metaData = abiInfo.metaData
    knownTokens[metaData.contractAddress.toLowerCase()] =  token
    knownTokensAddys.push(metaData.contractAddress.toLowerCase())
}
//console.log("knownTokens: ",knownTokens)

//Toolkit
let pause = function(length){
    let d = when.defer();
    let done = function(){d.resolve(true)}
    setTimeout(done,length*1000)
    return d.promise
}

function formatAddress(data) {
    var step1 = Web3Utils.hexToBytes(data);
    for (var i = 0; i < step1.length; i++) if (step1[0] == 0) step1.splice(0, 1);
    return Web3Utils.bytesToHex(step1);
}





let parse_tx = async function(tx){
    let debug = false
    let tag = TAG+" | parse_tx | "
    let blockexplorer = false
    let performance = true //performance filters by known tokens, and will miss extractions!
    try{
        let output = {}

        //things we know
        output.txid = tx.hash
        output.from = tx.from
        //console.log(tag,"txid: ",output.txid," TO: ",tx.to)
        let txDecoded

        // NOTE: performance mode will miss unknown tokens!
        if(performance && tx.to){
            if(knownTokensAddys.indexOf(tx.to.toLowerCase()) >= 0){
                txDecoded = web3.eth.getTransactionReceipt(tx.hash)

            }
        } else {
            txDecoded = web3.eth.getTransactionReceipt(tx.hash)
        }


        //find
        if(txDecoded && txDecoded.logs[0] && txDecoded.logs.length === 1){
            let trxData = txDecoded.logs[0]
            output.tokenAddress = tx.to
            if(tx.to) output.coin = knownTokens[tx.to.toLowerCase()]


            if(trxData.data){
                let txAmount = Web3Utils.hexToNumberString(trxData.data)
                output.value = txAmount
                if(debug) console.log("txAmount: ", txAmount)
            }

            if(trxData.topics['1']){
                let fromAddress = formatAddress(trxData.topics['1'])
                if(debug) console.log("fromAddress: ", fromAddress)
                output.from = fromAddress
            }

            if(trxData.topics['2']){
                let toAddress = formatAddress(trxData.topics['2'])
                if(debug) console.log("toAddress: ", toAddress)
                output.to = toAddress

            }
        }

        if(!output.to && tx.to) output.to = tx.to

        let isToMe = false
        if(output.to) isToMe = await redis.sismember("eth:wallet",output.to)
        let isFromMe = await redis.sismember("eth:wallet",output.from)

        //
        if(isToMe){
            if(!output.coin) output.coin = 'ETH'
            if(output.coin === "ETH") output.value = web3.fromWei(tx.value).toString()
            console.log("******************* payment ",tx)
            redis.sadd('payments',output.txid)
            redis.hmset(output.txid,output)
            //save as credit
            console.log(tag,"credit: ",output)
            publisher.publish("credits",JSON.stringify(output))
            //await credits.insert(output)
        }

        return "done"
    } catch(e){
        console.error(tag,"e: ",e)
        console.error(tag,"Bad action: ",e)

    }
}







let do_work = async function(){
    let debug = false
    let tag = TAG+" | do_work | "
    try{

        let block
        block = await redis.spop("queue:blocks:high")
        if(debug && block) console.log(tag,"High priority block: ",block)
        if(!block) block = await redis.spop("queue:blocks")
        if(debug && block) console.log(tag,"block: ",block)

        if(block){
            console.log(tag, "parseIng Block!",block)

            let blockInfo = web3.eth.getBlock(block,true)
            if(!blockInfo) throw "E:102 Unable to get block! hash: "+block

            //ad to scored set, blockhash block height
            let height = blockInfo.number
            height = parseInt(height)
            redis.zadd("eth:block:scanned",height,block)

            let timeStart = new Date().getTime()
            if(blockInfo.transactions.length == 0) console.log(tag+" Empty Block!")
            for (var i = 0; i < blockInfo.transactions.length; i++){

                //types of tx
                let txInfo = blockInfo.transactions[i]
                if(debug) console.log("txInfo: ",txInfo)
                let result = await parse_tx(txInfo)
            }
            let timeEnd = new Date().getTime()
            let timeForBlock = timeEnd - timeStart
            console.log(tag,"timeForBlock: ",timeForBlock/1000," (seconds)")
            do_work()
        } else {
            console.log("idle!")
            await pause(1)
            do_work()
        }
    } catch(e){
        console.error(tag,"e: ",e)
        console.error(tag,"Bad action: ",e)

    }
}

do_work()
