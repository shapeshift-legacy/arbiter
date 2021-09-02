const abi = require('ethereumjs-abi')
// const util = require('ethereumjs-util')
const Web3 = require('web3')
const BN = require('bn.js')
const keccak = require('keccak')
const { ecsign } = require('ethereumjs-util')
const ARGV = require('minimist')(process.argv.slice(2))
const helpers = require('../modules/helpers');
// const bs58 = require('bs58')

// usage: $ node sign-bitgo-multisig.js --pk <privkey>

const web3 = new Web3()

// var provider = new Web3.providers.HttpProvider("http://localhost:8545")
// var contract = require("truffle-contract")



let amtInEth = 0.021

let prefix = "ETHER"
let toAddress = "0x739095a71eAADC0C2Aa5226288609114c6FC49C0"
let amount = web3.utils.toWei(amtInEth.toString(), 'ether')
let data = ''
let expireTime = Math.floor(Date.now() / 1000 + ( 3600 * 24 )) // valid for next 24 hours
let sequenceId = 2

// 0.078280327
// 0.098959963





let params = { prefix, toAddress, amount, data, expireTime }
console.log(`params`, params)

let str = [ prefix, toAddress, amount, expireTime ].join()

let opHash0 = keccak('keccak256').update(str).digest()

let opHash1 = abi.soliditySHA3(
  ['string', 'address', 'uint', 'string', 'uint', 'uint'],
  ['ETHER', new BN(toAddress.replace('0x', ''), 16), amount, data, expireTime, sequenceId]
)

// function intToBuffer(int, bufLen) {
//     let intHex = int.toString(16).padStart(bufLen * 2, "0")
//     let buf = Buffer.alloc(bufLen)
//     buf.write(intHex, 'hex')
//     return buf
// }

console.log(`opHash0`, opHash0.toString('hex'))
console.log(`opHash1`, opHash1.toString('hex'))

let privKey = Buffer.from(ARGV.pk, 'hex')
let sig = helpers.serializeSignature(ecsign(opHash1, privKey))

// let bytes = []
// for (let i = 0; i < sig.length; i += 2) {
//   bytes.push('"0x'+sig.substr(i,2)+'"')
// }

// console.log(`sig`, sig)

// let bytestr = bytes.join(",")
console.log(`"${toAddress}", ${amount}, 0, ${expireTime}, 1, [${sig}]`)


