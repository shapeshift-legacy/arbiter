
/*
    Init

    * does bot have a user in mongo?


    Pub/Sub integration via graphQl server

 */
const TAG = " | fomo-app | "
require('dotenv').config()
//require('dotenv').config({path: '.env'})
const marked = require('marked');
const Tokenizer = require('sentence-tokenizer');
const tokenizer = new Tokenizer('reddit');
const shortid = require('shortid')
const when = require('when')
const log = require('@arbiter/dumb-lumberjack')()
const describe = require('./modules/describe.js')
const util = require('@arbiter/arb-redis')
const redis = util.redis
const subscriber = util.subscriber
const publisher = util.publisher
const json2html = require('json-pretty-html').default

// modules
let request = require('./modules/request.js')
let views = require('./modules/views.js')
// const rive = require('./nlp/rive.js')
// rive.initialize()

const {usersDB, channelsDB} = require('./modules/mongo')

/***********************************************
 //        Self-building intergrations
 //***********************************************/
let integrations = {}
const admin = require('./commands/admin.js')
integrations['admin'] = admin
const liquidity = require('./commands/liquidity.js')
integrations['liquidity'] = liquidity
const mongo = require('./commands/mongo.js')
integrations['mongo'] = mongo
const charting = require('./commands/charting.js')
integrations['charting'] = charting
const exchange = require('./commands/exchange.js')
integrations['exchange'] = exchange
const time = require('./commands/time.js')
integrations['time'] = time
const reports = require('./commands/reports.js')
integrations['reports'] = reports
const coins = require('./commands/coins.js')
integrations['coins'] = coins

let commands = []
let commandInfo = []
let commandMap = {}
Object.keys(integrations).forEach(function(integration) {
    const map = describe.map(integrations[integration])

    //console.log(TAG,"map: ",map)
    Object.keys(map).forEach(function(key) {
        commands.push(key)
        commandMap[key] = integration
        commandInfo.push({command:key,params:map[key],module:integration})
    })

})
let integrationsMap = integrations

/***********************************************
 //        Pub/Sub
 //***********************************************/

//subscriber.subscribe('publish')
subscriber.subscribe('input')
subscriber.subscribe('help')
subscriber.subscribe('random')
subscriber.subscribe('general')

//TODO fix this for new setup!!!
// On-create
let botId = 'BOT001'
//let botId

let send_message = async function(message){
    try{
        let message = {
            id: shortid(),
            userId: botId,
            channelId: 'arbiter-events',
            content: '<h1>Bot is online!</h1>',
            dateAdded: new Date().getTime()
        }
        log.debug("message: ",message)
        let result = await publisher.publish('publish', JSON.stringify(message))
        log.debug("result: ",result)
    }catch(e){
        log.error(e)
    }
}

//send_message()

subscriber.on('message', async function (channel, payloadS) {
    var tag = TAG + ' | pub/sub | '
    let verbose = true
    try {
        // console.log("test!!!!")
        // send_message()

        log.debug(tag, 'channel: ', channel)
        log.debug(tag, 'payloadS: ', payloadS)
        const message = JSON.parse(payloadS)

        //slack hack
        message.text = message.content
        message.user = message.userId


        switch (channel) {
            case "input":
                //TODO switch on channel?
                let sentence = message.content
                let username = message.userId

                log.debug(tag,"sentence: ",sentence)
                //let resp = await rive.respond(sentence)
                let session = "test"

                //respond to msg
                let response = await deliberate_on_input(session,message,username)
                log.debug(tag,"response: ",response)
                if(!response) response = "I have no response for that"

                //output to JSON to markdown
                let outputMD = "response: "+JSON.stringify(response.sentences)
                //let content = JSON.stringify(response)
                if(response.markdown && response.view){
                    outputMD = outputMD + "\n"+response.view
                }

                let content = ""
                if(response.markdown && response.view || message.content === 'help'){
                    log.info(tag,"HELP DETECTED! : ",response)

                    outputMD = outputMD + "\n"+response.view


                    content = marked(outputMD)
                } else {
                    log.info(tag,"Checkpoint1! : ",response)

                    let sentences = response.sentences
                    log.info(tag,"sentences: ",sentences)


                    //let content = ""
                    for(let i = 0; i < sentences.length;i++){
                        try{
                            let jsonContent = JSON.parse(sentences[i])
                            log.info(tag,"jsonContent: ",jsonContent)
                            let html = json2html(jsonContent)
                            log.info(tag,"html: ",html)

                            content = content + html
                        }catch(e){
                            log.error(tag,"e: ",e)
                            content = content + ""
                        }
                    }

                }


                //TODO respond on channel spoken too
                let output = {
                    id: shortid(),
                    userId: botId,
                    channelId: 'help',
                    content,
                    dateAdded: new Date().getTime()
                }
                log.debug("output: ",output)
                await pause(.2)
                let result = await publisher.publish('publish', JSON.stringify(output))
                log.debug(tag,"result: ",result)
            default:
                log.debug(tag,"unhandled: ",channel)
                break
        }


    } catch (e) {
        log.error(tag, 'error: ', e)
    }
})

