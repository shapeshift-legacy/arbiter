// const proxyquire = require('proxyquire')
// const rewire = require('rewire')
// const moment = require('moment')
// const log = require('@arbiter/dumb-lumberjack')()
//
// const eth = require("./../../modules/ethereum.js");
// const btc = require("./../../modules/bitcoin.js")
// const ltc = require("./../../modules/litecoin.js")
//
// let uwallet = {eth,btc,ltc}
//
// describe.skip('Ethereum Integration test', function ()
// {
//     //Does it exists
//     beforeEach('Should be an object', function ()
//     {
//
//     })
//
//     it('Client can connect', function (){
//         let success = eth.connect()
//         //TODO this should error if off
//         //stupid npm module is broke and only logs error
//         expect(success).to.be.true
//     })
//
//     it('Client is syncronized', async(function (){
//         let success = eth.connect()
//         //expect(success).to.be.true
//
//         //get block height
//         let blockHeightClient = await(eth.getBlockHeight())
//         //console.log("blockHeightClient: ",blockHeightClient)
//
//         //get block height from explorer
//
//         //if within 10 blocks, pass
//     }))
//
//     it('Client can make a new address', async(function (){
//         let address = await(eth.getNewAddress());
//         log.debug("addres",address)
//         expect(address).to.not.be.undefined;
//     }))
//
//
//     // it('Keys never repeat', function (){
//     //     let wallet = bip44.generate()
//     //     console.log(wallet)
//     //
//     //
//     //
//     // })
//     //
//     // it('Wallet generates new fields every time', function (){
//     //     let wallet = bip44.generate()
//     //     console.log(wallet)
//     //
//     //
//     //
//     // })
// })
