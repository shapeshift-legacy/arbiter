const Artifactor = require('truffle-artifactor');
const path = require('path');
const solc = require('solc');
const fs = require('fs');
const requireNoCache = require('require-nocache')(module);

//
// // Compile first
// const result = solc.compile(fs.readFileSync('../contracts/WalletSimple.sol', { encoding: 'utf8' }), 1);
//
// // Clean up after solidity. Only remove solidity's listener,
// // which happens to be the first.
// process.removeListener('uncaughtException', process.listeners('uncaughtException')[0]);
//
// console.log(result)
// const compiled = result.contracts[':WalletSimple']; // not sure why this is getting prepended with :
// const abi = JSON.parse(compiled.interface);
// const binary = compiled.bytecode;
//
// // Setup
const dirPath = path.resolve('./');
const expected_filepath = path.join(dirPath, 'WalletSimple.json');
//
const artifactor = new Artifactor(dirPath);


let abiInfo = require("../build/WalletSimple.abi.js")
let abi = abiInfo.ABI
let binary = abiInfo.bin
let address = abiInfo.address

artifactor.save({
    contract_name: 'WalletSimple',
    abi,
    binary,
    //network_id: 3, // Ropsten
})
    .then(function(result) {
        console.log(result)
        const json = requireNoCache(expected_filepath);
        console.log(contract(json));
    })
    .catch((error) => {
        console.log('catch error:',error);
    });