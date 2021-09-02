
const { redis } = require('../modules/redis')
const log = require('@arbiter/dumb-lumberjack')()
const config = require('../configs/env')
const Account = require('../modules/account')
const Router = require('koa-router')
const router = new Router({
  prefix: '/api/v1/account'
})
const { validateSignature, sign } = require('../middleware/signatures')
const TAG = " | Router | | Account | "
// validate signatures on all requests for this endpoint
router.use(validateSignature)

let {reportARB, match,balances,credits,debits,orders,users} = require('../modules/mongo.js')

/*
 * Private Functions
 */

const _validateAccountRequest = async (ctx, next) => {
  log.debug(`validate`, ctx.request.body)
  let { account, payload } = ctx.request.body
  let { action } = payload

  // get account info
  let info = await redis.hgetall(account)

  log.debug('accountInfo: ', info)

  if (!info && action !== 'create') ctx.throw(400, '103: unknown account!')

  // if NOT account (sanity on redis keys)
  if (info && !info.account) ctx.throw(400, '104: account invalid! ')

  if(action !== 'create' && action !== 'read'){
      let isWhitelist = await redis.sismember('users:whitelisted',info.account)
      if(config.NODE_ENV === "dev") isWhitelist = true
      if(!isWhitelist)  ctx.throw(400, '105: account not authorized! ')
  }

  // make it accessible downstream
  ctx.state.account = account
  ctx.state.accountInfo = info
  ctx.state.payload = payload

  return next()
}

const _shouldValidateWallet = (input, existing) => {
  let conChange = ( input.contractAddress && input.contractAddress !== existing.contractAddress )
  let ethChange = ( input.ethAddress && input.ethAddress !== existing.ethAddress )

  // validate if the contract is different OR if the address is different and a wallet exists
  return conChange || ( ethChange && !!existing.contractAddress )
}

/*
 * Route Handlers
 */

const postActionHandler = async (ctx, next) => {
  log.debug(ctx.request.body)

  // we know these to be valid because they've run through _validateAccountRequest
  let { payload } = ctx.state
  let { action } = payload

  // action
  if ( typeof _actions[action] === "function" ) {
    await _actions[action](ctx)
  } else {
    ctx.throw(404, "not supported")
  }

  return next()
}

const _actions = {
  async read(ctx) {
    let { account, accountInfo } = ctx.state

    ctx.body = {
      account,
      payload: accountInfo
    }
  },

  update(ctx) {
    ctx.throw(400, "Use PUT instead :)")
  },

  async create(ctx) {
    let tag = TAG+" | create account | "
    // if ETH address given
    let { account, payload, accountInfo } = ctx.state

    if (accountInfo !== null) {
        ctx.throw(400, "account already exists")
    }

    let obj = {
      account,
      payload: {
        account,
        nonce:0
      }
    }

    if ( payload.ethAddress && payload.contractAddress ) {
      let newAccount = new Account(account)
      await newAccount.setEthWalletAddress(payload.ethAddress, payload.contractAddress)

      obj.payload.ethAddress = payload.ethAddress
      obj.payload.contractAddress = payload.contractAddress
      obj.payload.eth = true

    } else if ( payload.ethAddress ) {
      obj.payload.ethAddress = payload.ethAddress
      obj.payload.eth = true
    }

    await redis.hmset(account, obj.payload)
    await users.insert(obj.payload)
    // TODO: put in mongo

    // If dev credit free moniez
    if(config.NODE_ENV === "dev"){
      log.debug(tag," Giving free moniez")
      redis.hset(account,"BTC",config.FREE_MONEY_START)
    } else {
        log.debug(tag," Not giving free moniez")
    }

    ctx.body = obj
  },

  async orders(ctx) {
    let orderIds = await redis.smembers(`accountOrders:${ctx.state.account}`)
    log.debug(`orderIds`, orderIds)

    let proms = []
    for (let oid of orderIds) {
      proms.push(redis.hgetall(oid))
    }

    let orders = await Promise.all(proms)

    ctx.body = { payload: orders }
  }
}

const putActionHandler = async (ctx, next) => {
  try {
    let { contractAddress, ethAddress } = ctx.state.payload
    let account = new Account(ctx.state.account)

    log.debug('state', ctx.state)

    if ( _shouldValidateWallet(ctx.state.payload, ctx.state.accountInfo) ) {
      // change eth wallet address
      let address = ethAddress || ctx.state.accountInfo.ethAddress

      if ( !address ) {
        ctx.throw(400, "no eth address specified for account")
      }

      await account.setEthWalletAddress(contractAddress, address)
    }

    // if all above is good, just set it
    ctx.body = { payload: ctx.state.payload }

    return next()
  } catch (ex) {
    ctx.throw(400, ex.message)
  }
}

const getAccountInfo = async (ctx, next) => {
    try{

    }catch(e){

    }

    // let { contractAddress, ethAddress } = ctx.state.payload
    // let account = new Account(ctx.state.account)
    //
    // log.debug('state', ctx.state)
    //
    // if ( _shouldValidateWallet(ctx.state.payload, ctx.state.accountInfo) ) {
    //     // change eth wallet address
    //     let address = ethAddress || ctx.state.accountInfo.ethAddress
    //
    //     if ( !address ) {
    //         ctx.throw(400, "no eth address specified for account")
    //     }
    //
    //     await account.setEthWalletAddress(contractAddress, address)
    // }
    //
    // // if all above is good, just set it
    // ctx.body = { payload: ctx.state.payload }
    //
    // return next()
}

router.post('/', _validateAccountRequest, postActionHandler)
router.put('/', _validateAccountRequest, putActionHandler)
// router.get('/', _validateAccountRequest, getAccountInfo)
// router.get('/history', _validateAccountRequest, getAccountHistory)
// sign all outbound requests
router.use(sign)

module.exports = {
  router,

  // remaining exported for testing purposes
  _shouldValidateWallet,
  _validateAccountRequest,
  postActionHandler,
  //getActionHandler,
  putActionHandler
}
