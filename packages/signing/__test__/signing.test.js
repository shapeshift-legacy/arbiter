
/*

        Binance trade module

        Goals:
            Full audibility on trades and balances.
            buffering dust and small trade handleing


        Tests:
            Reports balances
            place limit
            report trade events

 */
//require('dotenv').config({path: '../../.env'});
require('dotenv').config();

const config = require("../config.js")

const log = require('@arbiter/dumb-lumberjack')()
//let { btc } = require('../modules/daemons-manager')

const pause = function(length){
    return new Promise(function(resolve, reject) {
        var done = function(){resolve(true)}
        setTimeout(done,length*1000)
    })
}



//Test module
const client = require("../index.js")

describe(' - Signing module - ', () => {

    let testMessage = "Bitcoin Cash is Bitcoin"

    //MAINNET
    let privKey = "<redacted>"
    let address = "1FyLxqKCvzZXUxQg3hfVZ9zDCv14q8iZnR"

    let knownSigature = "IK5FICks3K9jfUCPJ5WiZngpN6US3vIQrpy3PuO33tPVcBczYbJzrdzjQR5bQbdoMHbCrwIGKAXwWx/YfI5S3GU="

    //TESTNET
    let addressTEST = "mtC61HFzbSWp8p85LExzBmCYgni7i2XGYd"
    let privKeyTEST = "<redacted>"

    let knownSigatureTEST = "H/wthSv4UIJouHY5fM6O3/iVYA4Sa/8bLpYFyP8HoF/3QF3tSmisM+VIRlNTLJD4iIC6SZbrsnWKklA6ciJAgHc="

    test.skip('configs is required correctly', async () => {


    })

    test(' Signs valid with MAINNET keys ', async () => {
        client.init(false)
        let result = await client.sign(address,testMessage,privKey)
        log.debug("result: ",result)
        log.debug("known: ",knownSigature)
        expect(result).toEqual(knownSigature)
    })

    test(' Signs valid with TESTNET keys', async () => {
        client.init(true)
        let result = await client.sign(addressTEST,testMessage,privKeyTEST)
        log.info("result: ",result)

        log.debug("result: ",result)
        log.debug("known: ",knownSigature)
        expect(result).toEqual(knownSigatureTEST)

    })

    test(' validates signatures with MAINNET keys', async () => {
        client.init(false)



        let result = await client.validate(address, knownSigature, testMessage)
        log.info("result: ",result)
        expect(result).toEqual(true)
    })

    test(' validates signatures with TESTNET keys', async () => {

        let result = await client.validate(addressTEST, knownSigatureTEST,testMessage)
        log.info("result: ",result)
        expect(result).toEqual(true)

    })

})
