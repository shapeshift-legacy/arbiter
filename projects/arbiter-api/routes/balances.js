
const log = require('@arbiter/dumb-lumberjack')()
const Router = require('koa-router')
const router = new Router({
  prefix: '/api/v1/balances'
})
const { daemons } = require('@arbiter/arb-daemons-manager')

router.get('/', async (ctx, next) => {
  log.debug(`daemons`, JSON.stringify(daemons, false, ' '))

  log.debug(`d2`, Object.keys(daemons))

  ctx.body = { balances: 'abcs' }

  let proms = []
  Object.keys(daemons).forEach(coin => {
    proms.push(new Promise((resolve, reject) => {
      daemons[coin].getBalance().then(res => {
        resolve({ [coin]: res })
      }).catch(ex => { resolve({ [coin]: ex })})
    }))
  })

  try {
    let results = await Promise.all(proms)
    ctx.body = results
  } catch (ex) {
    ctx.status = 500
    ctx.body = { ex }
  }

  return next()
})

module.exports = {
  router
}
