
/*
 Since there are different user types, config requires an order of precedence
 1st: setupConfig,
 2nd: environment,
 3rd: hard-coded URLs
*/

let config = {
  // api settings
  PORT: process.env['PORT'] || 3000,
  NODE_ENV: process.env['NODE_ENV'] || 'dev',
  SECRET: process.env['SECRET:'] || '1234',

  // logging

  // oracle
  ORACLE_IP: process.env['ORACLE_IP'] || '127.0.0.1',
  ORACLE_PORT: process.env['ORACLE_PORT'] || 5555,
  ORACLE_MASTER_ETH: process.env['ORACLE_MASTER_ETH'] || '',
  ORACLE_SIGNING: process.env['ORACLE_SIGNING'] || '',

  // arbiter
  ARBITER_SIGNING: process.env['ARBITER_SIGNING'] || '',
  ARBITER_MASTER_ETH: process.env['ARBITER_MASTER_ETH'] || '',

  // db settings
  MONGO_IP: process.env['MONGO_IP'] || '127.0.0.1',
  REDIS_IP: process.env['REDIS_IP'] || '127.0.0.1',
  REDIS_PORT: process.env['REDIS_PORT'] || 6379,

  YUBIKEY_PUB: process.env['YUBIKEY_PUB'] || null,
  YUBIKEY_PRIV: process.env['YUBIKEY_PRIV'] || null,

  
  MONGO: {
    HOSTS: [{
      ip: process.env['MONGO_IP'] || '127.0.0.1',
      port: process.env['MONGO_PORT'] || 27017,
      // }, {
      //     ip: '127.0.0.1',
      //     port: 27017
    }],
    DB: process.env['MONGO_DB_NAME'] || 'arbiter-mongo',
    OPTIONS: {
      // abc: 123,
      // replicaSet: 'rs01'
    },
  },

  // dust
  DUST: {
    ETH: process.env['DUST_ETH'] || 0.001,
    LTC: process.env['DUST_LTC'] || 0.001,
    BTC: process.env['DUST_BTC'] || 0.0001,
  },


}

module.exports = config
