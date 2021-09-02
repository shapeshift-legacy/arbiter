
const log = require('@arbiter/dumb-lumberjack')()
const deploy = require('../modules/deploy')

// deploying the contracts requires an oracle address to be set
if ( !process.env['ORACLE_ADDRESS'] ) {
  console.log(`No oracle address specified`)
  console.log(`  Usage: 'ORACLE_ADDRESS=0xabcdef node tools/deploy-prerequisites.js'`)
  process.exit(1)
}

const ORACLE_ADDRESS = process.env['ORACLE_ADDRESS']

async function go() {
  try {
    let results = await deploy(ORACLE_ADDRESS)

    console.log(`\nexport LOGGER_ADDRESS="${results.logger}"`) // contains the new contract address
    console.log(`export PROXY_FACTORY_ADDRESS="${results.proxyFactory}"`) // contains the new contract address
    console.log(`export FORWARDER_ADDRESS="${results.forwarder}"`) // contains the new contract address
    console.log(`export WALLET_ADDRESS="${results.wallet}"`) // contains the new contract address
    console.log(`export WALLET_FACTORY_ADDRESS="${results.walletFactory}"\n`) // contains the new contract address

    log.notice(`take these lines and place them in the relevant .env config`)
  } catch (ex) {
    log.error(ex)
  }
}

go()
