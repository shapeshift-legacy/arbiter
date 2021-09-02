module.exports = {
  // host: { source: target }
  "arb-eth": {
    passthrough: [
      "LOGGER_ADDRESS",
      "DEFAULT_LOG_LEVEL",
      "PROXY_FACTORY_ADDRESS",
      "FORWARDER_ADDRESS",
      "WALLET_ADDRESS",
      "WALLET_FACTORY_ADDRESS",
      'NODE_TLS_REJECT_UNAUTHORIZED',
      "ETH_DAEMON_WS_URL",
      "ETH_DAEMON_HTTP_URL",
      'ETH_DAEMON_HOST',
      'ETH_HTTP_PORT',
      'ETH_WEBSOCKET_PORT',
      "TOKENS",
      "GAS_PRICE_GWEI",
      "GAS_PRICE_BUFFER_GWEI"
    ],
    map: {
      "ARBITER_MASTER_ETH": "MASTER_ADDRESS"
    }
  },
  "arb-oracle-eth": {
    passthrough: [
      "LOGGER_ADDRESS",
      "DEFAULT_LOG_LEVEL",
      "PROXY_FACTORY_ADDRESS",
      "FORWARDER_ADDRESS",
      "WALLET_ADDRESS",
      "WALLET_FACTORY_ADDRESS",
      "ETH_DAEMON_WS_URL",
      "ETH_DAEMON_HTTP_URL",
      'ETH_DAEMON_HOST',
      'ETH_HTTP_PORT',
      'ETH_WEBSOCKET_PORT',
      "TOKENS",
      "GAS_PRICE_GWEI",
      "GAS_PRICE_BUFFER_GWEI"
    ],
    map: {
      ORACLE_MASTER_ETH: "MASTER_ADDRESS"
    }
  },
  "arbiter-trade-engine": {
    passthrough: [
      "AGENT_BTC_MASTER",
      "AGENT_BTC_SIGNING_PRIVKEY",
      'MONGO_IP',
      "DEFAULT_LOG_LEVEL",
      'REDIS_IP',
      'REDIS_HOST'
    ]
  },
  "arbiter-liquidity-agent": {
    passthrough: [
      "AGENT_BTC_MASTER",
      "AGENT_BTC_SIGNING_PRIVKEY",
      "BINANCE_PUBLIC",
      "BINANCE_PRIVATE",
      "COINS",
      "DEFAULT_LOG_LEVEL",
      'NODE_TLS_REJECT_UNAUTHORIZED',
      "MONGO_IP",
      "REDIS_IP",
      "REDIS_HOST",
      'SLACK_TOKEN',
      'SLACK_CHANNEL_NAME',
      'SLACK_BOT_NAME',
      'SLACK_CHANNEL_NAME',
      'SLACK_CHANNEL_NAME_REPORTS',
      'SLACK_CHANNEL_ID',
      'SLACK_CHANNEL_TYPE',
      'ARBITER_SIGNING',
      'TRADE_IP',
      'MARKETS'
    ],
    map: {
      LA_ARBITER_URL: "ARBITER_URL",
      ARBITER_BTC_DAEMON_HOST: "BTC_DAEMON_HOST",
      ARBITER_BTC_DAEMON_PORT: "BTC_DAEMON_PORT",
      ARBITER_BTC_DAEMON_USER: "BTC_DAEMON_USER",
      ARBITER_BTC_DAEMON_PASS: "BTC_DAEMON_PASS",
      ARBITER_LTC_DAEMON_HOST: "LTC_DAEMON_HOST",
      ARBITER_LTC_DAEMON_PORT: "LTC_DAEMON_PORT",
      ARBITER_LTC_DAEMON_USER: "LTC_DAEMON_USER",
      ARBITER_LTC_DAEMON_PASS: "LTC_DAEMON_PASS",
      ARBITER_ETH_DAEMON_HOST: "ETH_DAEMON_HOST",
      ARBITER_ETH_DAEMON_PORT: "ETH_DAEMON_PORT",
      ARBITER_GNT_DAEMON_HOST: "GNT_DAEMON_HOST",
      ARBITER_GNT_DAEMON_PORT: "GNT_DAEMON_PORT"
    }
  },
  "aman-nexus": {
      passthrough: [
          "SLACK_CHANNEL_EVENTS",
          "COINS",
          "MONGO_IP",
          "REDIS_IP",
          "REDIS_HOST"
      ],
      map: {
          ARBITER_BTC_DAEMON_HOST: "BTC_DAEMON_HOST",
          ARBITER_BTC_DAEMON_PORT: "BTC_DAEMON_PORT",
          ARBITER_BTC_DAEMON_USER: "BTC_DAEMON_USER",
          ARBITER_BTC_DAEMON_PASS: "BTC_DAEMON_PASS",
          ARBITER_LTC_DAEMON_HOST: "LTC_DAEMON_HOST",
          ARBITER_LTC_DAEMON_PORT: "LTC_DAEMON_PORT",
          ARBITER_LTC_DAEMON_USER: "LTC_DAEMON_USER",
          ARBITER_LTC_DAEMON_PASS: "LTC_DAEMON_PASS",
          ARBITER_ETH_DAEMON_HOST: "ETH_DAEMON_HOST",
          ARBITER_ETH_DAEMON_PORT: "ETH_DAEMON_PORT",
          ARBITER_GNT_DAEMON_HOST: "GNT_DAEMON_HOST",
          ARBITER_GNT_DAEMON_PORT: "GNT_DAEMON_PORT"
      }
  },
  "arbiter-bot": {
      passthrough: [
          "SLACK_CHANNEL_EVENTS",
          "BINANCE_PUBLIC",
          "BINANCE_PRIVATE",
          "COINS",
          "MONGO_IP",
          "REDIS_IP",
          "REDIS_HOST"
      ],
      map: {
      }
  },
  "arbiter-dashboard": {
     passthrough: [
            "SLACK_CHANNEL_EVENTS",
            "COINS",
            "DEFAULT_LOG_LEVEL",
            "MONGO_IP",
            "REDIS_IP",
            "REDIS_HOST"
     ],
     map: {}
  },
  "@arbiter/arbiter-exchange-controller": {
    passthrough: [
        "SLACK_CHANNEL_EVENTS",
        "DEFAULT_LOG_LEVEL",
        "COINS",
        "BINANCE_PUBLIC",
        "BINANCE_PRIVATE",
        "MONGO_IP",
        "REDIS_IP",
        "REDIS_HOST"
    ],
    map: {}
  },
  "arbiter-graphql": {
     passthrough: [
        "DEFAULT_LOG_LEVEL",
        "SLACK_CHANNEL_EVENTS",
        "YUBIKEY_PUB",
        "YUBIKEY_PRIV",
        "COINS",
        "MONGO_IP",
        "REDIS_IP",
        "REDIS_HOST"
     ],
     map: {}
  },
  "arb-oracle-api": {
    passthrough: [
      "DEFAULT_LOG_LEVEL",
      "ORACLE_PORT",
      "ORACLE_SIGNING",
      "ARBITER_SIGNING",
      'LOCAL_SSL_KEY_PATH',
      'LOCAL_SSL_CERT_PATH',
      'REDIS_HOST',
      "COINS"
    ],
    map: {
      ORACLE__REDIS_IP: "REDIS_IP",
      ORACLE_BTC_DAEMON_HOST: "BTC_DAEMON_HOST",
      ORACLE_BTC_DAEMON_PORT: "BTC_DAEMON_PORT",
      ORACLE_BTC_DAEMON_USER: "BTC_DAEMON_USER",
      ORACLE_BTC_DAEMON_PASS: "BTC_DAEMON_PASS",
      ORACLE_LTC_DAEMON_HOST: "LTC_DAEMON_HOST",
      ORACLE_LTC_DAEMON_PORT: "LTC_DAEMON_PORT",
      ORACLE_LTC_DAEMON_USER: "LTC_DAEMON_USER",
      ORACLE_LTC_DAEMON_PASS: "LTC_DAEMON_PASS",
      ORACLE_ETH_DAEMON_HOST: "ETH_DAEMON_HOST",
      ORACLE_ETH_DAEMON_PORT: "ETH_DAEMON_PORT",
      ORACLE_GNT_DAEMON_HOST: "GNT_DAEMON_HOST",
      ORACLE_GNT_DAEMON_PORT: "GNT_DAEMON_PORT"
    }
  },
  "arbiter-reference-implementation": {
    passthrough: [
      'COINS',
      "DEFAULT_LOG_LEVEL",
      'ARBITER_MASTER_ETH',
      'MASTER_LTC',
      'MASTER_BTC',
      'MASTER_ETH',
      'ORACLE_IP',
      'ORACLE_PORT',
      'ORACLE_MASTER_ETH',
      "TEST_NET"
    ],
    map: {
      E2E_ORACLE_HOST: "ORACLE_URL",
      E2E_ARBITER_HOST: "ARBITER_URL",
      ARBITER_SIGNING: "ARBITER_SIGNING_ADDRESS",
      ORACLE_SIGNING: "ORACLE_SIGNING_ADDRESS",
      ETH_DAEMON_HTTP_URL: "WEB3_HTTP_URL",
      ETH_DAEMON_WS_URL: "WEB3_WS_URL",
      ARBITER_BTC_DAEMON_HOST: "BTC_DAEMON_HOST",
      ARBITER_BTC_DAEMON_PORT: "BTC_DAEMON_PORT",
      ARBITER_BTC_DAEMON_USER: "BTC_DAEMON_USER",
      ARBITER_BTC_DAEMON_PASS: "BTC_DAEMON_PASS",
      ARBITER_LTC_DAEMON_HOST: "LTC_DAEMON_HOST",
      ARBITER_LTC_DAEMON_PORT: "LTC_DAEMON_PORT",
      ARBITER_LTC_DAEMON_USER: "LTC_DAEMON_USER",
      ARBITER_LTC_DAEMON_PASS: "LTC_DAEMON_PASS",
      ARBITER_ETH_DAEMON_HOST: "ETH_DAEMON_HOST",
      ARBITER_ETH_DAEMON_PORT: "ETH_DAEMON_PORT",
      ARBITER_GNT_DAEMON_HOST: "GNT_DAEMON_HOST",
      ARBITER_GNT_DAEMON_PORT: "GNT_DAEMON_PORT"
    }
  },
  "arb-core": {
    passthrough: [
      'COINS',
      'MONGO_IP',
      "DEFAULT_LOG_LEVEL",
      "BINANCE_PUBLIC",
      "BINANCE_PRIVATE",
      'NODE_TLS_REJECT_UNAUTHORIZED',
      'SLACK_TOKEN',
      'SLACK_CHANNEL_NAME',
      'SLACK_BOT_NAME',
      'SLACK_CHANNEL_NAME',
      'SLACK_CHANNEL_NAME_REPORTS',
      'SLACK_CHANNEL_ID',
      'SLACK_CHANNEL_TYPE',
      'ARBITER_MASTER_ETH',
      'MASTER_LTC',
      'MASTER_BTC',
      'MASTER_ETH',
      'ORACLE_IP',
      'ORACLE_PORT',
      'ORACLE_MASTER_ETH',
      'ORACLE_SIGNING',
      'ARBITER_SIGNING',
      'ARBITER_MASTER_ETH',
      'REDIS_IP',
      'REDIS_HOST',
      'TRADE_IP',
      'MARKETS'
    ],
    map: {
      ARBITER_BTC_DAEMON_HOST: "BTC_DAEMON_HOST",
      ARBITER_BTC_DAEMON_PORT: "BTC_DAEMON_PORT",
      ARBITER_BTC_DAEMON_USER: "BTC_DAEMON_USER",
      ARBITER_BTC_DAEMON_PASS: "BTC_DAEMON_PASS",
      ARBITER_LTC_DAEMON_HOST: "LTC_DAEMON_HOST",
      ARBITER_LTC_DAEMON_PORT: "LTC_DAEMON_PORT",
      ARBITER_LTC_DAEMON_USER: "LTC_DAEMON_USER",
      ARBITER_LTC_DAEMON_PASS: "LTC_DAEMON_PASS",
      ARBITER_ETH_DAEMON_HOST: "ETH_DAEMON_HOST",
      ARBITER_ETH_DAEMON_PORT: "ETH_DAEMON_PORT",
      ARBITER_GNT_DAEMON_HOST: "GNT_DAEMON_HOST",
      ARBITER_GNT_DAEMON_PORT: "GNT_DAEMON_PORT"
    }
  },
  "arb-api": {
    passthrough: [
      'COINS',
      "DEFAULT_LOG_LEVEL",
      'MONGO_IP',
      'REDIS_IP',
      'REDIS_HOST',
      'SLACK_TOKEN',
      'SLACK_CHANNEL_NAME',
      'ARBITER_MASTER_ETH',
      'MASTER_LTC',
      'MASTER_BTC',
      'MASTER_ETH',
      'LOCAL_SSL_KEY_PATH',
      'LOCAL_SSL_CERT_PATH',
      'ORACLE_IP',
      'ORACLE_PORT',
      'ORACLE_MASTER_ETH',
      'ORACLE_SIGNING',
      'OAUTH_ROOT',
      'OAUTH_SECRET',
      'OAUTH_CLIENT_ID',
      'ARBITER_SIGNING',
      'ARBITER_MASTER_ETH',
      'REACT_APP_OAUTH_CLIENT_ID',
      'REACT_APP_OAUTH_ROOT',
      'REACT_APP_IS_TESTNET',
      'REACT_APP_API_HOST',
      'TRADE_IP',
      'MARKETS',
      'WALLET_FACTORY_ADDRESS',
      'REACT_APP_ORACLE_URL'
    ],
    map: {
      // TODO: terrible, fix
      JUNK_THROWAWAY_ARBITER_SIGNING: "AGENT_BTC_SIGNING_PUBKEY",
      ARBITER_SIGNING_PRIVKEY: "AGENT_BTC_SIGNING_PRIVKEY",
      ARBITER_BTC_DAEMON_HOST: "BTC_DAEMON_HOST",
      ARBITER_BTC_DAEMON_PORT: "BTC_DAEMON_PORT",
      ARBITER_BTC_DAEMON_USER: "BTC_DAEMON_USER",
      ARBITER_BTC_DAEMON_PASS: "BTC_DAEMON_PASS",
      ARBITER_LTC_DAEMON_HOST: "LTC_DAEMON_HOST",
      ARBITER_LTC_DAEMON_PORT: "LTC_DAEMON_PORT",
      ARBITER_LTC_DAEMON_USER: "LTC_DAEMON_USER",
      ARBITER_LTC_DAEMON_PASS: "LTC_DAEMON_PASS",
      ARBITER_ETH_DAEMON_HOST: "ETH_DAEMON_HOST",
      ARBITER_ETH_DAEMON_PORT: "ETH_DAEMON_PORT",
      ARBITER_GNT_DAEMON_HOST: "GNT_DAEMON_HOST",
      ARBITER_GNT_DAEMON_PORT: "GNT_DAEMON_PORT"
    }
  }
}