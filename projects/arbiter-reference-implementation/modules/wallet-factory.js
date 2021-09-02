/**
 * Created by highlander on 12/27/16.
 */

let TAG = " | wallet | "
const HDKey = require('hdkey')
const CoinKey = require('coinkey')
const coininfo = require('coininfo')
const bip39 = require('bip39')
const ethUtils = require('ethereumjs-util');
const log = require('@arbiter/dumb-lumberjack')()


module.exports = {
    //generate wallet
    generate: function (network) {
        //log.debug("TWO")
        return create_wallet(network)
    },
    //derive Bip44 master subKey
    customerPubKey: function () {
        return derive_44_pubkey()
    }

    //Backup

    //restore from seed

}

let create_wallet = function (network) {
    let tag = TAG+" | create_account | "
    try{
        let mnemonic = bip39.generateMnemonic()
        let seed = bip39.mnemonicToSeedHex(mnemonic)
        let mk = new HDKey.fromMasterSeed(new Buffer(seed, 'hex'), coininfo(network).versions.bip32)

        //let path = "m/1'/0"
        let path = "m"
        // let childkey = mk.derive(path)

        //FOR SIGNING we always use btc MAINnet
        let mkForSigning = new HDKey.fromMasterSeed(new Buffer(seed, 'hex'), coininfo(network).versions.bip32.versions)

        let childkeyForSigning = mkForSigning.derive(path)
        log.debug(tag,"childkeyForSigning: ",childkeyForSigning)

        let keyForSigning = new CoinKey(childkeyForSigning.privateKey,coininfo(network).versions)
        // let key = new CoinKey(childkey.privateKey, coininfo(network).versions)

        //make eth key
        // var walletEth = ethUtils.bufferToHex(ethUtils.pubToAddress(key.publicKey,true));

        //TODO SAVEME
        let wallet = {
            seed:seed.toString(),
            xpub:mk.publicExtendedKey,
            xpriv:mk.privateExtendedKey,
            address:keyForSigning.publicAddress,
            pubkey:keyForSigning.publicKey.toString('hex'),
            signingPub:keyForSigning.publicAddress,
            signingPriv:keyForSigning.privateWif
            // pubkeyEth:walletEth
        }

        return wallet
    } catch(e){
        log.error(tag,"ERROR:300 ",e)
        throw e;
    }
}
