/**
 * Created by highlander on 12/27/16.
 */
//dependencies
// const async = require('asyncawait/async')
// const await = require('asyncawait/await')
const when = require('when')
const log = require('@arbiter/dumb-lumberjack')()

//modules
const bip44 = require("./../modules/wallet.js");

//global
// const testnet = secret.testnet
// const arbiter = secret.arbiter
const debug = false
let account = {}

module.exports = {
    //initialize
    initialize: function () {
        return initialize_account()
    },
    //
    info: function () {
        return initialize_account()
    },
    //restore from btc pubkey

    //restore accountId from eth pubkey

    create: function () {
        return create_account()
    },


}

/*****************************************
// Primary
//*****************************************/
var initialize_account = async function () {
    var tag = " | initialize_account | "
    try{
        log.debug(tag," Setting up new master account! ")
        account = await(create_account())
        log.debug("account created : ", account)
        return account
    }catch(e){
        console.error(tag,"Error: ",e)
    }
}

const create_account = async function () {
    let tag = " | create_account | "

    try{
        let wallet = bip44.generate()
        //console.log('b44.generate()...', bip44.generate())


        return wallet
    }catch(e){
        console.error(tag," Failed to create account ERROR:",e)
    }
}
