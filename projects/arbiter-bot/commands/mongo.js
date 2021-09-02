

/*
    Mongo Tools

    Highly permissive
 */

const TAG = " | MONGO tools | "
const log = require('@arbiter/dumb-lumberjack')()
/*
    MONGO

        fomo schema
  [
  'binance-balances',
  'binance-credits',
  'binance-debits',
  'binance-transfers',
  'binance-trades',
  'binance-txs',
  'binance-history'
  ]
 */

let mongo = require('@arbiter/arb-mongo')


//get db

//get


module.exports = {
    collections: async function (user) {
        let tag = TAG + " | settings | "
        let debug = true
        try {
            let output = {}
            let collections = Object.keys(mongo)
            for(let i = 0; i < collections.length; i++){
                let collection = collections[i]
                let collectionLength = await mongo[collection].count()
                output[collection] = collectionLength
            }
            return output
        } catch (e) {
            console.error(tag, "e: ", e)
        }
    },
    //
    count: async function (collection, user) {
        let tag = TAG + " | settings | "
        let debug = true
        try {
            let output = {}
            log.debug(tag,"user: ",user)
            log.debug(tag,"collection: ",collection)
            return await mongo[collection].count()
        } catch (e) {
            console.error(tag, "e: ", e)
        }
    },
    //build tx's

    //find py pram
    //get last
    drop: async function (collection, user) {
        let tag = TAG + " | settings | "
        let debug = true
        try {
            let output = {}
            log.debug(tag,"user: ",user)
            log.debug(tag,"collection: ",collection)
            return await mongo[collection].drop()
        } catch (e) {
            console.error(tag, "e: ", e)
        }
    },
    //get all
    find: async function (collection, user) {
        let tag = TAG + " | settings | "
        let debug = true
        try {
            let output = {}
            log.debug(tag,"user: ",user)
            log.debug(tag,"collection: ",collection)
            return await mongo[collection].find({},{limit:10})
        } catch (e) {
            console.error(tag, "e: ", e)
        }
    },

    //get fist

    //get last
    findOne: async function (collection, user) {
        let tag = TAG + " | settings | "
        let debug = true
        try {
            let output = {}
            log.debug(tag,"user: ",user)
            log.debug(tag,"collection: ",collection)
            return await mongo[collection].findOne({},{sort:{nonce:-1},limit:10})
        } catch (e) {
            console.error(tag, "e: ", e)
        }
    },
    //get last x
    //get last
    findOneSearch: async function (param, value, collection, user) {
        let tag = TAG + " | settings | "
        let debug = true
        try {
            let output = {}
            log.debug(tag,"user: ",user)
            log.debug(tag,"collection: ",collection)
            return await mongo[collection].findOne({[param]:value})
        } catch (e) {
            console.error(tag, "e: ", e)
        }
    },
}
