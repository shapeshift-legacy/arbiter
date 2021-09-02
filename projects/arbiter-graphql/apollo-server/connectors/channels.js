
const log = require('@arbiter/dumb-lumberjack')()
const util = require('../modules/redis')
const redis = util.redis
const {usersDB, channelsDB} = require('../modules/mongo')

exports.getAll = async (context) => {
  let tag = ' | getAll | '
  try {
    let output = []
    log.debug(tag, 'context: ', context)
    // get user
    let userId = context.token.userId
    log.debug(tag, 'userId: ', userId)
    let userInfo = await usersDB.findOne({id: userId})
    log.debug(tag, 'userInfo: ', userInfo)
    log.debug(tag, 'userInfo: ', typeof (userInfo))

    // // get all subscriptions
    // let subscriptions = userInfo.channels
    // log.debug(tag, 'subscriptions: ', subscriptions)
    // for (let i = 0; i < subscriptions.length; i++) {
    //   let subscription = subscriptions[i]
    //   let channelInfo = await channelsDB.find({id: subscription})
    //   output.push(channelInfo)
    // }
  
    const channels = [
      { id: 'arbiter', name: 'Arbiter Commands' },
      { id: 'general', name: 'General discussion' },
      { id: 'random', name: 'Have fun chatting!' },
      { id: 'help', name: 'Ask for or give help' },
    ]
  
  
    return channels
  } catch (e) {
    console.error(tag, e)
  }
}

exports.getOne = async (id, context) => {
  let tag = ' | getAll | '
  try {
    // get user
    let userId = context.token.userId
    log.debug(tag, 'userId: ', userId)
    let userInfo = await usersDB.findOne({id: userId})
    log.debug(tag, 'userInfo: ', userInfo)

    let output = await  channelsDB.find()
    log.info(tag,"")
    // TODO get channels for user
    // let output = []
    // let channels = await redis.smembers('channels')
    // for (let i = 0; i < channels.length; i++) {
    //   output.push(JSON.parse(channels[i]))
    // }
    return output.find(c => c.id === id)
  } catch (e) {
    console.error(tag, e)
  }
}

// exports.getOne = (id, context) => {
//   return channels.find(c => c.id === id)
// }
