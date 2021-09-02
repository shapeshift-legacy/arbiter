


const util = require('@arbiter/arb-redis')
const redis = util.redis
const subscriber = util.subscriber
const publisher = util.publisher

let message = {
  realm: 'arbiter',
  event: 'accountUpdate',
  txid: '400a4a05-e5bb-4273-aac6-48e70359ab24a',
  time: 1543088195812,
  account: 'mpyF2zVQAiQ1ysaDqxhXhiCBV2kBLPdYra',
  market: 'LTC_BTC',
  orderId: '400a4a05-e5bb-4273-aac6-48e70359ab24',
  quantity: 0.00007283,
  rate: '0.00728300',
  type: 'submit',
  coinIn: 'BTC',
  coinOut: 'LTC',
  coinFunding: 'BTC',
  newBalanceAccount: 99978151,
  newBalanceOrder: 7283,
  status: 'live',
    eventSummary:
  'new order created! orderIdL400a4a05-e5bb-4273-aac6-48e70359ab24'
}


publisher.publish("publishToFront",JSON.stringify(message))
