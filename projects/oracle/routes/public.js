
const TAG = " | public | "

const util = require('@arbiter/arb-redis')
const redis = util.redis
const subscriber = util.subscriber
const publisher = util.publisher
const log = require('@arbiter/dumb-lumberjack')()

/*****************************************
 //   module
 //*****************************************/

module.exports = {
    status: function (orderId) {
        return get_order_status(orderId)
    },
}



/*****************************************
 //   primary
 //*****************************************/


const get_order_status = async function (orderId) {
    let tag = TAG + ' | get_pubkey_for_order | '
    try {
        let orderInfo

        orderInfo = await redis.hgetall(orderId)
        if (!orderInfo) throw Error("100 unknown orderId: "+orderId)

        return orderInfo
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}
