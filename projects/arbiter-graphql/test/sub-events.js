/*

 */
const shortid = require('shortid')

const log = require('@arbiter/dumb-lumberjack')()
const util = require('../modules/redis')
const redis = util.redis
const subscriber = util.subscriber
const publisher = util.publisher

// const {usersDB, channelsDB} = require('../modules/mongo')

//channels


//subscriber.subscribe('publish')
subscriber.subscribe('help')
subscriber.subscribe('admin')
subscriber.subscribe('random')
subscriber.subscribe('general')
subscriber.subscribe('arbiter')

subscriber.on('message', async function (channel, payloadS) {
  var tag = TAG + ' | pub/sub | '
  try {
    //
    log.debug(tag, 'channel: ', channel)
    log.debug(tag, 'payloadS: ', payloadS)
    let message = JSON.parse(payloadS)
    
    
  } catch (e) {
    log.error(tag, 'error: ', e)
  }
})
