const crypto = require('crypto')
const ALGO = 'aes-256-ctr'
const { ENCRYPTION_KEY } = require("../configs/env")
const log = require('@arbiter/dumb-lumberjack')()

module.exports = {
  encrypt: (text) => {
    var cipher = crypto.createCipher(ALGO, ENCRYPTION_KEY)
    var crypted = cipher.update(text, 'utf8', 'hex')
    crypted += cipher.final('hex');
    return crypted;
  },

  decrypt: (text) => {
    log.debug(`decrypting`, text)
    var decipher = crypto.createDecipher(ALGO, ENCRYPTION_KEY)
    var dec = decipher.update(text, 'hex', 'utf8')
    dec += decipher.final('utf8');
    return dec;
  }
}
