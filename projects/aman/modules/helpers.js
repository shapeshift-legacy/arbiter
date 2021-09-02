const abi = require('ethereumjs-abi');
const util = require('ethereumjs-util');
const log = require('@arbiter/dumb-lumberjack')();
const BN = require('bn.js'); // ints
const BigNumber = require('bignumber.js'); // floats o_0
const Promise = require('bluebird');
const { web3 } = require('./web3-manager')
const { GAS_PRICE_BUFFER_GWEI } = require('../configs/env')


exports.showBalances = async function() {
  const accounts = await web3.eth.getAccounts()
  for (let i=0; i<accounts.length; i++) {
    let balance = await web3.eth.getBalance(accounts[i])
    let balanceInEth = web3.fromWei(balance, 'ether')
    // console.log(accounts[i] + ': ' + balanceInEth, 'ether');
  }
};

// Polls an array for changes
exports.waitForEvents = function(eventsArray, numEvents) {
  if (numEvents === 0) {
    return Promise.delay(1000); // Wait a reasonable amount so the caller can know no events fired
  }
  numEvents = numEvents || 1;
  const oldLength = eventsArray.length;
  let numTries = 0;
  const pollForEvents = function() {
    numTries++;
    if (eventsArray.length >= (oldLength + numEvents)) {
      return;
    }
    if (numTries >= 100) {
      if (eventsArray.length == 0) {
        console.log('Timed out waiting for events!');
      }
      return;
    }
    return Promise.delay(50)
    .then(pollForEvents);
  };
  return pollForEvents();
};

// Helper to get sha3 for solidity tightly-packed arguments
exports.getSha3ForConfirmationTx = function(toAddress, amount, data, expireTime, sequenceId) {
  let _toAddr = new BN(toAddress.replace('0x', ''), 16)
  let _amt = web3.utils.toWei(amount.toString(), 'ether')
  let _data = data.replace('0x', '')

  return abi.soliditySHA3(
    ['string', 'address', 'uint', 'string', 'uint', 'uint'],
    ['ETHER', _toAddr, _amt, _data, expireTime, sequenceId]
  );
};

// Helper to get token transactions sha3 for solidity tightly-packed arguments
exports.getSha3ForConfirmationTokenTx = function(toAddress, value, tokenContractAddress, expireTime, sequenceId) {
  let _toAddr = new BN(toAddress.replace('0x', ''), 16)
  let _tokenContractAddr = new BN(tokenContractAddress.replace('0x', ''), 16)

  return abi.soliditySHA3(
    ['string', 'address', 'uint', 'address', 'uint', 'uint'],
    ['ERC20', _toAddr, value, _tokenContractAddr, expireTime, sequenceId]
  );
};

// Serialize signature into format understood by our recoverAddress function
exports.serializeSignature = ({ r, s, v }) =>
  '0x' + Buffer.concat([r, s, Buffer.from([v])]).toString('hex');

/**
 * Returns the address a contract will have when created from the provided address
 * @param address
 * @return address
 */
exports.getNextContractAddress = (address) => {
  const nonce = web3.eth.getTransactionCount(address, "pending");
  return util.bufferToHex(util.generateAddress(address, nonce));
}

const _isReceiptSuccessful = receipt => {
  return receipt.status === "0x1" || receipt.status === 1 || receipt.status === true
}

exports.isReceiptSuccessful = _isReceiptSuccessful

const _getGasPrice = async (opts) => {
  if ( opts && opts.gasPrice ) return opts.gasPrice

  let suggestedGasPrice = await web3.eth.getGasPrice()
  log.debug(`gas price from node`, suggestedGasPrice, GAS_PRICE_BUFFER_GWEI)
  let suggGwei = web3.utils.fromWei(suggestedGasPrice, 'gwei')
  let suggGweiBN = new BigNumber(suggGwei)
  let gasPrice = suggGweiBN.plus(GAS_PRICE_BUFFER_GWEI)
  log.debug(`calculated gas price`, gasPrice.toString(), suggGweiBN.toString())

  return web3.utils.toWei(gasPrice.toString(), "gwei")
}

exports.getGasPrice = _getGasPrice
