/*
    Custody API auditing Events

    Chain of custody on all non-swap-order funds

    Goals:

    maintains pubsub on all events

    maintains in memory real time balance object exportable on all accounts

    audits and maintains completeness assertion on all custodial accounts


 */
require('dotenv').config({path:"../../../.env"})

const TAG = " | custody | "
const log = require('@arbiter/dumb-lumberjack')()
const config = require("../configs/env")
const util = require('@arbiter/arb-redis')
const redis = util.redis
let publisher = util.publisher
let subscriber = util.subscriber
const Big = require('big.js')



/*

    MONGO

        fomo schema
  [
        'arbiterLa-balances',
        'arbiterLa-credits',
        'arbiterLa-debits',
        'arbiterLa-transfers',
        'arbiterLa-trades',
        'arbiterLa-txs',
        'arbiterLa-history',
        'arbiterLa-queries',
  ]

*/

let mongo = require('@arbiter/arb-mongo')
let views = require('@arbiter/arb-views')
//let diffTool = require('@arbiter/coin-diff-tool')
let signing = require('@arbiter/arb-signing')
let audit = require('./audit.js')


const SATOSHI = 100000000


/**************************************
 // Primary
 //*************************************/

/*
    Pub/Sub
    Keep up to date

    Listen to LA -realm events

    event summary

    deposit credit
    place order (balance debit order credit)
    cancel order (balance credit order debit)
    match event
    withdrawal

 */

subscriber.subscribe('arbiterLa')
subscriber.on('message', async function (channel, payloadS) {
    let tag = TAG + ' | arbiterLa accounting events | '
    try {
        let payload = JSON.parse(payloadS)
        log.debug(tag,"payload: ",payload)

        let event = payload.event
        if(!event) throw Error("102: invalid event!!!")

        let lastBlock

        switch (event) {
            case 'deposit':
                //
                payload.transfer = true
                try{
                    mongo['arbiterLa-txs'].insert(payload)
                }catch(e){}


                //get most recent block
                lastBlock = await mongo['arbiterLa-balances'].findOne({},{sort:{nonce:-1}})
                log.debug(tag,"lastBlock: ",lastBlock)
                if(!lastBlock){
                    lastBlock = {}
                    lastBlock.nonce = 0
                    lastBlock.balances = {}
                    lastBlock.balanceValuesBTC = {}
                    lastBlock.balanceValuesUSD = {}
                    lastBlock.prevBlock = "gensis"
                }
                log.debug(tag,"lastBlock: ",lastBlock)
                await audit.auditEvent(payload, lastBlock.nonce, lastBlock.balances, lastBlock.balanceValuesBTC, lastBlock.balanceValuesUSD, lastBlock.prevBlock)

                break;
            case 'submit':
                //
                try{
                    mongo['arbiterLa-txs'].insert(payload)
                }catch(e){}

                //get most recent block
                lastBlock = await mongo['arbiterLa-balances'].findOne({},{sort:{nonce:-1}})
                log.debug(tag,"lastBlock: ",lastBlock)
                if(!lastBlock) throw Error("103: can not find block!")

                audit.auditEvent(payload, lastBlock.nonce, lastBlock.balances, lastBlock.balanceValuesBTC, lastBlock.balanceValuesUSD, lastBlock.prevBlock)

                break;
            case 'cancel':
                try{
                    mongo['arbiterLa-txs'].insert(payload)
                }catch(e){}

                //get most recent block
                lastBlock = await mongo['arbiterLa-balances'].findOne({},{sort:{nonce:-1}})

                audit.auditEvent(payload, lastBlock.nonce, lastBlock.balances, lastBlock.balanceValuesBTC, lastBlock.balanceValuesUSD, lastBlock.prevBlock)

                break;
            case 'match':
                //
                try{
                    mongo['arbiterLa-txs'].insert(payload)
                }catch(e){}

                //get most recent block
                lastBlock = await mongo['arbiterLa-balances'].findOne({},{sort:{nonce:-1}})

                audit.auditEvent(payload, lastBlock.nonce, lastBlock.balances, lastBlock.balanceValuesBTC, lastBlock.balanceValuesUSD, lastBlock.prevBlock)

                break;
            case 'withdrawal':
                payload.transfer = true
                payload.withdrawal = true
                //
                try{
                    mongo['arbiterLa-txs'].insert(payload)
                }catch(e){}

                //get most recent block
                lastBlock = await mongo['arbiterLa-balances'].findOne({},{sort:{nonce:-1}})

                audit.auditEvent(payload, lastBlock.nonce, lastBlock.balances, lastBlock.balanceValuesBTC, lastBlock.balanceValuesUSD, lastBlock.prevBlock)

                break;
        }
    }catch(e){
        log.error(tag,e)
        throw e
    }
})
