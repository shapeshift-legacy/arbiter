# Not-A-UI

UI bundle for project arbiter


## setup

config

nano .env-bundle


```$xslt

export REACT_APP_OAUTH_CLIENT_ID=""
export REACT_APP_OAUTH_ROOT=https://auth.shapeshift.io.staging.*yourdomain*.org
export REACT_APP_OAUTH_SECRET=""

```

other configs needed

```$xslt

LOCAL_SSL_KEY_PATH="ssl.key"
LOCAL_SSL_CERT_PATH="ssl.crt"
NODE_TLS_REJECT_UNAUTHORIZED=0

```


## install

npm i
npm run issue-ssl
npm build


node app.js

https://localhost:3000

MUST be https:// (non ssl is disabled!)

This is a self signed cert all curl will need --insecure!

### local .env


```$xslt
LOG_LEVEL_TXBUILDER=DEBUG
LOG_LEVEL_ARBITER=DEBUG
LOG_LEVEL_PUBLIC=DEBUG
LOG_LEVEL_PRIVATE=DEBUG
LOG_LEVEL_PAYMENTS=DEBUG
LOG_LEVEL_API=DEBUG
DEFAULT_LOG_LEVEL=DEBUG

ARBITER_SIGNING=""
ORACLE_SIGNING=""

BTC_DAEMON_HOST="127.0.0.1"
BTC_DAEMON_PORT="18330"
BTC_DAEMON_USER="alice"
BTC_DAEMON_PASS=""

LTC_DAEMON_HOST="127.0.0.1"
LTC_DAEMON_PORT="18331"
LTC_DAEMON_USER="alice"
LTC_DAEMON_PASS=""

ETH_DAEMON_HOST="127.0.0.1"
//ETH_DAEMON_PORT="18302"
ETH_DAEMON_PORT="18302"

GNT_DAEMON_HOST="127.0.0.1"
GNT_DAEMON_PORT="18303"

TRADE_PORT_LTC_BTC=5000
TRADE_PORT_ETH_BTC=5001
TRADE_PORT_GNT_BTC=5002

MARKETS=LTC_BTC,ETH_BTC,GNT_BTC
COINS=BTC,LTC,ETH,GNT


ETH_TOKENS="1ST,ANT,BAT,BNT,CVC,DGD,DNT,EDG,EOS,FUN,GNO,GNT,GUP,ICN,MLN,MTL,NMR,OMG,PAY,QTUM,RCN,REP,RLC,SALT,SNGLS,SNT,STORJ,SWT,TKN,TRST,WINGS,ZRX"
BTC_CLONES="LTC,BTC"

LOCAL_SSL_KEY_PATH="ssl.key"
LOCAL_SSL_CERT_PATH="ssl.crt"
```

### Generating SSL certs for running locally

Make sure to replace 'localhost' with the host where you expect it to run

```
openssl req -x509 -newkey rsa:4096 -keyout ssl.key -out ssl.crt -days 365 -nodes -subj '/CN=localhost'
```

### Auth/login/wallet/account overview


Entry to site

Signin with shapeshift

if ledger
    Done

if have recovery seed
    store in local storage

else generate
    prompt backup
    password encrypted server side

if have account
    "login" with password, decrypt seed
    store seed in local storage
