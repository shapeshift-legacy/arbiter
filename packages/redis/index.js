/**
 * Created by highlander on 3/6/17.
 */
const TAG = " | redis | "
const config = {    // db settings
    REDIS_IP: process.env['REDIS_IP'] || '127.0.0.1',
    REDIS_PORT: process.env['REDIS_PORT'] || 6379
}

if(process.env['NODE_ENV'] === "production" && config.REDIS_IP === '127.0.0.1' ) throw Error("101: MISSCONFIGURATION!!! BAD CONFIGS BRO")
//console.log(TAG,"config",config)

const pubsub = require("redis")
const publisher = global.publisher || pubsub.createClient('redis://' + config.REDIS_IP + ':' + config.REDIS_PORT)
const subscriber = global.subscriber || pubsub.createClient('redis://' + config.REDIS_IP + ':' + config.REDIS_PORT)

const Redis = require('then-redis')
const redis = Redis.createClient('redis://' + config.REDIS_IP + ':' + config.REDIS_PORT)
const newClient = () => {
  return Redis.createClient('redis://' + config.REDIS_IP + ':' + config.REDIS_PORT)
}

module.exports = { redis, publisher, subscriber, newClient }
