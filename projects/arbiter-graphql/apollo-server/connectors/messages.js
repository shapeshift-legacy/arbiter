const shortid = require('shortid')
const log = require('@arbiter/dumb-lumberjack')()
const util = require('../modules/redis')
const redis = util.redis
const subscriber = util.subscriber
const publisher = util.publisher
const triggers = require('../triggers')

const TAG = ' | messages | '
let messages = []
const mongo = require('@arbiter/arb-mongo')


const views = require('@arbiter/arb-views')


let on_create = async function(){
    let tag = TAG + " | on_create | "
    try{
        // find bot user in mongo
        let messagesSaved = await mongo['messages'].find({},{limit:10})

        messages = messagesSaved
    }catch(e){
        log.error(tag,e)
        throw e
    }
}

on_create()

subscriber.subscribe('publish')
subscriber.on('message', async function (channel, payloadS) {
    var tag = TAG + ' | pub/sub | '
    try {
        //
        log.info(tag, 'channel: ', channel)
        log.info(tag, 'payloadS: ', payloadS)

        let message = JSON.parse(payloadS)
        message = await views.smartView(message)
        messages.push(message)
        mongo['messages'].insert(message)
    } catch (e) {
        log.error(tag, 'error: ', e)
    }
})


function publishChange ({ type, message }, context) {
    let tag = TAG + ' | publishChange | '
    log.debug(tag,'type: ',type)
    context.pubsub.publish(triggers.MESSAGE_CHANGED, {
        messageChanged: {
            type,
            message,
        },
    })
}


exports.getAll = (channelId, context) => {
    return messages.filter(m => m.channelId === channelId)
}

exports.getOne = (id, context) => {
    return messages.find(m => m.id === id)
}

exports.add = ({ channelId, content }, context) => {
    let tag = TAG + ' add '
    try {
        const message = {
            id: shortid(),
            userId: context.userId,
            channelId: channelId,
            content: content,
            dateAdded: Date.now(),
        }
        messages.push(message)
        publishChange({
            type: 'added',
            message,
        }, context)

        log.debug(tag, 'message: ', message)
        //HACK everything in help channel
        //TODO support channel routing
        message.channelId = "help"
        publisher.publish('input', JSON.stringify(message))

        return message
    } catch (e) {
        console.error(tag, 'error: ', e)
        throw Error(e)
    }
}

exports.update = ({ id, content }, context) => {
    let tag = ' | update | '
    const message = exports.getOne(id, context)
    log.info(tag, 'context: ', context)
    if (!message) throw new Error('Message not found')
    Object.assign(message, {
        content,
        dateUpdated: Date.now(),
    })
    publishChange({
        type: 'updated',
        message,
    }, context)
    return message
}

exports.remove = (id, context) => {
    const index = messages.findIndex(m => m.id === id)
    if (index === -1) throw new Error('Message not found')
    const message = messages[index]
    messages.splice(index, 1)
    publishChange({
        type: 'removed',
        message,
    })
    return message
}
