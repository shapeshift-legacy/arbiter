const TAG = " | ETH | "
const { ETH_UNLOCK_PW } = require("../configs/env")
const { web3 } = require('../modules/web3-manager')
const log = require('@arbiter/dumb-lumberjack')()

const getAccounts = () => {
  return new Promise((resolve, reject) => {
    web3.eth.getAccounts((err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

const unlock_accounts = async () => {
    let accounts = await getAccounts()

    accounts.forEach(async account => {
      log.debug(`unlocking ${account}`)
      let result = await web3.eth.personal.unlockAccount(account, ETH_UNLOCK_PW)
      log.debug(`unlock result`, result)
    })
}

unlock_accounts()
setInterval(unlock_accounts,1000 * 30)
