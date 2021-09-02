/**
 * Created by highlander on 3/6/17.
 */

const config = require("./../configs/env");
//console.log(config)

const pubsub = require("redis")
const publisher = global.publisher || pubsub.createClient('redis://' + config.REDIS_IP + ':' + config.REDIS_PORT)
const subscriber = global.subscriber || pubsub.createClient('redis://' + config.REDIS_IP + ':' + config.REDIS_PORT)

const Redis = require('then-redis')
const redis = Redis.createClient('redis://' + config.REDIS_IP + ':' + config.REDIS_PORT)

module.exports = {redis, publisher, subscriber}