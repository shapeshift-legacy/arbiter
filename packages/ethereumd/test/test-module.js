require('dotenv').config({path:"../.env"});
let wallet = require('./../modules/eth-wallet.js')
const Redis  = require('promise-redis')();
const redis  = Redis.createClient();
const when   = require('when');

let TAG = " | test-module | "
let maxWorkQueue = 100


wallet.sendToAddress("0x33b35c665496bA8E71B22373843376740401F106",0.01)
    .then(function(resp){
        console.log("resp: ",resp)
    })

//blocks:scan
// redis.zcard("eth:block:scanned")
//     .then(function(resp){
//         console.log("total blocks scanned resp: ",resp)
//     })

//blocks scored set
// redis.zrevrangebyscore("eth:block:scanned","+inf","-inf")
//     .then(function(resp){
//         console.log("resp: ",resp)
//     })


//get lowest block
// redis.zrevrangebyscore("eth:block:scanned","+inf","-inf", "WITHSCORES","LIMIT",0,1)
//     .then(function(resp){
//         console.log("highest block: ",resp)
//     })

//get highest block
// redis.zrangebyscore("eth:block:scanned","-inf","+inf", "WITHSCORES","LIMIT",0,1)
//     .then(function(resp){
//         console.log("lowest block: ",resp)
//     })


let pause = function(length){
    let d = when.defer();
    let done = function(){d.resolve(true)}
    setTimeout(done,length*1000)
    return d.promise
}

/*
        Highlanders quick scan algo


        if parity ahead of redis, scan forward

        else scan backwords and backfill

        all scanning is low priority to workers
            NOTE: new blocks fall into high in real time
        (0 delay detecting new payments and backfills missed tx's until totally synced)

 */
// let scan_blocks = async function(){
//     let tag = TAG+" | scan_blocks | "
//     let debug = true
//     try{
//         let scanning = true
//         let state = "synchronising"
//         //get parity height
//         //wallet.getBlockHeight()
//
//         //get scanned height
//         let startHeight = await redis.zrevrangebyscore("eth:block:scanned","+inf","-inf", "WITHSCORES","LIMIT",0,1)
//         startHeight = parseInt(startHeight[1])
//
//
//
//         let height
//         height = startHeight - 1
//         //height = startHeight
//
//
//         //update status every 5 seconds
//         //estimate time till synced
//         let lastCount = await redis.zcard("eth:block:scanned")
//         let update = async function(){
//             try{
//                 //total blocks scanned
//                 let totalBlocks = await redis.zcard("eth:block:scanned")
//                 console.log(tag,"totalBlocks: ",totalBlocks)
//                 let scannedNew = totalBlocks - lastCount
//                 lastCount = scannedNew
//                 console.log(tag,"scannedNew: ",scannedNew)
//                 console.log(tag,"blocks per second: ",scannedNew/10)
//             }catch(e){
//
//             }
//         }
//         update()
//         setInterval(update,1000*10)
//
//         while(scanning){
//             if(debug) console.log(tag,"scanning: ",scanning)
//             if(debug)console.log(tag,"height: ",height)
//
//             //get block hash
//             let isMember = await redis.zrangebyscore("eth:block:scanned","("+height,height)
//             if(debug)console.log(tag,"isMember: ",isMember)
//
//             if(isMember.length === 0){
//                 //get block
//                 let block = await wallet.getBlockFromHeight(height)
//                 if(debug)console.log(tag,"block: ",block)
//                 //add to queue
//                 let successWork = await redis.sadd('queue:blocks',block)
//                 if(debug)console.log(tag,"successWork: ",successWork)
//
//
//             }
//
//             //if work < maxWorkQueue
//             let workQueue = await redis.scard("queue:blocks")
//             //if(workQueue >= maxWorkQueue) await pause(1)
//
//             //
//             height--
//         }
//
//     }catch(e){
//         console.error(tag,"e: ",e)
//     }
// }
//
// scan_blocks()

//get blockheight parity

// "scan for blocks"

// Get highest



// lookup -1 score
// if missing add hash to low priority queue

// let coin = "MEESH"
// let address = "0x651982e85d5e43db682cd6153488083e1b810798"
// let amount = 1
//
// wallet.sendToken(coin, address, amount)
//     .then(function(resp){
//         console.log("resp: ",resp)
//     })