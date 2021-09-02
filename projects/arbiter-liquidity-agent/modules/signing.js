
const TAG = ' | (modules/api) INTERFACE | '
// logging
const log = require('@arbiter/dumb-lumberjack')()
const config = require('../configs/env')
let { btc } = require('@arbiter/arb-daemons-manager').daemons

module.exports = {
    sign: function (pubkeySigning, outputS) {
        return sign_body(pubkeySigning, outputS)
    },
    validate: function (account, signature, order) {
        return validate_sig(account, signature, order)
    },
}

/*******************************************
 //primary
 //*******************************************/

let sign_body = async function (pubkeySigning, outputS) {
    try {
        let tag = TAG + ' | sign_body | '
        log.debug(tag, 'pubkeySigning: ', pubkeySigning)
        log.debug(tag, 'orderS: ', outputS)
        log.debug(tag, 'orderS: ', typeof (outputS))
        if (!pubkeySigning) throw Error('110: invalid configs missing arbiter signing pubkey!')
        if (typeof (outputS) !== 'string') outputS = JSON.stringify(outputS)
        let signature = await btc.signMessage(pubkeySigning, outputS)
        return signature
    } catch (e) {
        log.error('e', e)
        throw e
    }
}

let validate_sig = async function (account, signature, order) {
    let tag = TAG + ' | validate_sig | '
    try {
        log.info(tag, 'account: ', account)
        log.info(tag, 'signature: ', signature)
        log.info(tag, 'order: ', order)
        if (typeof (order) === 'object') order = JSON.stringify(order)
        let validSig = await btc.verifyMessage(account, signature, order)
        if (!validSig) throw Error('100: invalid signature!')
        return validSig
    } catch (e) {
        log.error('e', e)
        throw e
    }
}
