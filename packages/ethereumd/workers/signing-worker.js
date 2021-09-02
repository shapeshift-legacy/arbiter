

/**
 * Created by highlander on 9/10/17.
 */

/*
      Address Signer (aka: sentinel)
            -Highlander

      NOTE: This should only be ran on in Signing agent MODE


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
let TAG = " | signing-worker | "

let nerf = false

//Toolkit
let pause = function(length){
    let d = when.defer();
    let done = function(){d.resolve(true)}
    setTimeout(done,length*1000)
    return d.promise
}

let do_work = async function(){
    let debug = false
    let tag = TAG+" | do_work | "
    try{

        let txToSign = await redis.spop("queue:tx:sign")
        if(debug && txToSign) console.log(tag,"txToSign: ",txToSign)

        if(txToSign){
            console.log(tag, "Signing Tx!")


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
