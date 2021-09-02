
const log = require('@arbiter/dumb-lumberjack')()
const { WALLET_FACTORY_ADDRESS } = require('../configs/env')
const Router = require('koa-router')
const router = new Router({
  prefix: '/api/v1/ethwalletfactoryaddress'
})
const { sign } = require('../middleware/signatures')

router.get('/', (ctx, next) => {
  if ( WALLET_FACTORY_ADDRESS === undefined ) {
    ctx.throw(500, "No eth wallet factory address available")
  }

  ctx.body = {
    payload: {
      ethWalletFactoryAddress: WALLET_FACTORY_ADDRESS
    }
  }

  return next()
})

// sign all outbound requests
router.use(sign)

module.exports = {
  router
}
