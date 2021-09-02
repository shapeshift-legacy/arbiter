/**
 * Created by highlander on 3/1/17.
 */
/**
 * Created by highlander on 12/28/16.
 */
/**
 * Created by highlander on 12/27/16.
 */
/**
 * Created by highlander on 12/15/16.
 */

//const proxyquire = require('proxyquire')
//const rewire = require('rewire')
//const moment = require('moment')

let uwallet = {}
const SlackBot = require('slackbots');
const config = require("../../config/env")
const local_coin_client = require('bitcoin-promise');
const _ = require('underscore');

//
const slack = require("./../../utils/slack.js")

// const Secrets = require('./../secrets.js');
// const secret = new Secrets();
const whitelist = config.whitelist
//uwallet.btc = new local_coin_client.Client(config.daemons.BTC.daemon)
//uwallet.ltc = new local_coin_client.Client(config.daemons.LTC.daemon)
//uwallet.btc = require("./../../modules/bitcoinOLD.js")
//uwallet.ltc = require("./../../modules/litecoin.js")
//uwallet.eth = require("./../../modules/ethereumOLD.js");
//uwallet.etc = require("./../../modules/ethereumClassic.js");

//ME REST api
let me = require("./../../utils/uwallet.js")

let debug = true
let slackPublish = true
let TAG = " | Coins - Test | "
/*
    Coin testing (Bitcoin formatting RPC compatibility tests)
 */


