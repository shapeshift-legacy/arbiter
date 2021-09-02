'use strict'

const { REDIS_HOST, REDIS_PORT } = require('../configs/env')
const Redis = require('ioredis')

const redis = new Redis(REDIS_PORT, REDIS_HOST)
const subscriber = new Redis(REDIS_PORT, REDIS_HOST)
const publisher = new Redis(REDIS_PORT, REDIS_HOST)

const newClient = () => {
  return new Redis(REDIS_PORT, REDIS_HOST)
}

module.exports = exports = { redis, subscriber, publisher, newClient }
