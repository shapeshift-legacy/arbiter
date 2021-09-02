const util = require('@arbiter/arb-redis')
const redis = util.redis
const subscriber = util.subscriber
const publisher = util.publisher

let event = {
    event: 'submit',
    quantity: 0.023255813953488375,
    rate: '0.043',
    orderId: '48c08449-9516-4c71-96aa-0959cc6f807d',
    status: 'live',
    payment:
        { value: 0.001,
            n: 1,
            scriptPubKey:
                { asm:
                    'OP_HASH160 3bead95d0d89ff81510c5d5b5fdf2f24dbc8ebd3 OP_EQUAL',
                    hex: 'a9143bead95d0d89ff81510c5d5b5fdf2f24dbc8ebd387',
                    reqSigs: 1,
                    type: 'scripthash',
                    addresses: [Array] },
            txid:
                '9f9c75ed98095cf74b033fc00b0046f0b11a1799fdd188df7c6980680f5d4cb0',
            coin: 'btc' }
    }



publisher.publish("publish",JSON.stringify(event))
