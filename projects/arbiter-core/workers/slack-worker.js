
/*
        Redis pub/sub

        1 message a second limited slack push api
 */
const TAG = " | Slack | "
require('dotenv').config();

const SlackBot = require('slackbots');
const Tokenizer = require('sentence-tokenizer');
const tokenizer = new Tokenizer('reddit');

const util = require('@arbiter/arb-redis')
const subscriber = util.subscriber
const publisher = util.publisher
const redis = util.redis
const log = require('@arbiter/dumb-lumberjack')()


const config = require("../configs/env")
//log.debug(configs)

const bot = new SlackBot({
    token: config.SLACK_TOKEN, // Add a bot https://my.slack.com/services/new/bot and put the token
    name: config.SLACK_BOT_NAME
});

const defaultChannelName = config.SLACK_CHANNEL_NAME
const defaultChannel = config.SLACK_CHANNEL_ID
const defaultIsPrivate = config.SLACK_CHANNEL_TYPE
const botName = config.SLACK_BOT_NAME
// app on_start
let usersByIndex = {}
let usersByName = {}
let userAccounts = {}

let params = {
    icon_emoji: ':rocket:',
};

bot.on('start', async function() {
  let debug = true
    try{
      //
      let userList = await bot.getUsers()
      for (var i = 0; i < userList.members.length; i++) {
          usersByIndex[userList.members[i].id] = userList.members[i].name
          usersByName[userList.members[i].name] = userList.members[i].id
          await redis.hset(userList.members[i].id, "username", userList.members[i].name)
          await redis.hset(userList.members[i].name, "id", userList.members[i].id)
          await redis.sadd("slack:users",userList.members[i].name)
      }
      log.debug("usersArray: ",usersByIndex)
      log.debug("usersArray: ",usersByIndex)
      bot.postMessageToChannel("arbiter-events",botName+" is online", params);

  }catch(e){
      console.error(TAG," failed to start. ")
      throw e
  }
})


/*
        Sub to slack, push to redis


 */

//subscribe to redis
subscriber.subscribe("publishToSlack");
subscriber.on("message", async function (channel, payloadS)
{
    var tag = TAG+ " | publish_to_slack | "
    let debug = true
    try{

        let payload = JSON.parse(payloadS)
        log.debug(tag,"payload: ",payload)

        if(payload.msg){
            if(!payload.channel) throw Error("101: invalid payload missing: channel")
            //if(!payload.msg)     throw Error("101: invalid payload missing: msg")
            if(!payload.view)    throw Error("101: invalid payload missing: view")

            //if dev, push all to beta
            //if(configs.env === "dev") payload.channel = "beta-release"

            let result = await bot.postMessageToChannel(payload.channel, payload.msg, payload.view);
            log.debug(tag,"result: ",result)

        }

    }catch(e){
        console.error(tag,"Error: ",e)
    }
})



/*
        Sub to redis / push to slack


 */


bot.on('message', async function (data) {
    const tag = TAG+" | OnMessage | "
    try{
        const debug = true
        const verbose = true

        const event = data.type
        const channel = data.channel

        if(verbose) log.debug(tag,"data-pre:",data)
        //save event
        if(data.type === "reconnect_url") return false
        if(data.type === "presence_change") return false
        if(data.type === "user_typing") return false

        //TODO chatbot?
        //is message
        // if(data.type === "message" && usersByIndex[data.user]){
        //
        //
        //
        //     if(!data.text) return
        //     tokenizer.setEntry(data.text);
        //     let output = tokenizer.getSentences()
        //     if(verbose) log.debug(tag,"output: ",output)
        //     let tokens = tokenizer.getTokens(output)
        //     if(verbose) log.debug(tag,"tokens: ",tokens)
        //
        //     //publish to net
        //     let user = usersByIndex[data.user]
        //     let slackInput = {data,user,tokens}
        //     // publisher.publish("slackArbiter",JSON.stringify(slackInput))
        //     //
        //     // //add to queue
        //     // redis.sadd(slackInput)
        //     //
        //     // //TODO if mongo offline this never fullffills
        //     // //save all messages seen
        //     // let success = await slackInputs.insert(data)
        //     // log.debug(tag,"success: ",success)
        //
        // }


    }catch(e){
        console.error(tag,"e",e)
    }
});
