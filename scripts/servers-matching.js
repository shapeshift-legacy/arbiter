#!/usr/bin/env node

const ARGV = require('minimist')(process.argv.slice(2))
const AWS = require('aws-sdk')
const REGIONS = {
  dev: "eu-west-1",
  staging: "eu-west-1",
  production: "eu-west-1" // bizarrely, this is a different region than our servers
}

const CONFIG = {
  aman: {
    filter: "arb*eth*",
    re: /arb.+eth.*/
  },
  oracle: {
    filter: "arb_oracle_api*",
    re: /arb_oracle_api.*/
  },
  "arbiter-api": {
    filter: "arb_api*",
    re: /arb_api.*/
  },

  // all else is core
  // "aman-nexus": {
  //   filter: "arb_core*",
  //   re: /arb_core.*/
  // },
  "arbiter-core": {
    filter: "arb_core*",
    re: /arb_core.*/
  },
  "arbiter-liquidity-agent": {
    filter: "arb_core*",
    re: /arb_core.*/
  },
  "arbiter-reference-implementation": {
    filter: "arb_api*",
    re: /arb_api.*/
  },
  // "arbiter-bot": {
  //   filter: "arb_core*",
  //   re: /arb_core.*/
  // },
  // "arbiter-admin": {
  //   filter: "arb_core*",
  //   re: /arb_core.*/
  // },
  // "arbiter-dashboard": {
  //   filter: "arb_core*",
  //   re: /arb_core.*/
  // },
  "@arbiter/arbiter-exchange-controller": {
    filter: "arb_core*",
    re: /arb_core.*/
  },
  "arbiter-trade-engine": {
    filter: "arb_core*",
    re: /arb_core.*/
  }
  // "arbiter-graphql": {
  //   filter: "arb_core*",
  //   re: /arb_core.*/
  // }
}

let [proj] = ARGV._

if (!Object.keys(CONFIG).includes(proj)) {
  process.exit()
}

let env = process.env.AWS_PROFILE
let region = REGIONS[env]

if ( !region ) {
  console.log(`could not find AWS region for env ${env}`)
  process.exit(1)
}

const credentials = new AWS.SharedIniFileCredentials({profile: env});
AWS.config.credentials = credentials;
AWS.config.update({ region })
const ec2 = new AWS.EC2({apiVersion: '2014-11-06'})

async function run() {
  let result = await ec2.describeInstances({
    Filters: [{
      Name: "tag:Name",
      Values: [ CONFIG[proj].filter ]
    }]
  }).promise()

  for (let res of result.Reservations) {
    for (let i of res.Instances) {
      i.Tags.forEach(t => {
        if ( t.Key === "Name" && CONFIG[proj].re.test(t.Value) ) {
          // only output what we need, which is the name of the hosts
          console.log(t.Value.replace(/_/g, '-'))
        }
      })
    }
  }

  process.exit()
}

run()
