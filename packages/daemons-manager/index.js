const Daemon = require('@arbiter/aman-client')
const log = require('dumb-lumberjack')()

const coins = () => {
  try {
    let _coins = process.env['COINS']
    return _coins.split(',').map(coin => coin.toUpperCase())
  } catch (ex) {
    console.error(`Error initializing coins: `, ex)
    process.exit()
  }
}

let daemons = {}

const _initDaemons = () => {
  try {
    let _coins = coins()
    _coins.forEach(coin => {
      daemons[coin.toLowerCase()] = new Daemon.Client({
        host: process.env[`${coin}_DAEMON_HOST`],
        port: process.env[`${coin}_DAEMON_PORT`],
        user: process.env[`${coin}_DAEMON_USER`],
        pass: process.env[`${coin}_DAEMON_PASS`],
        websocketport: process.env[`${coin}_DAEMON_WEBSOCKETPORT`]
      })
    })
  } catch (ex) {
    console.error(`WARNING: Error initializing daemons: `, ex)
  }
}

_initDaemons()

const getAddressInfo = async (coin, address) => {
  // BTC broke from RPC
  // TODO abstract to aman
  let info
  let symbol = normalizeCoin(coin)
  let daemon = daemons[symbol]

  if (coin === 1 || coin === 0) {
    try {
      info = await daemon.getAddressInfo(address)
    } catch (ex) {
      // assuming the issue is a btc versioning thing
      if ( ex.message === "Method not found" ) {
        log.warn(`'getAddressInfo' does not appear to be supported for '${symbol}', trying 'validateAddress' instead`)
        info = await daemon.validateAddress(address)
      } else {
        throw ex
      }
    }
  } else {
      info = await daemon.validateAddress(address)
  }

  return info
}

const normalizeCoin = coin => {
    switch (coin) {
        case 1:
            coin = 'btc'
            break
        case 0:
            coin = 'btc'
            break
        case 'BTC':
            coin = 'btc'
            break
        case 2.1:
            coin = 'ltc'
            break
        case 2:
            coin = 'ltc'
            break
        case 'LTC':
            coin = 'ltc'
            break
        default:
    }

    return coin
}


module.exports = {
  coins,
  daemons,
  getAddressInfo,
  normalizeCoin
}
