#!/usr/bin/env node

const ARGV = require('minimist')(process.argv.slice(2))
const COMMANDS = ['help', 'list', 'set', 'unset', 'generate-env']
const ENVS = ['dev', 'staging', 'production']
const PROJECT_CONFIG = require('../project-config')
var pjson = require('../package.json');


const AWS = require('aws-sdk')
const REGIONS = {
  dev: "eu-west-1",
  staging: "eu-west-1",
  production: "eu-west-1" // bizarrely, this is a different region than our servers
}

const CONFIG_PATH = '/arbiter/'

function usage() {
  console.log("CURRENT VERSION: ",pjson.version);
  //TODO throw if out of date
  console.log(`******************************************`)
  console.log(`Usage: "node index.js <dev|staging|production> <help|list|set|generate-env> <args>"`)
  console.log(``)
  console.log(`Examples:`)
  console.log(`node index.js staging list`)
  console.log(`node index.js dev set MY_CONFIG="my config setting"`)
  console.log(`node index.js dev generate-env arb-eth01 aman`)
}

let [env, command, ...argString] = ARGV._

if (!command || command.toLowerCase() === "help") {
  usage()
  process.exit()
}

command = command.toLowerCase()

if (!COMMANDS.includes(command)) {
  usage()
  process.exit(1)
}

env = env || process.env['SS_ENV']

if (!env || !ENVS.includes(env.toLowerCase())) {
  usage()
  process.exit(1)
}

let region = REGIONS[env]

if ( !region ) {
  console.log(`could not find AWS region for env ${env}`)
  process.exit(1)
}

const credentials = new AWS.SharedIniFileCredentials({profile: env});
AWS.config.credentials = credentials;
AWS.config.update({ region })
const ssm = new AWS.SSM({apiVersion: '2014-11-06'})


async function run() {
  try {
    switch (command) {
      case "list":
        await list();
        break;
      case "set":
        await set();
        break;
      case "unset":
        await unset();
        break;
      case "generate-env":
        await generateEnv();
        break;
      default:
        break;
    }
  } catch (ex) {
    console.error(`Error: `, ex)
  }

  process.exit()
}

const set = async() => {
  let [key, val] = argString[0].split('=')

  if (!key || !/^[A-Z0-9_]/g.test(key)) { // e.g., MY_CONFIG_VAL
    console.log(`could not detect key or key contains invalid characters`)
    usage()
    process.exit(1)
  }

  if (!val) {
    console.log(`could not detect value`)
    usage()
    process.exit(1)
  }

  let result = await ssm.putParameter({
    Name: CONFIG_PATH + key,
    Type: "String",
    Value: val,
    Overwrite: true
  }).promise()

  console.log(`config update successful\n`)
}

const unset = async() => {
  let key = argString

  if (!key || !/^[A-Z0-9_]/g.test(key)) { // e.g., MY_CONFIG_VAL
    console.log(`could not detect key or key contains invalid characters`)
    usage()
    process.exit(1)
  }

  let res = await ssm.deleteParameter({ Name: CONFIG_PATH + key }).promise()

  console.log(`\nsuccessfully deleted key ${key} with response`, res)
}

const _getList = async () => {
  let nextToken
  let results = {}

  // process.stdout.write(`fetching..`)

  do {
    // process.stdout.write(".")
    let params = await ssm.getParametersByPath({
      Path: CONFIG_PATH,
      Recursive: true,
      NextToken: nextToken
    }).promise()

    nextToken = params.NextToken

    params.Parameters.forEach(p => {
      // console.log(`p`, p, typeof p.Value )
      if ( p.Value.includes(' ') ) {
        p.Value = `"${p.Value}"`
      }
      results[p.Name.replace(CONFIG_PATH,'')] = p.Value
    })
  } while (nextToken)

  // process.stdout.clearLine()
  // process.stdout.cursorTo(0)

  return results
}

const list = async () => {
  let results = await _getList()

  let keys = Object.keys(results)
  keys.sort()

  if ( !keys.length ) {
    console.log(`no parameters found`)
  }

  keys.forEach(k => console.log(`${k}=${results[k]}`))
}

const generateEnv = async () => {
  let [ host, proj ] = argString

  // replace 01 endings to server names
  let rtrim = /[0-9]*$/
  host = host.replace(rtrim, '')
  let hostvar = host.replace(/-/g, '_').toUpperCase()

  let config = PROJECT_CONFIG[proj] || PROJECT_CONFIG[host]
  let { passthrough, map } = config

  if ( !config ) {
    throw Error(`could not find project config for host "${host}" and project "${proj}". See arb-config/project-config.js.`)
  }

  let list = await _getList()
  let hostCheck = new RegExp('^'+hostvar+'[0-9]*__')
  let projCheck = new RegExp('^'+proj.toUpperCase()+'__')
  let stx = []

  for ( let k in list ) {
    let val = list[k]

    if ( passthrough.includes(k) ) {
      stx.push(`export ${k}=${val}`)
    } else if ( map && map[k] ) {
      stx.push(`export ${map[k]}=${val}`)
    } else if ( hostCheck.test(k) ) {
      let matches = k.match(hostCheck)
      k = k.replace(matches[0], '') // strip out beginning
      stx.push(`export ${k}=${val}`)
    } else if ( projCheck.test(k) ) {
      let matches = k.match(projCheck)
      k = k.replace(matches[0], '') // strip out beginning
      stx.push(`export ${k}=${val}`)
    } else {
      // noop, ignore the config value
    }
  }

  stx.sort()
  stx.forEach(s => console.log(s))
}

run()
