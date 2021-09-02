// /**
//  * Created by highlander on 12/28/16.
//  */
//
//
// const proxyquire = require('proxyquire')
// const rewire = require('rewire')
// const moment = require('moment')
// const account = rewire('../../modules/wallet.js')
//
// describe.skip('HD wallet Generation', function ()
// {
//     //Does it exists
//     beforeEach('Should be an object', function ()
//     {
//         //rewire redis
//         account.__set__('redis', redis)
//
//         //turn on debug
//         account.__set__('debug', true)
//
//         let  fakeConsole = {}
//         fakeConsole.error = function(err){}
//         fakeConsole.log = function(err){}
//         account.__set__('console', fakeConsole)
//
//
//         expect(account).to.be.an('object')
//     })
//     after(async(function ()
//     {
//         await(redis.flushdb())
//     }))
//
//     it('Can generate new Account', async(function (){
//         let accountNew = await(account.create())
//         //console.log(accountNew)
//
//         //not empty
//         expect(accountNew.account).to.not.be.undefined
//         expect(accountNew.seed).to.not.be.undefined
//         expect(accountNew.pubkey).to.not.be.undefined
//         expect(accountNew.privkey).to.not.be.undefined
//         expect(accountNew.signingPub).to.not.be.undefined
//         expect(accountNew.signingPriv).to.not.be.undefined
//         expect(accountNew.pubkeyEth).to.not.be.undefined
//     }))
//
//     it('Saves Master Account in redis', function (){
//
//
//
//     })
//
//     it('Generates New account if one not found', async(function (){
//         await(account.initialize())
//
//         //valid account should be in redis
//         let accountMaster = await(redis.get("accountMaster"))
//         accountMaster = JSON.parse(accountMaster)
//
//         expect(accountMaster.account).to.not.be.undefined
//         expect(accountMaster.seed).to.not.be.undefined
//         expect(accountMaster.pubkey).to.not.be.undefined
//         expect(accountMaster.privkey).to.not.be.undefined
//         expect(accountMaster.signingPub).to.not.be.undefined
//         expect(accountMaster.signingPriv).to.not.be.undefined
//         expect(accountMaster.pubkeyEth).to.not.be.undefined
//     }))
//
//     it('Can Restore account from seed', function (){
//
//
//
//
//     })
// })
