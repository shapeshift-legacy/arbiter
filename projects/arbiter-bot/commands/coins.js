


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
const { daemons } = require('@arbiter/arb-daemons-manager')
const { btc, ltc, eth } = daemons

let TAG = " | FOMO-command | "


const {usersDB, channelsDB,usersDBAdmin,orders} = require('../modules/mongo')


module.exports = {
    //get all pending actions
    getBalances: async function (user)
    {
        let tag = TAG + " | online | "
        let debug = true
        try{
            //
            let output = {}
            let balanceBTC = await btc.getBalance()
            let balanceLTC = await ltc.getBalance()
            //let balanceETH = await eth.getBalance()
            output.BTC = balanceBTC
            output.LTC = balanceLTC
            //output.ETH = balanceETH

            return output
        }catch(e){
            console.error(tag,"e: ",e)
        }
    },
}
