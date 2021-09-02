

const { web3 } = require('../modules/web3-manager')
const Forwarder = require('../build/contracts/Forwarder.json')
const ProxyFactory = require('../build/contracts/ProxyFactory.json')
const Logger = require('../build/contracts/Logger.json')
const WalletSimple = require('../build/contracts/WalletSimple.json')
const WalletFactory = require('../build/contracts/WalletFactory.json')
const { GAS_PRICE_GWEI } = require('../configs/env')
const helpers = require('./helpers')
const log = require('@arbiter/dumb-lumberjack')()
const Contract = require('./contract')
const sender = require('./sender')
const { getMasterAddress } = require('../modules/address-manager')
const softUnlock = require('../modules/soft-unlock')

function _deploy(contract, name, args) {
  log.debug(`deploying ${name}...`)
  return new Promise(async (resolve, reject) => {
    let dep = contract.deploy({ arguments: args })
    let master = await getMasterAddress()

    let txObj = {
      gas: 5000000,
      data: dep.encodeABI(),
      from: master,
      to: undefined,
      value: 0
    }

    let receipt = await sender.signAndSend(txObj, 'success', dep)
    log.debug(`deployment complete for ${name}...`, receipt)
    resolve(receipt.contractAddress)
  })
}

function _contract(abi, bytecode, from) {
  return new web3.eth.Contract(abi, undefined, {
    from: from,
    gasPrice: web3.utils.toWei(GAS_PRICE_GWEI.toString(), 'gwei'),
    data: bytecode
  })
}

async function _authorizeWalletFactory(master, wfAddress, loggerAddress) {
  // authorize the factory
  let myLogger = new Contract({ abi: Logger.abi, address: loggerAddress })

  log.debug('adding wallet factory as logger authorizer')

  let receipt = await myLogger.addAuthorizer(wfAddress).sendResolvesOnReceipt({ gas: 300000 })
  log.debug(`authorize logger receipt`, receipt)

  return new Promise((resolve, reject) => {
    myLogger.contract.methods.authorizers(wfAddress).call().then(res => {
      if ( res ) {
        log.debug(`wallet factory is authorized result:`, res)
        resolve()
      } else {
        reject('wallet factory is not authorized!')
      }
    }).catch(reject)
  })
}

async function deploy(oracleAddress) {
  let master = await getMasterAddress()

  let forwarder = _contract(Forwarder.abi, Forwarder.bytecode, master)
  let proxyFactory = _contract(ProxyFactory.abi, ProxyFactory.bytecode, master)
  let logger = _contract(Logger.abi, Logger.bytecode, master)
  let walletSimple = _contract(WalletSimple.abi, WalletSimple.bytecode, master)
  let walletFactory = _contract(WalletFactory.abi, WalletFactory.bytecode, master)

  log.notice(`starting deployments...\n`)

  await softUnlock(master)
  let faddr = await _deploy(forwarder, "forwarder")
  await softUnlock(master)
  let pfaddr = await _deploy(proxyFactory, "proxy factory")
  await softUnlock(master)
  let laddr = await _deploy(logger, "logger")
  await softUnlock(master)
  let waddr = await _deploy(walletSimple, "wallet")
  await softUnlock(master)
  let wfaddr = await _deploy(walletFactory, "wallet factory", [
    pfaddr, waddr, faddr, laddr, oracleAddress, master
  ])

  await _authorizeWalletFactory(master, wfaddr, laddr)

  return {
    logger: laddr,
    proxyFactory: pfaddr,
    forwarder: faddr,
    wallet: waddr,
    walletFactory: wfaddr
  }
}

module.exports = deploy
