
const config = require('../configs/env')
const { web3 } = require('./web3-manager')
const log = require('@arbiter/dumb-lumberjack')()
const pause = require('./pause')

let master = config.MASTER_ADDRESS

const getMasterAddress = () => {
  return new Promise((resolve, reject) => {
    if ( master ) {
      resolve(master)
    } else {
      web3.eth.getAccounts().then(accounts => resolve(accounts[0])).catch(reject)
    }
  })
}

if ( !master ) {
  web3.eth.getAccounts().then(accounts => {
    master = accounts[0]
  }).catch(ex => {
    log.error(`could not find master account, this will probably not end well...`, ex)
  })
}

// test helper to ensure we have at least x accounts
const _waitForMinAccounts = async min => {
  if ( !process.env.NODE_ENV === "test" ) {
    throw Error("_waitForMinAccounts should not be called a NODE_ENV besides 'test', current: "+process.env.NODE_ENV)
  }

  let len = 0, accounts

  do {
    accounts = await web3.eth.getAccounts()
    len = accounts.length

    if ( len < min ) {
      log.debug(`waiting for minimum of ${min} accounts, only have ${len}`)
      await pause(1)
    } else {
      log.debug(`found ${len} accounts, which is >= min of ${min}`)
    }
  } while (len < min)

  return accounts
}

module.exports = { getMasterAddress, _waitForMinAccounts }
