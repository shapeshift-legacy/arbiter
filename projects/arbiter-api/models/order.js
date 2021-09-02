
//TODO why is this broke out from accounting?????

const { redis } = require('../modules/redis')
const uuid = require('node-uuid')
const Big = require('big.js')
const { COIN_PRECISION } = require('../configs/env')

const _getPrecision = (coin) => {
  let precision = COIN_PRECISION[coin]
  if ( precision === undefined ) {
    throw `unknown precision for ${coin}`
  }
  return Big(precision)
}

class Order {
  constructor(id) {
    if ( id ) {
      this.id = id
    } else {
      this.id = uuid.v4()
    }
  }

  // TODO: get these synced up with precision tests from

  // update the balance for a given coin
  async credit(coin, amount) {
    coin = coin.toUpperCase()

    amount = parseFloat(amount)
    if ( amount < 0 ) {
      throw "cannot credit a negative amount"
    }

    let bal = await redis.hget(this.id, coin)
    if ( bal === undefined ) {
      bal = 0
    }
    bal = Big(bal)

    let precision = _getPrecision(coin)
    let total = Big(amount).times(precision).plus(bal)

    let result = await redis.hset(this.id, coin, total.toString())

    if ( !result ) {
      throw `call to 'credit' on order ${this.id} did not change balance`
    }
  }

  /*
    @param amount: normal float amount in the base of whichever currency; IE, 1.3012345 eth
  */
  async debit(coin, amount) {
    coin = coin.toUpperCase()

    amount = parseFloat(amount)
    if ( amount < 0 ) {
      throw "cannot debit a negative amount"
    }

    let bal = await redis.hget(this.id, coin)
    if ( bal === undefined ) {
      bal = 0
    }
    bal = Big(bal)

    let precision = _getPrecision(coin)
    amount = Big(amount).times(precision)

    // cmp is `compare`, and is -1 if bal is greater than amount
    if ( amount.cmp(bal) < 0 ) {
      throw 'OVERDRAFT! balance: ' + bal.toString() + ' amount: ' + amount.toString()
    }

    let total = bal.minus(amount)
    let result = await redis.hset(this.id, coin, total.toString())

    if ( !result ) {
      throw `call to 'debit' on order ${this.id} did not change balance`
    }
  }
}

module.exports = Order
