
import bip39 from 'bip39'
import HDKey from 'hdkey'
import CoinKey from 'coinkey'
import ethUtils from 'ethereumjs-util'
import bitcoinMessage from 'bitcoinjs-message'
import bitcoin from 'bitcoinjs-lib'
import { API_HOST } from '../config'
import coininfo from 'coininfo'

let IS_TESTNET = process.env.REACT_APP_IS_TESTNET
if(IS_TESTNET === 'false') IS_TESTNET = false


let onGetNewSeed = async function () {
    try {
        //this.setState({ error: null });
        let seed = await bip39.generateMnemonic()

        let success = true

        let output = {success,seed}
        return output
    } catch (error) {
        return error
    }
};


let onBuildWallet = async function (seed) {
    try {
        let testnet = IS_TESTNET
        console.log("seed: ",seed)
        console.log("seed: ",typeof(seed))
        console.log("testnet: ",testnet)
        seed = seed.trim()
        if(!seed) throw Error("empty seed")
        if(seed.length < 10 ) throw Error("bad seed seed")
        //derive account address
        let bufferSeed
        let mk

        //try to convery seed to buffer
        try{
            bufferSeed = new Buffer.from(seed, 'hex')
        }catch(e){
            console.error("unable to create buffer from seed! ",seed)
            console.error("unable to create buffer from seed! ",e)
            let seed2 = await bip39.generateMnemonic()
            bufferSeed = new Buffer.from(seed2,'hex')
        }

        try{
            if(!testnet) {
                console.log("Building mainnet keypair")
                mk = HDKey.fromMasterSeed(bufferSeed)
            } else {
                console.log("Building testnet keypair")
                mk = HDKey.fromMasterSeed(bufferSeed, coininfo('bitcoin-test').versions.bip32)
            }
        }catch(e){
            console.error("unable to create key from seed! ",seed)
            console.error("unable to create key from seed! ",e)
        }


        let path = "m"
        let childkey = mk.derive(path)

        //path Main
        let coin_type = testnet ? 1 : 0
        //let coin_type = 0
        let index = 0  // <-- modify this if you want different keys for different orders

        let pathMain = "m/44'/"+coin_type+"'/0'/0/"+index
        let childkey2 = mk.derive(pathMain)

        //FOR SIGNING we always use btc MAINnet

        let mkForSigning = HDKey.fromMasterSeed(new Buffer(seed, 'hex'))

        let childkeyForSigning = mkForSigning.derive(path)

        let keyForSigning
        if(!testnet) {
            keyForSigning = new CoinKey(childkeyForSigning.privateKey)
        } else {
            keyForSigning = new CoinKey(childkeyForSigning.privateKey, coininfo('BTC-TEST').versions)
        }

        console.log("keyForSigning: ",keyForSigning)
        //keyForSigning.versions = coininfo('BTC-TEST')


        // var key = new CoinKey(childkey.privateKey)
        // var keyM = new CoinKey(childkey2.privateKey)
        if(!testnet){
            var key = new CoinKey(childkey.privateKey)
            var keyM = new CoinKey(childkey2.privateKey)
        } else {
            var key =new CoinKey(childkey.privateKey, coininfo('BTC-TEST').versions)
            var keyM =new CoinKey(childkey2.privateKey, coininfo('BTC-TEST').versions)
        }

        var walletEth = ethUtils.bufferToHex(ethUtils.pubToAddress(key.publicKey,true))
        console.log("walletEth: ",walletEth)

        let wallet = {
            seed:seed.toString(),
            xpub:mk.publicExtendedKey,
            privkey:mk.privateExtendedKey,
            account:keyForSigning.publicAddress,
            signingPub:keyForSigning.publicAddress,
            signingPriv:keyForSigning.privateWif,
            pubkeyEth:walletEth
        }
        // localStorage.setItem('jointCustodySeed',wallet.seed)
        // localStorage.setItem('JCxpub',wallet.xpub)
        // localStorage.setItem('JCxpriv',wallet.privkey)
        // localStorage.setItem('signingAddress',wallet.signingPub)
        // localStorage.setItem('signingPriv',wallet.signingPriv)
        // localStorage.setItem('ethAddress',wallet.pubkeyEth)
        //
        // //TODO Stupid hack, Add ledger!!! un-nerf
        // localStorage.setItem('coldBTC',"mrPtLrXqhYX9Len1xjcDrUDRhCUfVa9dTb")
        // localStorage.setItem('coldLTC',"QdZp27Tkaxds3hKT7u4TgGyER45Fu6YAkV")
        // localStorage.setItem('coldETH',"0x33b35c665496bA8E71B22373843376740401F106")
        // localStorage.setItem('coldGNT',"0x33b35c665496bA8E71B22373843376740401F106")
        console.log(" | onBuildWallet | wallet: ",wallet)

        return wallet
    } catch (error) {
        return error
    }
};

export default {onBuildWallet,onGetNewSeed}