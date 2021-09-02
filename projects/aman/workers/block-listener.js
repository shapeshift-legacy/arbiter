
const log = require('@arbiter/dumb-lumberjack')()
const { web3, w3ws } = require('../modules/web3-manager')
const { redis } = require('../modules/redis-manager')
const socketMonitor = require('../modules/socket-monitor')

const listen_for_blocks = async function() {
    try {
        log.info(`starting block listener`)

        scan_for_missed_blocks()

        w3ws.eth.subscribe('newBlockHeaders', function(error, result){
            if (error) {
              log.error(error);
            } else {
              log.info(`listening for blocks`, result.number)
            }
        }).on("data", function(blockHeader) {
            log.debug('NEW_BLOCK_HEADERS_EVENT', blockHeader, arguments)
            redis.sadd("queue:blocks:high",blockHeader.hash)
        })

        //TODO this reliable? turnon?
        // w3ws.eth.subscribe('pendingTransactions', function(error, result){
        //     if (!error)
        //         console.log(result);
        //
        //     console.log(tag, 'pending tx listen result', result);
        // })
        // .on("data", function(transaction){
        //     console.log(tag, 'PENDING_TX_EVENT', transaction);
        // });

        //
        // filter.watch(async function(err,resp){
        //     //if(debug) console.log(tag,"err: ",err)
        //     if(debug) console.log(tag,"resp: ",resp)
        //     redis.sadd("queue:blocks",resp)
        //     //get block
        //     // let block = web3.eth.getBlock(resp,true)
        //     // if(debug) console.log(tag,"block: ",block)
        //
        //     //save to redis
        //
        //     //publish to payments
        //
        // })
    } catch(e) {
        log.error("error: ", e)
    }
}

const scan_for_missed_blocks = async () => {
  try {
    let lastBlock = await redis.zrevrange('eth:block:scanned', 0, 0, 'WITHSCORES')
    let [ hash, num ] = lastBlock

    let currentBlockNumber = await web3.eth.getBlockNumber()

    log.info(`last block scanned: ${num}, current block ${currentBlockNumber}`)

    if ( num === undefined ) {
      num = 0
    }

    num = +num

    while ( num < +currentBlockNumber ) {
      try {
        let block = await web3.eth.getBlock(num)
        await redis.sadd("queue:blocks", block.hash)
        log.info(`successfully added block ${num} to queue:blocks for processing`)
      } catch (gbex) {
        log.error(`error fetching block ${num} for processing: `, gbex)
      }

      num++
    }

    log.info(`done scanning for missed blocks`)
  } catch (ex) {
    log.error(`error scanning for missed blocks: `, ex)
  }
}

listen_for_blocks()

socketMonitor(listen_for_blocks)
