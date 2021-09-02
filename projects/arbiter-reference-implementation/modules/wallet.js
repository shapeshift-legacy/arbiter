/**
 * Created by highlander on 12/27/16.
 */
const log = require('@arbiter/dumb-lumberjack')()
const config = require('../configs/env')
const WalletFactory = require("./../modules/wallet-factory.js")
const fs = require('fs')
const path = require('path')
const daemons = require('./daemons-manager')
const { web3 } = require('./web3-manager')
const ledger = process.env.ALLOW_LEDGER ? require("./ledger.js") : {}
const bitcoin = require('bitcoinjs-lib') // v3.x.x
const bitcoinMessage = require('bitcoinjs-message')
const pause = require('./pause')

/*
 This serves as the primary wallet, which is the interface to arbiter.
 All signing done on behalf of a user's account in the reference-implementation
 is done here, NOT via the coin daemons. Daemons are used for sending money
 and watching the blockchain, NOT for verifying messages.
*/

if ( config.USER_BTC_SIGNING_ADDRESS || config.USER_BTC_SIGNING_PRIVKEY ) {
  throw Error(`found USER_BTC_SIGNING_ADDRESS and/or USER_BTC_SIGNING_PRIVKEY in config, these are obsolete. Please unset to remove confusion moving forward`)
}

class WalletSingleton {
  constructor() {
    this._network = config.TEST_NET ? 'bitcoin-test' : 'bitcoin'

    let name = config.TEST_NET ? 'TESTNET' : 'MAINNET'
    this._path = path.join(__dirname, `../${name}_TEST_WALLET.json`)
  }

  async init() {
    if ( this._wallet ) return this._wallet

    this._initializing = true

    if ( fs.existsSync(this._path) ) {
      log.debug(`found config at ${this._path}`)
      let raw = fs.readFileSync(this._path)
      this._wallet = JSON.parse(raw)
    } else {
      log.debug(`could not find test wallet, generating`)

      let wallet = WalletFactory.generate(this._network)

      wallet.addresses = {}

      log.debug(`wallet`, wallet, daemons)

      let coins = Object.keys(daemons)

      for (let coin of coins) {
        log.debug(`coin`, coin)
        try {
          if ( coin !== 'eth' ) {
            /*
             Use daemon addresses for wallets
            */
            log.debug(`generating address for `, coin)
            wallet.addresses[coin] = await daemons[coin].getNewAddress()
          } else {
            log.debug(`not generating addresses for ${coin}`)
          }
        } catch (ex) {
          log.warn(`could not get address for ${coin}: `, ex)
        }
      }

      /*
       Specifically for ETH, we save the PKs locally cuz cloud cointainers
      */
      log.debug(`generating address for eth`)
      let ethAccount = await web3.eth.accounts.create()
      wallet.eth = ethAccount

      this._wallet = wallet
      this.save()
      this._initializing = false
    }

    log.debug(`master WALLET initialized`, this._wallet)

    return this._wallet
  }

  save() {
    let wres = fs.writeFileSync(this._path, JSON.stringify(this._wallet, false, ' '))
    log.debug(`successfully wrote wallet config to ${this._path}`, wres)
  }

  setTradingAddress(coin, address) {
    log.debug(`setting trading address for ${coin} to ${address}`)
    this._wallet.trading = this._wallet.trading || {}

    this._wallet.trading[coin.toLowerCase()] = address
    this.save()
  }

  async info() {
    if ( this._wallet ) {
      return this._wallet
    } else if ( this._initializing ) {
      return new Promise(async (resolve, reject) => {
        let to = setTimeout(() => {
          reject('failed to initialize wallet after 5000ms')
        }, 5000)

        while ( this._initializing ) {
          await pause(0.2)
        }

        clearTimeout(to)

        resolve(this._wallet)
      })
    } else {
      return this.init()
    }
  }

  async sign(address, msg, pk) {
    let tag = " | sign_message | "

    try {
      log.debug(tag, "msg: ", msg)

      if (pk === 'ledger') {
        let signature = await ledger.sign(msg)

        return signature.body
      } else {
        let network = this._network === "bitcoin" ? bitcoin.networks.bitcoin : bitcoin.networks.testnet
        let privkey = pk || this._wallet.signingPriv
        let keyPair = bitcoin.ECPair.fromWIF(privkey, network)
        let privateKey = keyPair.d.toBuffer(32)
        let signature = bitcoinMessage.sign(msg, privateKey, keyPair.compressed).toString('base64')
        log.debug(tag, 'signature', signature)
        return signature
      }
    } catch (e) {
      log.error(tag, "Error: ", e)
      throw "ERROR:100 Unable to sign"
    }
  }

  async signTx(coin, tx) {
    if ( coin.toLowerCase() !== 'eth' ) {
      throw Error('signTx only supported for eth so far')
    }

    if ( tx.from !== this._wallet.eth.address ) {
      throw Error(`cannot sign with unknown address ${tx.from}`)
    }

    return web3.eth.accounts.signTransaction(tx, this._wallet.eth.privateKey)
  }

  getTradingAddress(coin) {
    if ( !this._wallet.trading || !this._wallet.trading[coin.toLowerCase()] ) {
      throw Error(`No trading address specified for ${coin}. Use the 'setup' command to set the addresses you'd like to use for each coin.`)
    }

    return this._wallet.trading[coin.toLowerCase()]
  }

  verifyMessage(address,sig,msg) {
    return bitcoinMessage.verify(msg, address, sig)
  }
}


let wallet = new WalletSingleton()
wallet.init().catch(ex => {
  log.error(`error initializing wallet`, ex)
  throw ex
})

module.exports = wallet
