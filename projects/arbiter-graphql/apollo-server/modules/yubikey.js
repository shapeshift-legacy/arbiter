/**
 * Created by highlander on 4/3/17.
 */

let request = require('request')
// const async = require('asyncawait/async')
// const await = require('asyncawait/await')
let when = require('when')
let TAG = ' | balancer | '
let debug = false
let yub = require('yub')
const log = require('@arbiter/dumb-lumberjack')()

const config = require('./../configs/env')
//console.log(config)
yub.init(config.YUBIKEY_PUB, config.YUBIKEY_PRIV)

let users = []
let valid = Object.keys(users)

module.exports = {
  authenticate: function (auth) {
    return authenticate_press(auth)
  },
}

var authenticate_press = async function (auth) {
  let tag = TAG + ' | authenticate_press | '
  try {
    log.debug(tag,'auth',auth)
    let success = await yubikey(auth)
    log.debug(tag, 'success:', success)
    // checks
    if (!success.valid) throw Error(success.status)
    return success
  } catch (e) {
    log.error(tag, 'ERROR:', e)
    throw e
  }
}

const yubikey = function (auth) {
  return new Promise(function (resolve, reject) {
    yub.verify(auth, function (err, data) {
      resolve(data)
      reject(err)
    })
  })
}