/***********************************************
 //        lib
 //***********************************************/

var pause = function(length){
    var d = when.defer();
    var done = function(){d.resolve(true)}
    setTimeout(done,length*1000)
    return d.promise
}

const deliberate_on_input = async function(session,data,username){
    const tag = " | deliberate_on_input | "
    const debug = true
    const debug1 = false
    try{
        let output = {}
        output.sentences = []
        if(debug) console.log(tag,"session: ",session)
        if(debug) console.log(tag,"data: ",data)
        if(debug) console.log(tag,"username: ",username)
        //save context
        await( redis.sadd(session,data.text))

        //Who am I talking too?
        let userInfo = await redis.hgetall(data.user)
        if(!userInfo) await redis.hmset(data.user,data)
        userInfo = data
        if(debug) console.log(tag,"userInfo: ",userInfo)

        //under what context?
        const context = await redis.smembers(session)
        if(debug) console.log(tag,"context: ",context)

        //commands


        //state
        //let state = await( redis.hgetall()

        //change of state

        tokenizer.setEntry(data.text);
        const sentences = tokenizer.getSentences()
        if(debug) console.log(tag,"sentences: ",sentences)

        const source = "slack"

        const tokens = tokenizer.getTokens(sentences)
        if(debug) console.log(tag,"tokens: ",tokens)


        //admin override
        // if(tokens[0] === "admin"){
        //     //remove first two tokens
        //
        // }

        //preprocessing
        let state = null
        if(userInfo.state) state = parseInt(userInfo.state)
        if(state){
            switch (state){
                case 1:
                    await redis.hset(data.user,"state",0)

                    break
                case 2:
                    // a command was handled and action taken
                    output.sentences.push("Ok, lets learn something")
                    //save?
                    break
                case null:

                    //ignore
                    break
                default:
                    //let response = await( rive.respond(sentences[i])
                    //output.push(response)
                    break
            }
        }

        //for each sentence
        for (let i = 0; i < sentences.length; i++) {
            switch (tokens[0]){
                case 'help':

                    let outputMD = ""


                    /*
                        Display help
                     */

                    Object.keys(integrations).forEach(function(integration) {
                        const map = describe.map(integrations[integration])
                        outputMD = outputMD +"\n---\n### Module: "+integration+ " \n"
                        outputMD = outputMD+ "\n| command        | param        |\n" +
                            "| :------------- |:-------------| \n"

                        //console.log(TAG,"map: ",map)
                        Object.keys(map).forEach(function(key) {
                            // commands.push(key)
                            // commandMap[key] = integration
                            // commandInfo.push({command:key,params:map[key],module:integration})
                            outputMD = outputMD+ "| "+key+":      | "+map[key]+" | \n"
                        })

                    })


                    output.view = outputMD
                    output.markdown = true
                    output.sentences.push("Here is what I can do")


                    break
                case "state":
                    output.sentences.push("state is "+state)
                    //ignore
                    break
            }
        }


        //commands
        if(tokens[0].indexOf(commands) && tokens[0] != 'help'){
            log.info(tag,'command detected! ')

            let params = tokens.splice(1)
            log.debug(tag,"params: ",params)

            //module
            log.debug(tag,"commandMap: ",commandMap)
            let commandModule = commandMap[tokens[0]]
            log.debug(tag,"commandModule: ",commandModule)

            //perform command
            var result = await(integrations[commandModule][tokens[0]].apply(this,params))
            log.debug(tag,"result:", result)

            output.sentences.push(JSON.stringify(result))
        }

        return output
    }catch(e){
        console.error(e)
    }
}
