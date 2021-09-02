/*
        Get all data from coincap

        save in redis hash to make accessable

        update every 30seconds
 */

/**
 * Created by highlander on 4/24/16.
 */
/**
 * Created by highlander on 4/23/16.
 */
/**
 * Created by highlander on 3/18/2016.
 */
require('dotenv').config()
let when = require('when')
let request = require('request')

let TAG = ' | coincap | '

const log = require('@arbiter/dumb-lumberjack')()
const util = require('@arbiter/arb-redis')
const redis = util.redis

const coincap = require('../modules/coincap.js')

let update_rates = async function () {
    let tag = TAG + ' | update_rate | '
    try {
        //

        let rates = await coincap.rates()
        log.debug(tag, 'rates', rates)

        let coins = Object.keys(rates)
        for (let i = 0; i < coins.length; i++) {
            let coin = coins[i]
            log.debug(tag, 'coin:  ', coins[i])
            redis.hset('rates', coins[i], rates[coins[i]])
        }

        // updated
    } catch (e) {
        console.error(e)
    }
}

update_rates()
setInterval(update_rates, 1000 * 30)
