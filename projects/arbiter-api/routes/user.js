
const log = require('@arbiter/dumb-lumberjack')()
const config = require('../configs/env')
const Router = require('koa-router')
const axios = require('axios')
const { users } = require('../modules/mongo')
const router = new Router({
  prefix: '/api/v1/user'
})
const filterObject = require('../modules/filter-object')
const WAValidator = require('wallet-address-validator')

const ALLOWED_USER_FIELDS = [
  'id',
  'email',
  'username',
  'authProvider',
  'emailConfirmed',
  'updatedAt',
  'createdAt',
  'deletedAt',
  'signingBtcAddress',
  'Scopes',
  'eligibleForVerificationLevel',
  'verificationStatus',
  'twoFactorEnabled',
  'type'
]

const putActionHandler = async (ctx, next) => {
  let access_token = ctx.cookies.get('access_token')
  let me = await axios.get(config.OAUTH_ROOT+'/api/v1/users/me', {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  })

  if ( !me.data.data.id ) {
    ctx.throw(500, "could not find user")
  }

  let data = filterObject(ctx.request.body, ALLOWED_USER_FIELDS)

  log.debug(`validating signing address`, data.signingBtcAddress)

  if ( data.signingBtcAddress ) {
    let isValid = WAValidator.validate(data.signingBtcAddress, 'BTC')
    if ( !isValid ) {
      ctx.status = 400
      ctx.body = { error: "signing address is not a valid bitcoin address" }
      return
    }
  }

  log.debug(`data`, data)

  await users.update(
    { id: me.data.data.id },
    { $set: data },
    { new: true }
  )

  let user = await users.findOne({ id: me.data.data.id })

  ctx.cookies.set('fox_user', JSON.stringify(user), { httpOnly: false })

  ctx.body = user
}

const getActionHandler = async (ctx, next) => {
    let access_token = ctx.cookies.get('access_token')
    let me = await axios.get(config.OAUTH_ROOT+'/api/v1/users/me', {
        headers: {
            Authorization: `Bearer ${access_token}`
        }
    })

    if ( !me.data.data.id ) {
        ctx.throw(500, "could not find user")
    }

    let data = filterObject(ctx.request.body, ALLOWED_USER_FIELDS)

    log.debug(`validating signing address`, data.signingBtcAddress)

    if ( data.signingBtcAddress ) {
        let isValid = WAValidator.validate(data.signingBtcAddress, 'BTC')
        if ( !isValid ) {
            ctx.status = 400
            ctx.body = { error: "signing address is not a valid bitcoin address" }
            return
        }
    }

    log.debug(`data`, data)

    await users.update(
        { id: me.data.data.id },
        { $set: data },
        { new: true }
    )

    let user = await users.findOne({ id: me.data.data.id })

    ctx.cookies.set('fox_user', JSON.stringify(user), { httpOnly: false })

    ctx.body = user
}



router.put('/', putActionHandler)

module.exports = {
  router,
  getActionHandler,
  // remaining exported for testing purposes
  putActionHandler
}
