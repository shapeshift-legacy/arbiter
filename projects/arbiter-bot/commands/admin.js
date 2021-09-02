


/**
 * Arbiter Admin commands
 *
 *  * lookup order
 *  * smart detect failed order
 *  * resubmit fullfillment
 *  * resubmit sweeping
 */

const log = require('@arbiter/dumb-lumberjack')()
const util = require('@arbiter/arb-redis')
const redis = util.redis
const subscriber = util.subscriber
const publisher = util.publisher


let TAG = " | FOMO-command | "


const {usersDB, channelsDB,usersDBAdmin,orders} = require('../modules/mongo')


module.exports = {
    //get all pending actions
    getUsers: async function ()
    {
        let tag = TAG + " | online | "
        let debug = true
        try{
            //get
            return usersDB.find()
        }catch(e){
            console.error(tag,"e: ",e)
        }
    },
    getAdminUsers: async function ()
    {
        let tag = TAG + " | online | "
        let debug = true
        try{
            //get
            return usersDBAdmin.find()
        }catch(e){
            console.error(tag,"e: ",e)
        }
    },
    getOrders: async function ()
    {
        let tag = TAG + " | online | "
        let debug = true
        try{
            //TODO filter by query

            //get
            return orders.find()
        }catch(e){
            console.error(tag,"e: ",e)
        }
    },
    addAddressToWhitelist: async function (address)
    {
        let tag = TAG + " | online | "
        let debug = true
        try{
            //get
            return redis.sadd('users:whitelisted',address)
        }catch(e){
            console.error(tag,"e: ",e)
        }
    },
    getWhitelist: async function ()
    {
        let tag = TAG + " | online | "
        let debug = true
        try{
            //get
            return redis.smembers('users:whitelisted')
        }catch(e){
            console.error(tag,"e: ",e)
        }
    },
    getLiveOrders: async function ()
    {
        let tag = TAG + " | online | "
        let debug = true
        try{
            //get
            let liveOrders = await redis.smembers('live')
            if(debug) console.log(tag,"liveOrders: ",liveOrders)
            return liveOrders
        }catch(e){
            console.error(tag,"e: ",e)
        }
    },
    getOrder: async function (orderId)
    {
        let tag = TAG + " | online | "
        let debug = true
        try{
            //get
            let orderInfo = await redis.hgetall(orderId)
            if(debug) console.log(tag,"orderInfo: ",orderInfo)
            return orderInfo
        }catch(e){
            console.error(tag,"e: ",e)
        }
    },
    getOrders: async function (account)
    {
        let tag = TAG + " | online | "
        let debug = true
        try{
            //TODO

        }catch(e){
            console.error(tag,"e: ",e)
        }
    },
    retryFullfill: async function (orderId)
    {
        let tag = TAG + " | online | "
        let debug = true
        try{
            log.debug(tag,"orderId: ",orderId)
            let isAdded = await redis.rpush('queue:orders:fullfillment',orderId)
            if(isAdded) console.log(tag,"isAdded: ",isAdded)
            return isAdded

        }catch(e){
            console.error(tag,"e: ",e)
        }
    },
    retrySweep: async function (orderId)
    {
        let tag = TAG + " | online | "
        let debug = true
        try{
            let isAdded = await redis.rpush('queue:orders:sweeping')
            if(isAdded) console.log(tag,"isAdded: ",isAdded)
            return isAdded
        }catch(e){
            console.error(tag,"e: ",e)
        }
    },
    retryReturn: async function (orderId)
    {
        let tag = TAG + " | online | "
        let debug = true
        try{
            let isAdded = await redis.zadd('orders_by_expiration', new Date().getTime(), orderId)
            if(isAdded) console.log(tag,"isAdded: ",isAdded)
            return isAdded
        }catch(e){
            console.error(tag,"e: ",e)
        }
    },
}
