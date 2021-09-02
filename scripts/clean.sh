#!/usr/bin/env bash

rm -rf node_modules
rm -rf packages/accounting/node_modules
rm -rf packages/aman-cardano/node_modules
rm -rf packages/aman-client/node_modules
rm -rf packages/arb-config/node_modules
rm -rf packages/arbiter-api/node_modules
rm -rf packages/arbiter-custodial/node_modules
rm -rf packages/coin-type-info/node_modules
rm -rf packages/coincap/node_modules
rm -rf packages/daemons-manager/node_modules
rm -rf packages/describe/node_modules
rm -rf packages/diff-tool/node_modules
rm -rf packages/dumb-lumberjack/node_modules
rm -rf packages/ethereumd/node_modules
rm -rf packages/exchange-controller/node_modules
rm -rf packages/historical-prices/node_modules
rm -rf packages/hte-client/node_modules
rm -rf packages/mongo/node_modules
rm -rf packages/oracle-client/node_modules
rm -rf packages/passport-shapeshift/node_modules
rm -rf packages/rates/node_modules
rm -rf packages/redis/node_modules
rm -rf packages/shapeshift/node_modules
rm -rf packages/signing/node_modules
rm -rf packages/socket-client/node_modules
rm -rf packages/views/node_modules
rm -rf projects/aman/node_modules
rm -rf projects/aman-nexus/node_modules
rm -rf projects/arbiter-admin/node_modules
rm -rf projects/arbiter-api/node_modules
rm -rf projects/arbiter-bot/node_modules
rm -rf projects/arbiter-core/node_modules
rm -rf projects/arbiter-dashboard/node_modules
rm -rf projects/arbiter-graphql/node_modules
rm -rf projects/arbiter-liquidity-agent/node_modules
rm -rf projects/arbiter-reference-implementation/node_modules
rm -rf projects/arbiter-trade-engine/node_modules
rm -rf projects/oracle/node_modules


find . | grep package-lock.json | grep -v node_modules | while read -r line; do rm -v $line; done
