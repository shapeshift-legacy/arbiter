
const Redis = require('ioredis')
const log = require('@arbiter/dumb-lumberjack')()

class RedisQueue {
  /*
    @param: redis
    may be either connection parameters or a redis instance
  */
  constructor(name, redis) {
    if ( !name || !redis ) {
      throw Error("'name' and 'redis' paramaters are required in RedisQueue::constructor")
    }

    if ( redis.connector ) {
      this._redis = redis
    } else if ( redis.host && redis.port ) {
      this._redis = new Redis(redis.port, redis.host)
    } else {
      throw Error("unknown redis config passed to RedisQueue::constructor")
    }

    this.queueName = name
    this._tag = `redis-queue[${name}]`
    this._poll()
  }

  push(item) {
    if ( typeof item !== "string" ) {
      item = JSON.stringify(item)
    }

    return this._redis.rpush(this.queueName, item).then(res => {
      log.debug(this._tag, `successfully placed ${item} onto queue`)
    }).catch(ex => {
      log.error(this._tag, `failed to put ${item} onto queue`, ex)
    })
  }

  /*
    @params: callback = (event) => { ... }
  */
  onMessage(callback) {
    if ( this._callback ) {
      log.warn(this._tag, `overriding existing 'onMessage' callback for ${this.queueName}`)
    }

    this._callback = callback

    return this
  }

  onError(callback) {
    if ( this._errback ) {
      log.warn(this._tag, `overriding existing 'onError' callback for ${this.queueName}`)
    }

    this._errorback = callback

    return this
  }

  length() {
    return this._redis.llen(this.queueName)
  }

  _poll() {
    log.info(`redis-queue [${this.queueName}]: long polling...`)
    this._redis.blpop(this.queueName, 30).then(res => {
      if ( res && this._callback ) {
        let [ name, val ] = res
        if ( name !== this.queueName ) {
          log.warn(this._tag, `received a notification for a queue I'm not listening to!`, res)
          return setTimeout(this._poll.bind(this), 1)
        }

        try {
          val = JSON.parse(val) // simple attempt to deserialize
        } catch (ex) { /* noop */ }

        // notify each of the listeners with the data
        this._callback(val)
      }

      setTimeout(this._poll.bind(this), 1)
    }).catch(ex => {
      log.error(this._tag, `error reading from queue`, ex)

      if ( this._errorback ) {
        this._errorback(ex)
      }

      setTimeout(this._poll.bind(this), 1)
    })
  }
}

module.exports = RedisQueue
