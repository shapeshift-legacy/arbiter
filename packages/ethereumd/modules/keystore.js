
/*
        Bip44 keystore wallet for ethereum


        start with seed in config

        write wallet.dat with xpriv
        write keypair to wallet.dat
        store privs in redis


 */


let debug = true
require('dotenv').config({path:"../.env"});
let TAG = " | wallet | "
const bip39 = require('bip39')
const HDKey = require('hdkey')
const coininfo = require('coininfo')
const EthereumBip44 = require('ethereum-bip44');
const { MNEMONIC, COINBASE_PUB, COINBASE_PRIV  } = require("../configs/env")
const { redis } = require('@arbiter/arb-redis')
const log = require('@arbiter/dumb-lumberjack')()

//TODO export and init on startup!

/***********************************
 // primary
 //***********************************/

var create_wallet = function () {
    var tag = TAG+" | create_account | "
    let debug = true
    try{
        let mnemonic = MNEMONIC
        if(!mnemonic) throw Error("no mnemonic detected")
        if(debug) console.log("mnemonic: ",mnemonic)
        let seed = bip39.mnemonicToSeedHex(mnemonic)

        let testnet = false
        seed = seed.toString().trim()
        seed = seed.replace(/,/gi,' ');
        if(debug) console.log("seed: ",seed)

        var mk = new HDKey.fromMasterSeed(new Buffer(seed, 'hex'), coininfo('BTC').versions.bip32)
        if(debug) console.log(mk.privateExtendedKey)


        // create the hd wallet
        var wallet = EthereumBip44.fromPrivateSeed(mk.privateExtendedKey);
        // output the first address
        // if(debug) console.log(wallet.getAddress(0));
        // // output the second address
        // if(debug) console.log(wallet.getAddress(1));

        //use coinbase in parity
        let address = COINBASE_PUB
        let privKey = COINBASE_PRIV
        let addressInfo = {}
        addressInfo.address = address
        addressInfo.eth = true
        addressInfo.path = "m/44'/60'/0'/0/"+i
        addressInfo.privKey = "0x"+privKey


        if(debug) console.log(tag,"wallet: ",wallet);
        if(debug) console.log(tag,"address: ",address);
        if(debug) console.log(tag,"addressInfo: ",addressInfo);
        redis.hmset("coinbase",addressInfo)


        //write to wallet.dat

        //save to redis
        redis.sadd("eth:wallet",address)
        redis.hmset(address,addressInfo)


        //generate 100 addresses
        for (var i = 0; i < 100; i++){

            let address = wallet.getAddress(i)
            let privKey = wallet.getPrivateKey(i)
            let addressInfo = {}
            addressInfo.address = address
            addressInfo.eth = true
            addressInfo.path = "m/44'/60'/0'/0/"+i
            addressInfo.privKey = "0x"+privKey.toString('hex')


            // if(debug) console.log(tag,"wallet: ",wallet);
            // if(debug) console.log(tag,"address: ",address);
            // if(debug) console.log(tag,"addressInfo: ",addressInfo);



            //TODO write to wallet.dat

            //save to redis
            redis.sadd("eth:wallet",address)
            redis.hmset(address,addressInfo)
        }

    } catch(e){
        console.error(tag,"ERROR:300 ",e)
        throw e;
    }
}

create_wallet()
