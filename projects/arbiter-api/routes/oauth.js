const { redis } = require('../modules/redis')
const log = require('@arbiter/dumb-lumberjack')()
const config = require('../configs/env')
const Router = require('koa-router')
const router = new Router()
const axios = require('axios')
const { users } = require('../modules/mongo')

router.get('/oauth', async (ctx, next) => {
  log.debug(`GET on /oauth`)

  let { code } = ctx.request.query

  if ( !code ) {
    log.error(`hmm, no code in request to /oauth`)
  }

  log.debug(`config.OAUTH_ROOT`, config.OAUTH_ROOT+'/oauth/token')

  try {
    let tokenInfo = await axios({
      url: config.OAUTH_ROOT+'/oauth/token',
      method: 'POST',
      data: {
        code,
        grant_type: 'authorization_code'
      },
      auth: {
        username: config.OAUTH_CLIENT_ID,
        password: config.OAUTH_SECRET
      }
    })

    log.debug(`auth succeeded`)

    let { access_token, refresh_token, token_type } = tokenInfo.data

    let me = await axios.get(config.OAUTH_ROOT+'/api/v1/users/me', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    })

    log.debug(`me`, me.data.data)

    // update or re-add users each time
    let user = await users.findOneAndUpdate(
      { id: me.data.data.id },
      { $set: me.data.data },
      { upsert: true }
    )

    log.debug(`upserted user ${me.data.data.id} into mongo`, user)

    let opts = { httpOnly: false }
    ctx.cookies.set('access_token', access_token, opts)
    ctx.cookies.set('refresh_token', refresh_token, opts)
    ctx.cookies.set('token_type', token_type, opts)
    ctx.cookies.set('fox_user', JSON.stringify(user), opts)
  } catch (ex) {
    log.error(`Error: `, ex)
  }

  // redirect to home page
  return ctx.redirect('/')
})

module.exports = { router }