describe.skip('Coin Integration test', function ()
{
    let tag = TAG+" | RPC |"
    //slack.jsonView({tag,status:"is Online!"})
    var params = {
        icon_emoji: ':shapeshift:',
    };

    //Does it exist
    // beforeEach('Should be an object', function ()
    // {
    //
    // })
    /*
        TODO: For each coin in uwallet
     */
    //test all local rpc's

    //test all remote servers
    var servers = config.servers
    if(debug) console.log(tag,"servers: ",servers)

    let skip = [
        // 'lsk',
        // 'xmr',
        // 'nmc',
        // 'vox',
        // 'sc',
        // 'steem',
        // 'sbd',
        // 'lbc'
    ]

    let onlineCoins = []
    let offlineCoins = []

    Object.keys(servers).forEach(function(coin) {
        if(servers[coin].length > 5 && coin != "sentinel"){
            describe(coin+' Integration test', function ()
            {
                if(debug) console.log("Starting tests for coin: "+coin)
                it(coin+' has getInfo and signifies testnet',async function (){
                    this.timeout(40*1000)
                    let nodeInfo = await me.rpc(coin,"getInfo")

                    if(nodeInfo.error){
                        console.error(tag,"** Error: ",nodeInfo)
                        if(slackPublish) slack.jsonView(nodeInfo,":"+coin+": :fireball: "+coin+" is offline (timeout) Firewall is misconfigured!!! ")
                        offlineCoins.push(coin)
                    } else {
                        let publish = {}
                        onlineCoins.push(coin)
                        nodeInfo = JSON.parse(nodeInfo.payload)
                        publish.blocks = nodeInfo.blocks
                        publish.testnet = nodeInfo.testnet
                        publish.connections = nodeInfo.connections

                        if(slackPublish && nodeInfo) slack.jsonView(publish,":"+coin.toLowerCase()+": :success: Middle Earth "+coin+" test")
                        if(debug) console.log("nodeInfo:", nodeInfo)

                        //TODO
                        //expect(nodeInfo.testnet).to.be.false
                        //expect(nodeInfo.success).to.equal(true)
                        //expect(nodeInfo).to.not.be.undefined
                        //Versioning
                        //expect connections to be greater then 1
                    }
                        //final report
                        let report = {}

                        report.onlineCoins = _.uniq(onlineCoins)
                        report.offlineCoins = _.uniq(offlineCoins)
                        if(debug) console.log(tag," report: ",report)
                        if(debug) console.log(tag," report: ",report)
                        if(debug) console.log(tag," report: ",report)
                        if(slackPublish) slack.jsonView(report,"Final report:")
                })



                it.skip(coin+' is syncronized', async function (){
                    this.timeout(40*1000)
                    let timeout = setTimeout(function (err) {
                        try {
                            console.error(coin+" is offline!")
                        } catch (e) {
                            done(e);
                        }
                        done();
                    }, 20000);
                    //TODO use block explorers
                    //get block height
                    let blockHeightClient = await me.rpc(coin,"getBlockHeight")
                    clearTimeout(timeout)
                    //console.log("blockHeightClient: ",blockHeightClient)
                    expect(blockHeightClient.success).to.equal(true)
                    expect(blockHeightClient).not.be.undefined
                    //get block height from explorer
                    //if  ~10 blocks, pass
                })

                /*
                 getNewAddress:
                 Needed for administration and non multi-sig transactions.
                 */

                it(coin+' can make a new address', async function (){
                    this.timeout(40*1000)
                    setTimeout(function (err) {
                        try {
                            console.error(coin+" is offline!")
                        } catch (e) {
                            done(e);
                        }
                        done();
                    }, 20000);
                    let address = await me.rpc(coin,"getNewAddress")
                    expect(address.success).to.equal(true)
                    expect(address).not.be.undefined

                    // //console.log(address)
                    // //make 100 adresses
                    // let testIntervial = 2
                    // //make sure they never repeat!
                    // let addresses = []
                    // for (let i = 0; i < testIntervial; i++) {
                    //     addresses.push(await me.rpc(coin,"getNewAddress"))
                    // }
                    // //console.log("addresses: ",addresses)
                    //
                    // expect(addresses).to.not.be.undefined;
                    // expect(addresses.length).to.be.equal(testIntervial);
                    // //expect to be eqnique
                })

                /*
                 getBlockCount:
                 Get block height.
                 */

                it(coin+' has blocks', async function (){
                    this.timeout(40*1000)
                    setTimeout(function (err) {
                        try {
                            console.error(coin+" is offline!")
                        } catch (e) {
                            done(e);
                        }
                        done();
                    }, 20000);
                    let blockcount = await me.rpc(coin,"getBlockCount")
                    expect(blockcount.success).to.equal(true)
                    expect(blockcount.payload).be.greaterThan(0)


                })

                /*
                    Auto-Balance
                    Refuses to send to non whitelisted address
                 */
                it.skip(coin+' Enforces whitelist', async function (){
                    this.timeout(40*1000)
                    setTimeout(function (err) {
                        try {
                            console.error(coin+" is offline!")
                        } catch (e) {
                            done(e);
                        }
                        done();
                    }, 20000);
                    let address = "1DeQvRzXcipwkLjcFxvTLY9ehb98qYMHbL"
                    let amount = "0.01"
                    let txid = await me.rpc(coin,"sendToAddress",address,amount)
                    expect(blockcount.success).to.equal(true)
                    expect(blockcount.payload).be.greaterThan(0)


                })


                /*
                    Auto-Balance
                    Succedes to send from hot
                 */
                /*
                 Auto-Balance
                 Refuses to send to non whitelisted address
                 */
                it.skip(coin+' Enforces whitelist', async function (){
                    this.timeout(40*1000)
                    setTimeout(function (err) {
                        try {
                            console.error(coin+" is offline!")
                        } catch (e) {
                            done(e);
                        }
                        done();
                    }, 20000);
                    let destinations = whitelist

                    //pick a random destination
                    let destination = Object.keys(destinations)[0]
                    let address = whitelist[coin][destination].address

                    let amount = 0.001
                    if(coin != "btc") amount = 0.01

                    let txid = await me.rpc(coin,"sendToAddress",address,amount)
                    expect(blockcount.success).to.equal(true)
                    expect(blockcount.payload).be.greaterThan(0)


                })



                /*
                 TODO validateAddress:
                 Get block height.
                 */
                it.skip(coin+' has blocks', async function (){
                    this.timeout(40*1000)
                    setTimeout(function (err) {
                        try {
                            console.error(coin+" is offline!")
                        } catch (e) {
                            done(e);
                        }
                        done();
                    }, 20000);
                    let blockcount = await me.rpc(coin,"validateAddress",[address])

                    //validate a invalid address as false

                    //validate a valid an true

                    //recondsises isMine

                })

                /*
                 TODO getTransaction:
                 Get block height.
                 */
                it.skip(coin+' can get transactions', async function (){
                    this.timeout(40*1000)
                    setTimeout(function (err) {
                        try {
                            console.error(coin+" is offline!")
                        } catch (e) {
                            done(e);
                        }
                        done();
                    }, 20000);
                    let blockcount = await me.rpc(coin,"getTransaction",[tx])

                    //can get transactions

                })

                /*
                 TODO get hash:
                    Get hash from height.
                 */
                it.skip(coin+' can get transactions', async function (){
                    this.timeout(40*1000)
                    setTimeout(function (err) {
                        try {
                            console.error(coin+" is offline!")
                        } catch (e) {
                            done(e);
                        }
                        done();
                    }, 20000);
                    let blockcount = await me.rpc(coin,"getBlockCount")
                    let blockHash = await me.rpc(coin,"getBlockHash",[blockcount])


                })

                /*
                 TODO listSinceBlock:
                       Search for payments between blocks.
                 */
                it.skip(coin+' can get transactions', async function (){
                    this.timeout(40*1000)
                    setTimeout(function (err) {
                        try {
                            console.error(coin+" is offline!")
                        } catch (e) {
                            done(e);
                        }
                        done();
                    }, 20000);
                    let blockcount = await me.rpc(coin,"getBlockCount")
                    blockcount = blockcount - 1000
                    let blockHash = await me.rpc(coin,"getBlockHash",[blockcount])

                    let txs = await me.rpc(coin,"listSinceBlock",[blockHash])

                    //expect txs to not be empty
                    //expect hash to be latest

                    //TODO tx has needed params
                    //address
                    //amount
                    //confirms
                    //bla bla bla
                })
            })
        } else {
            if(debug) console.log(tag," skipping: ",coin)
        }


    })


    it(' can build a final report',async function (){
        if(debug) console.log(tag," ***************** BLA report: Y U NO Hit")

        //final report
        let report = {}
        report.onlineCoins = onlineCoins
        report.offlineCoins = offlineCoins
        if(debug) console.log(tag," report: ",report)
        if(slackPublish) slack.jsonView(report,"Final report:")
    })


})
