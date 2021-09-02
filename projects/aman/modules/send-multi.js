const abi = require('ethereumjs-abi')
// const util = require('ethereumjs-util')
const { web3 } = require('./web3-manager')
const BN = require('bn.js')
const keccak = require('keccak')
const { ecsign } = require('ethereumjs-util')
const ARGV = require('minimist')(process.argv.slice(2))
// const bs58 = require('bs58')
// usage: $ node sign-bitgo-multisig.js --pk <privkey>
// var provider = new Web3.providers.HttpProvider("http://localhost:8545")
// var contract = require("truffle-contract")
let amtInEth = 0.00000001
let prefix = "ETHER"
let toAddress = "0x30b9fE24fA7B1D0Dbd7d205A4D560BF624bfCa15"
let amount = web3.utils.toWei(amtInEth, 'ether')
let data = ''
let expireTime = Math.floor(Date.now() / 1000 + ( 3600 * 24 )) // valid for next 24 hours
let sequenceId = 1
let params = { prefix, toAddress, amount, data, expireTime }
console.log(`params`, params)
let str = [ prefix, toAddress, amount, expireTime ].join()
let opHash0 = keccak('keccak256').update(str).digest()
let opHash1 = abi.soliditySHA3(
    ['string', 'address', 'uint', 'string', 'uint', 'uint'],
    ['ETHER', new BN(toAddress.replace('0x', ''), 16), amount, data, expireTime, sequenceId]
)
function intToBuffer(int, bufLen) {
    let intHex = int.toString(16).padStart(bufLen * 2, "0")
    let buf = Buffer.alloc(bufLen)
    buf.write(intHex, 'hex')
    return buf
}
console.log(`opHash0`, opHash0.toString('hex'))
console.log(`opHash1`, opHash1.toString('hex'))
let privKey = Buffer.from(ARGV.pk, 'hex')
let { r, s, v } = ecsign(opHash1, privKey)
v = Buffer.from([v])
let sig = Buffer.concat([r,s,v]).toString('hex')
let bytes = []
for (let i = 0; i < sig.length; i += 2) {
    bytes.push('"0x'+sig.substr(i,2)+'"')
}
console.log(`sig`, sig)
let bytestr = bytes.join(",")
console.log(`"${toAddress}", ${amount}, 0, ${expireTime}, 1, [${bytestr}]`)