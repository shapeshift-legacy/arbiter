/*

 */
const shortid = require('shortid')

const log = require('@arbiter/dumb-lumberjack')()
const util = require('../modules/redis')
const redis = util.redis
const subscriber = util.subscriber
const publisher = util.publisher

// const {usersDB, channelsDB} = require('../modules/mongo')

// push
let message = {
  id: shortid(),
  userId: 'BOT001',
  channelId: 'help',
  content: ' <img src="http://127.0.0.1:3010/balances.jpg" alt="Girl in a jacket"> <a href="http://127.0.0.1:3010/balances.jpg"> Chart download </a>'+
  '</table> <br>here is your report <a href="http://127.0.0.1:3010/arbiterreport:.csv">Arbiter-report.csv</a>',
  dateAdded: new Date().getTime() }

publisher.publish('publish', JSON.stringify(message))
