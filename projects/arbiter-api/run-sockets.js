/*

    Websocket server

 */

const TAG = " | socket-API | "
/*
    // Demo socket server orderbook


    lastPrice
    order Create
    order Cancel
    order update
    order match (history)

 */
const util = require('@arbiter/arb-redis')
const redis = util.redis
const subscriber = util.subscriber
const publisher = util.publisher
const log = require('@arbiter/dumb-lumberjack')()


let global = {
    lastPrice:0.00848,
    volume24h:1336.30,
    pctChange24h:-0.51,
    pctChange1h:0.01,
    lowBid:0.00848,
    highAsk:0.00818,
    high24:0.0086348,
    low24:0.008438
}


const io = require('socket.io')();

let nonce = 0

io.on('connection', (client) => {
    subscriber.subscribe('publishToFront')
    subscriber.on('message', async function (channel, payloadS) {
        let tag = TAG + ' | arbiterLa accounting events | '
        try {
            let payload = JSON.parse(payloadS)
            log.debug(tag,"payload: ",payload)
            let event = payload.event
            if(!event) throw Error("102: invalid event!!!")

            //types of events
            switch (event) {
                case 'lastPrice':
                    client.emit('lastPrice', payload.lastPrice);
                    break;
                case 'volume24h':
                    client.emit('volume24h', payload.volume24h);
                    break;
                case 'pctChange24h':
                    client.emit('pctChange24h', payload.pctChange24h);
                    break;
                case 'pctChange1h':
                    client.emit('pctChange1h', payload.pctChange1h);
                    break;
                case 'lowBid':
                    client.emit('lowBid', payload.lowBid);
                    break;
                case 'highAsk':
                    client.emit('highAsk', payload.highAsk);
                    break;
                case 'high24':
                    client.emit('high24', payload.high24);
                    break;
                case 'low24':
                    client.emit('low24', payload.low24);
                    break;
            }
        }catch(e){
            log.error(tag,e)
            throw e
        }
    })
});

const port = 8000;
io.listen(port);
console.log('listening on port ', port);
