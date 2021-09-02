
/*
        Bip44 keystore wallet for ethereum


        start with seed in config

        write wallet.dat with xpriv
        write keypair to wallet.dat
        store privs in redis


 */


const TAG = " | keystore | "
const bip39 = require('bip39')
const HDKey = require('hdkey')
const coininfo = require('coininfo')
const log = require('@arbiter/dumb-lumberjack')()
const EthereumBip44 = require('ethereum-bip44')
const { MNEMONIC } = require("../configs/env")
const { redis } = require('./redis-manager')
const { encrypt } = require('./crypt')


/***********************************
 // primary
 //***********************************/


const create_wallet = async function () {
    var tag = TAG+" | create_account | "
    try {
        let mnemonic = MNEMONIC
        if(!mnemonic) throw Error("no mnemonic detected")
        let seed = bip39.mnemonicToSeedHex(mnemonic)

        seed = seed.toString().trim()
        seed = seed.replace(/,/gi,' ');

        var mk = new HDKey.fromMasterSeed(new Buffer(seed, 'hex'), coininfo('BTC').versions.bip32)

        // create the hd wallet
        var wallet = EthereumBip44.fromPrivateSeed(mk.privateExtendedKey);

        //generate 100 addresses
        for (var i = 0; i < 100; i++) {
            let address = wallet.getAddress(i).toLowerCase()
            let privKey = wallet.getPrivateKey(i)

            let addressInfo = {
              address,
              eth: true,
              path: "m/44'/60'/0'/0/"+i,
              privKey: encrypt(privKey.toString('hex'))
            }

            log.info(tag,"address: ",address);
            log.info(tag,"addressInfo: ",addressInfo);

            //save to redis
            redis.sadd("eth:wallet",address)
            redis.sadd("eth:wallet:ready",address)
            redis.hmset(address,addressInfo)
        }

    } catch(e){
        log.error(tag,"ERROR:300 ",e)
        throw e;
    }
}

create_wallet()
