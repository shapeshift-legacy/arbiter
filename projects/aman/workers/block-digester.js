const { redis, publisher } = require('../modules/redis-manager')
const fs = require('fs')
const path = require('path')
const log = require('@arbiter/dumb-lumberjack')()
const pause = require("../modules/pause")
const Web3Utils = require('web3-utils');
const { web3 } = require('../modules/web3-manager')
const TokenManager = require('../modules/token-manager')

function formatAddress(data) {
    var step1 = Web3Utils.hexToBytes(data);
    for (var i = 0; i < step1.length; i++) if (step1[0] == 0) step1.splice(0, 1);
    return Web3Utils.bytesToHex(step1);
}


// processes tx and checks for both eth and tokens payments,
// then stores the result in redis for processing
let process_tx = async function(tx) {
    let performance = true //performance filters by known tokens, and will miss extractions!

    try{
        let output = {}

        //things we know
        output.txid = tx.hash
        output.from = tx.from
        let txDecoded

        // NOTE: performance mode will miss unknown tokens!
        if(performance && tx.to){
            if(TokenManager.isKnownTokenAddress(tx.to)) {
                txDecoded = await web3.eth.getTransactionReceipt(tx.hash)
            }
        } else {
            txDecoded = await web3.eth.getTransactionReceipt(tx.hash)
        }

        //find
        if(txDecoded && txDecoded.logs[0] && txDecoded.logs.length === 1){
            let trxData = txDecoded.logs[0]
            output.tokenAddress = tx.to
            if(tx.to) output.coin = TokenManager.tokenForAddress(tx.to)

            if(trxData.data){
                let txAmount = Web3Utils.hexToNumberString(trxData.data)
                output.value = txAmount
                log.debug("txAmount: ", txAmount)
            }

            if(trxData.topics['1']){
                let fromAddress = formatAddress(trxData.topics['1'])
                log.debug("fromAddress: ", fromAddress)
                output.from = fromAddress
            }

            if(trxData.topics['2']){
                let toAddress = formatAddress(trxData.topics['2'])
                log.debug("toAddress: ", toAddress)
                output.to = toAddress
            }
        }

        if(!output.to && tx.to) output.to = tx.to

        let isToMe = false

        if(output.to) {
          isToMe = await redis.sismember("eth:wallet",output.to)
        }

        if(isToMe) {
            if(!output.coin) output.coin = 'ETH'
            if(output.coin === "ETH") output.value = web3.utils.fromWei(tx.value).toString()
            log.info("******************* payment ",tx)
            redis.sadd('payments', output.txid)
            // txids are sets that have objects of payments since txids can have multiple payments for tokens
            redis.sadd('payments:'+output.txid, JSON.stringify(output))
            //save as credit
            log.info("credit: ",output)
            publisher.publish("aman-credits",JSON.stringify(output))
        }

        return "done"
    } catch(e){
        log.error("error parsing tx: ", e, tx)
    }
}



let do_work = async function(){
    try{
        //TODO nerf any user turned off!

        let block
        block = await redis.spop("queue:blocks:high")
        log.debug("High priority block: ",block)
        if(!block) block = await redis.spop("queue:blocks")
        log.debug("block: ",block)

        if(block){
            log.info( "parseIng Block!",block)

            let blockInfo = await web3.eth.getBlock(block,true)
            if(!blockInfo) throw Error("E:102 Unable to get block! hash: "+block)

            //ad to scored set, blockhash block height
            let height = blockInfo.number
            height = parseInt(height, 10)
            redis.zadd("eth:block:scanned",height,block)

            let timeStart = new Date().getTime()
            if(blockInfo.transactions.length === 0) log.info("Empty Block!")

            for (var i = 0; i < blockInfo.transactions.length; i++){
                //types of tx
                let txInfo = blockInfo.transactions[i]
                log.debug("txInfo: ",txInfo)
                await process_tx(txInfo)
            }

            let timeEnd = new Date().getTime()
            let timeForBlock = timeEnd - timeStart
            log.info("timeForBlock: ",timeForBlock/1000," (seconds)")

            let workLeft = await redis.scard("queue:blocks")
            log.info("blocks left in queue: ",workLeft)
        } else {
            log.debug("idle!")
            await pause(10)
        }
    } catch(e) {
        log.error("Error checking for blocks: ", e)
    }

    do_work()
}

do_work()
