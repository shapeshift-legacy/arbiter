/**
 * Created by highlander on 12/23/16.
 */
// TODO move this ALL to config!
const coins = ['BTC','LTC','ETH']

let pairs = ['BTC_LTC', 'LTC_BTC', 'ETH_BTC', 'BTC_ETH']

let markets = []

let market1 = {
    id: 1,
    pair1: 'BTC_LTC',
    pair2: 'LTC_BTC',
    base_currency: 'LTC', // Base trends laregest marketcap
    quote_currency: 'BTC', // what are we selling
    base_min_size: '0.00000001', // divisiblity
    base_max_size: '21000000', // max units
    quote_increment: '0.0001' // pratical trading units (average fee)
}

let market2 = {
    id: 1,
    pair1: 'BTC_ETH',
    pair2: 'ETH_BTC',
    base_currency: 'ETH', // Base trends laregest marketcap
    quote_currency: 'BTC', // what are we selling
    base_min_size: '0.00000001', // divisiblity
    base_max_size: '21000000', // max units
    quote_increment: '0.0001' // pratical trading units (step size)
}

let debug = false

markets.push(market1)
markets.push(market2)

// Export
module.exports = {
    coins: function () {
        if(debug) console.log(' |markets| coins', coins)
        return coins
    },
    markets: function () {
        return markets
    },
    pairs: function () {
        return pairs
    },
    marketFromPair: function (pair) {
        return market_from_pair(pair)
    }
}

let market_from_pair = function (pair) {
    let market
    if (pair === 'LTC_BTC') market = 'LTC_BTC'
    if (pair === 'BTC_LTC') market = 'LTC_BTC'
    if (pair === 'ETH_BTC') market = 'ETH_BTC'
    if (pair === 'BTC_ETH') market = 'ETH_BTC'
    if (!market) throw Error('101: unknown pair! pair: ' + pair)
    return market
}