const combineRouters = require('koa-combine-routers')
const { router: accountRouter } = require('./account')
const { router: ethWalletFactoryAddressRouter } = require('./eth-wallet-factory-address')
const { router: balancesRouter } = require('./balances')
const { router: oauthRouter } = require('./oauth')
const { router: userRouter } = require('./user')

const router = combineRouters([
  accountRouter,
  oauthRouter,
  userRouter,
  balancesRouter,
  ethWalletFactoryAddressRouter
])

module.exports = router
