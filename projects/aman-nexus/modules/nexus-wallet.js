/*

        Aman wallet


        Preserve balance history to mongo on intervial


        All credis
        All debits
        All addresses


        Pub/Pub on all events


*/

const log = require('@arbiter/dumb-lumberjack')()
const TAG = " | nexus-wallet | "
const config = require("../configs/env")

//redis
const util = require('@arbiter/arb-redis')
const redis = util.redis
const publisher = util.publisher
const subscriber = util.subscriber

//mongo
//const {match,balances,credits,debits} = require('./mongo.js')

//wallet
const { daemons } = require('@arbiter/arb-daemons-manager')
const { btc, ltc, eth } = daemons
const uwallet = { btc, ltc }

const audit = require("../modules/audit")
const mongo = require("@arbiter/arb-mongo")

/****************************************************
 // Module
 //****************************************************/
module.exports = {
    initialize: function () {
        return initialize_wallet()
    },

}



/****************************************************
 // Primary
 //****************************************************/

const initialize_wallet = async function(){
    let tag = TAG + " | initialize_wallet | "
    try{
        /*
            Audit strait

            Get all reported balances

            get last snapshot

            replay all events

            does expected balance = reported by clients

         */
        let balancesNew = await get_balances()
        log.debug(tag,"balancesNew: ",balancesNew)

        //publish and save
        //balances.insert(balancesNew)


        //TODO move to views
        let body = ":classical_building:  startup balances: "+balancesNew.btc+" (:BTC:) ("+(await get_value(balancesNew.btc,"BTC")).toFixed(2)+"(USD))  "+balancesNew.ltc+" (:LTC:) ("+(await get_value(balancesNew.ltc,"LTC")).toFixed(2)+"(USD))"
        let output = {view:{icon_emoji: ':rocket:'},msg:body,channel:config.SLACK_CHANNEL_EVENTS}
        log.info(tag,"output: ",output)
        publisher.publish("publishToSlack",JSON.stringify(output))
        publisher.publish("publish",JSON.stringify(output))


        await start_wallet('btc')
        await start_wallet('ltc')
        //get last snapshot

        //get all events from last snapshot

        //replay accounting

    }catch(e){
        log.error(tag,e)
    }
}

/****************************************************
 // Lib
 //****************************************************/


const start_wallet = async function(coin){
    let tag = TAG + " | start_wallet | coin: "+coin+" | "
    try{
        //get all daemons from configs
        // is wallet configed?
        //else throw

        //get reported balance
        let balanceReported = await uwallet[coin].getBalance()
        log.info(tag,"Reported balance: ",balanceReported)

        //get oldest history object
        let checkpoint = await mongo["wallet-"+coin+"-balances"].findOne({},{sort:{nonce:-1}})
        log.debug(tag,"checkpoint: ",checkpoint)

        //if no history rebuild
        if(!checkpoint){
            //build utxo
            let unspent = await find_all_unspent(coin)
            log.info(tag,"unspent: ",unspent)

            //get all transactions
            let txs = await find_all_txs(coin)
            log.info(tag,"txs: ",txs)

            //audit all tx's
            let auditResult = await audit.auditAccount(coin)
            log.info(tag,"auditResult: ",auditResult)
        } else {
            // does checkpoint = reported balances

            //else find missing tx's

        }



    }catch(e){
        log.error(tag,e)
    }
}


const find_all_txs = async function(coin){
    let tag = TAG + " | find_all_unspent | "
    try{
        //get all daemons from configs

        //get tx count
        //let walletInfo =

        coin = coin.toLowerCase()
        let txs = await uwallet[coin].listTransactions("*",3000)
        log.debug(tag,"txs: ",txs)

        //sum
        let totalRecieved = 0
        let totalSpent = 0

        //build balance object
        for (let i = 0; i < txs.length; i++) {
            let tx = txs[i]
            log.debug(tag,"tx: ",tx)

            //
            if(tx.category === "receive"){
                totalRecieved = totalRecieved + tx.amount
            } else if(tx.category === "send"){
                totalSpent = totalSpent + Math.abs(tx.amount)
            }


            //TODO dont hack like this, handle duplicates better
            try{
                await mongo['wallet-'+coin+'-txs'].insert(tx)
            }catch(e){}



        }

        //total in - total out - balance
        // does balance = reported balance?
        let balance = totalRecieved - totalSpent
        return {totalRecieved,totalSpent,balance}
    }catch(e){
        log.error(tag,e)
    }
}



const find_all_unspent = async function(coin){
    let tag = TAG + " | find_all_unspent | "
    try{
        //get all daemons from configs
        coin = coin.toLowerCase()
        let unspent = await uwallet[coin].listUnspent()
        log.debug(tag,"unspent: ",unspent)

        //sum
        let total = 0

        //build balance object
        let balances = {}
        for (let i = 0; i < unspent.length; i++) {
            let utxo = unspent[i]
            log.debug(tag,"utxo: ",utxo)
            //TODO dont hack like this, handle duplicates better
            try{
                await mongo['wallet-'+coin+'-utxo'].insert(utxo)
            }catch(e){}


            total = total + utxo.amount
        }
        return {totalUnspent:total,count:unspent.length}
    }catch(e){
        log.error(tag,e)
    }
}




let get_value = async function(amount,coin){
    try{
        coin = coin.toUpperCase()
        let rateBTC = await redis.hget("rates",coin)
        //console.log(rateBTC)

        return amount / (1/ rateBTC)
    }catch(e){
        console.error(e)
    }
}


const get_balances = async function(){
    let tag = TAG + " | get_balances | "
    try{
        //get all daemons from configs
        let wallets = Object.keys(uwallet)
        log.debug(tag,"wallets: ",wallets)

        //build balance object
        let balances = {}
        for (let i = 0; i < wallets.length; i++) {
            let wallet = wallets[i]
            let balance = await uwallet[wallet].getBalance()
            log.debug(tag,"balance: ",balance)
            balances[wallet] = balance
        }
        return balances
    }catch(e){
        log.error(tag,e)
    }
}
