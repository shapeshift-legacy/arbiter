const { PubSub } = require('graphql-subscriptions')
const triggers = require('../apollo-server/triggers.js')
const shortid = require('shortid')

let pubsub = new PubSub()

let message = {
  id: shortid(),
  userId: 'Hf24BenkK',
  channelId: 'help',
  content: 'fuck you you fucking fuck',
  dateAdded: new Date().getTime() }
let type = 'added'

try{
  let result = pubsub.publish(triggers.MESSAGE_CHANGED, {
    messageChanged: {
      type,
      message,
    },
  })
  console.log(result)
}catch(e){
  console.error("e: ",e)
}
