/**
 * Created by highlander on 12/23/16.
 */

const { MARKETS, COINS, PAIRS } = require('../configs/env')

// Export
module.exports = {
    coins: function () {
        return COINS
    },
    markets: function () {
        return MARKETS
    },
    pairs: function () {
        return PAIRS
    },
    marketFromPair: function (pair) {
        return market_from_pair(pair)
    }
}

let market_from_pair = function (pair) {
    for (const m of MARKETS) {
      if ([m.pair1, m.pair2].includes(pair.toUpperCase())) {
        return m.pair2
      }
    }

    // if we haven't already returned then no market was found
    return undefined
}
