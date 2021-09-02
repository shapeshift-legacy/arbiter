/**
 * Created by highlander on 8/31/17.
 */

let TAG = " | coin rip | "
require('dotenv').config({path:"../.env"});

const when = require('when');
//mongo
const fs = require('fs')
const monk = require('monk')
const config = require("../config/configMaster").config()
const db = monk(config.mongred.archiveIp+':'+config.mongred.archivePort+'/asym');



const Redis = require('then-redis')
const redBack = Redis.createClient('tcp://' + config.mongred.ip + ':' + config.mongred.redis2Port);

const local_coin_client = require('bitcoin-promise');
//console.log(config)
const btc = new local_coin_client.Client(config.daemons.BTC.daemon)

let dbs = {}
let coin = "BTC"
dbs[coin+"Transfers"] = db.get(coin+"Transfers");
dbs[coin+"Transfers"].ensureIndex({txid: 1}, {unique: true})


// btc.getInfo()
//     .then(function(resp){
//         console.log(resp)
//     })


let digest_transfer_history = async function(dataChunk,coin){
    let tag = TAG+" | digest_transfer_history | "
    let debug = true
    try{
        //if(debug) console.log(tag,"dataChunk: ",dataChunk)
        if(debug) console.log(tag,"coin: ",coin)
        let txids = []
        for (let i = 0; i < dataChunk.length; i++) {
            let entry = dataChunk[i]
            if(debug) console.log(tag,"txid: ",entry.txid)
            txids.push(entry.txid)
            //save raw entry to db
            // entry.timestamp = entry.time
            try{
                let success = await dbs[coin + "Transfers"].insert(entry)
                if (debug) console.log(tag, "success: ", success)
            }catch(e){
                //if(debug) console.error(tag,"e:",e)
            }
        }

        txids = txids.filter(function(elem, pos) {
            return txids.indexOf(elem) == pos;
        })

        console.log(txids)
        console.log(txids.length)
    }catch(e){
        //off to ignore duplicate keys
        console.error(tag,"error: ",e)
    }
}


const pause = function(length){
    const d = when.defer();
    const done = function(){d.resolve(true)}
    setTimeout(done,length*1000)
    return d.promise
}


let run = async function(){
    let tag = TAG + " | run | "
    let debug = true
    try{
        let chunk = 1000

        let crawling = true
        while(crawling){
            let from = await redBack.get("btc:scan:from")
            if(!from) from = 0
            if(debug) console.log(tag,"from: ",from)
            from = parseInt(from)

            let dataChunk = await btc.listTransactions("",chunk,from)
            from = from + chunk
            await redBack.set("btc:scan:from",from)

            if(debug) console.log(tag,"dataChunk: ",dataChunk.length)
            let success = await digest_transfer_history(dataChunk,"BTC")
            //await pause(3)
        }

    }catch(e){
        console.error(e)
    }
}
run()



// btc.listTransactions("",10,10)
//     .then(function(resp){
//         console.log(resp.length)
//     })


//two actions

//get highest block scanned
//get lowest block scanned
//get block height


//if(blockHeight) > highest
//to forward scan

//if lowest > 0
//do backward scan




//get 1000 tx's at a time

//set chunk start a 0