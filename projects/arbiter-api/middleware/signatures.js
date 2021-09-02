
const log = require('@arbiter/dumb-lumberjack')()
const { ARBITER_SIGNING, NODE_ENV, VALIDATE_SIGS } = require('../configs/env')
const { btc } = require('@arbiter/arb-daemons-manager').daemons

if (!VALIDATE_SIGS && (NODE_ENV === 'prod' || NODE_ENV === 'production')) {
    log.error('WARNING: VALIDATE_SIGS is falsey but detected production environment. VALIDATE_SIGS cannot be disabled in production.')
}

const validateSignature = async function (ctx, next) {
    let { account, signature, payload } = ctx.request.body

    if (!account || !signature || !payload) {
        ctx.throw(400, 'request must contain an account, signature, and payload')
    }

    log.debug({ account, payload, signature })
    if (typeof (payload) === 'string') {
        payload = JSON.stringify(payload)
    }

    let validSig = await btc.verifyMessage(account, signature, JSON.stringify(payload))
    log.debug('valid sig', validSig)

    if (NODE_ENV === 'prod' && !validSig) {
        ctx.throw(403, '100: invalid signature')
    } else if (NODE_ENV !== 'prod') {
        if (VALIDATE_SIGS && !validSig) {
            ctx.throw(403, '100: invalid signature')
        }
    }

    return next()
}

const sign = async function (ctx, next) {
    if (!ARBITER_SIGNING) throw Error('110: invalid configs missing arbiter signing pubkey!')

    // can't use ctx.body cuz 0_o? witchcraft...
    let msg = ctx.response.body.payload

    if (typeof msg !== 'string') {
        msg = JSON.stringify(msg)
    }

    log.debug('sign', `msg`, msg)

    let sig = await btc.signMessage(ARBITER_SIGNING, msg)

    ctx.body.signature = sig

    return next()
}

module.exports = { sign, validateSignature }
