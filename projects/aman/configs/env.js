let tokens
const log = require('@arbiter/dumb-lumberjack')()

try {
  tokens = process.env['TOKENS'].split(",")
} catch (ex) {
  log.warn(`Error checking configured tokens: `, ex.message)
}

module.exports = {
  REDIS_HOST: process.env['REDIS_HOST'] || 'localhost',
  REDIS_PORT: process.env['REDIS_PORT'] || '6379',
  RPC_PORT: process.env['RPC_PORT'],
  ETH_UNLOCK_PW: process.env['ETH_UNLOCK_PW'],
  ETH_DAEMON_HTTP_URL: process.env['ETH_DAEMON_HTTP_URL'] || "http://localhost:8545",
  ETH_DAEMON_WS_URL: process.env['ETH_DAEMON_WS_URL'] || "ws://localhost:8546",
  ENCRYPTION_KEY: process.env['ENCRYPTION_KEY'],
  GAS_PRICE_GWEI: process.env['GAS_PRICE_GWEI'] || 10, // TODO deprecate
  GAS_PRICE_BUFFER_GWEI: process.env['GAS_PRICE_BUFFER_GWEI'] !== undefined ? parseInt(process.env['GAS_PRICE_BUFFER_GWEI'],10) : 5,
  WALLET_NOTIFY_URL: process.env['WALLET_NOTIFY_URL'],
  MASTER_ADDRESS: process.env['MASTER_ADDRESS'],
  TEST_CONTRACT_ADDRESS: process.env['TEST_CONTRACT_ADDRESS'],
  LOGGER_ADDRESS: process.env['LOGGER_ADDRESS'],
  PROXY_FACTORY_ADDRESS: process.env['PROXY_FACTORY_ADDRESS'],
  FORWARDER_ADDRESS: process.env['FORWARDER_ADDRESS'],
  NOC_TIMEOUT_MINUTES: process.env['NOC_TIMEOUT_MINUTES'] || 5, // default NOC timeout of 5m
  WALLET_ADDRESS: process.env['WALLET_ADDRESS'],
  WALLET_FACTORY_ADDRESS: process.env['WALLET_FACTORY_ADDRESS'],
  MNEMONIC: process.env['MNEMONIC'],
  CREATE_FORWARDER_POLLING_SECONDS: process.env['CREATE_FORWARDER_POLLING_SECONDS'] || 30,
  FORWARDER_BUFFER_SIZE: process.env['FORWARDER_BUFFER_SIZE'] || 5,
  MAX_CREATE_FORWARDER_RETRIES: process.env['MAX_CREATE_FORWARDER_RETRIES'] || 100,
  TEST_ACCOUNT: {
    address: process.env['TEST_ACCOUNT_ADDRESS'],
    pk: process.env['TEST_ACCOUNT_PK']
  },
  COIN: process.env['COIN'],
  TOKENS: tokens || [] // eg, TOKENS="SALT,1ST,EOS,GNT"
}
