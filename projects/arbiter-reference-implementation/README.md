# arbiter NOT-A-UI project

npm i



```$xslt


```


notes:
http: is DISABLED, MUST use https://

Must allow inecure! 

edit transactions.sh

```$xslt

```

# arbiterRI

Arbiter's Reference Implementation (Note: all code in this repo is intended to be open source!)

# Prerequisites

Install mocha globally for running tests

`npm i -g mocha`

# Developer Documentation

Developer documentation is available at http://arb-api01.staging.redacted.example.com:3011

# Getting Started

For common users, getting started is as simple as simple as cloning the repo
and entering their addresses.

BONUS: If you want to use a ledger, this is also an option.

```
$ node cli.js
```

After completing your initial setup, you will be prompted to restart the CLI,
at which point you can begin placing trades with Arbiter.

# Developers

It can be confusing toggling back and forth between configs for different
environments, especially when toggling between CLI and e2e tests. To ease
the pain, you can use the following:

```
PREFER_ENV_CONFIG=true
```

When set in CLI, it will prefer environment variables over any config. Otherwise,
anything in `$HOME/arbiter-setup.js` will take priority over environment variables.
Generally speaking, `$HOME/arbiter-setup.js` *SHOULD* be ignored for tests.

# Running Tests - Developers

***NOTE*** Running tests involves either moving actual money or running in testnet.

To run in testnet, you'll need:

* `bitcoind -testnet`
* `litecoind -testnet`
* An eth node running in dev mode

You'll then need to specify at least the following in your config:

```
ARBITER_SIGNING_ADDRESS
ORACLE_SIGNING_ADDRESS
USER_BTC_SIGNING_ADDRESS
ORDER_PUBKEY

BTC_DAEMON_HOST
BTC_DAEMON_PORT
BTC_DAEMON_USER
BTC_DAEMON_PASS

LTC_DAEMON_HOST
LTC_DAEMON_PORT
LTC_DAEMON_USER
LTC_DAEMON_PASS

ETH_DAEMON_HOST
ETH_DAEMON_PORT
```

Compile the solidity contracts so their ABIs can be used in tests.

```
$ truffle compile
```

You'll need to setup some basic connection parameters. To make it easy to switch
back and forth between dev and staging parameters, create two .env-* files like
illustrated below. Dev params go in `.env`, staging in `.env-staging`.

```
# local
cp configs/example_dotenv.sh .env

# staging
cp configs/example_dotenv.sh .env-staging
```

Then, switching environments is as easy as:

```
# local
$ source .env
$ mocha test/e2e/my-test.spec.js

# staging
$ source .env-staging
$ mocha test/e2e/my-test.spec.js
```

For those unfamiliar, `source <file>` basically runs the bash script and sets
environment variables.

# Running Tests

This project is focused primarily on end-2-end test, which are at `test/e2e`.
Check out package.json for examples of how to run tests. e.g.:

`mocha test/e2e/1-unfullfilled-timeout-btc.e2e.spec.js`

# Building

To build an alpha release (before arbiter is publicly available):

```
# create a build to /tmp/arbRI-$build-hash.zip
./scripts/build-release.sh

# move it into place on docs server
BUILD=<my-build-$HASH>.zip
HOST=arb-api01.staging.redacted.example.com
REMOTE_USER=<my-remote-user>

scp /tmp/$BUILD $REMOTE_USER@arb-api01.staging.redacted.example.com:/tmp/
ssh $REMOTE_USER@$HOST << EOF
  sudo cp /tmp/$BUILD /home/<redacted>/arbiterDocs/public/builds/
  sudo chown -R <redacted>:<redacted> /home/<redacted>/arbiterDocs/public/builds/
  #THEN - update docs via arbiter-slate repo to link to new build
EOF
```
