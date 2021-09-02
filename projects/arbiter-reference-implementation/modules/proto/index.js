var _ = require('lodash');
var Big = require('bignumber.js');


var ProtoBuf = require("protobufjs"),
  ByteBuffer = ProtoBuf.ByteBuffer,                    // ProtoBuf.js uses and also exposes ByteBuffer.js
  Long = ProtoBuf.Long;                                // as well as Long.js (not used in this example)

var ResponseFactory = require('./exchange.js');

function _protoify(val, signMessage) {
  var success = val.success;

  var currencies = success.pair.split('_');
  var sourceCoin = currencies[0];
  var destCoin = currencies[1];

  var response = new ResponseFactory.ExchangeResponse();
  response.setDepositAddress(exchangeAddressFactory(success.deposit, sourceCoin));
  response.setDepositAmount(amount2Buffer(success.depositAmount, sourceCoin));
  response.setExpiration(success.expiration);
  response.setQuotedRate(amount2Buffer(success.quotedRate, destCoin));
  response.setWithdrawalAddress(exchangeAddressFactory(success.withdrawal, destCoin));
  response.setWithdrawalAmount(amount2Buffer(success.withdrawalAmount, destCoin));
  response.setReturnAddress(exchangeAddressFactory(success.returnAddress, sourceCoin));
  response.setApiKey(ByteBuffer.fromHex(success.apiPubKey));
  response.setMinerFee(amount2Buffer(success.minerFee, destCoin));
  response.setOrderId(bufferFromGuid(success.orderId));

  var signedResponse = new ResponseFactory.SignedExchangeResponse();
  signedResponse.setResponse(response);
  //signedResponse.setSignature(sign(signMessage, response));

  return signedResponse
    .encode()
    .toBuffer();
}

// Is this always 8?
const CURRENCY_DECIMALS = {
  btc:  8,
  ltc:  8,
  doge: 8,
  eth: 18
  /* others need to be added here too */
};

function sign(messageSigner, response) {
  return ByteBuffer
    .fromBase64(messageSigner(response.encode().toBuffer()))
    .toBuffer();
}

function amount2Buffer(amount, currency) {
  var big = new Big(amount).shift(CURRENCY_DECIMALS[currency] || 8);
  if (big.eq(0)) {
    return ByteBuffer.fromHex('');
  } else {
    var hex = big.toString(16);
    if (hex.length % 2) {
      hex = '0' + hex;
    }
    return ByteBuffer.fromHex(hex);
  }
}

function bufferFromGuid(val) {
  var value = val;
  return ByteBuffer.fromHex(value.replace(/-/g, ''));
}

function exchangeAddressFactory(addressStr, currency) {
  var address = new ResponseFactory.ExchangeAddress();
  address.setCoinType(currency);
  address.setAddress(addressStr);

  return address;
}

function bufferToHex(key, value) {
  if (value && value.buffer) {
    if (value.buffer instanceof Buffer) {
      return value.toHex();
    }
    var hexstring = '';
    if (value.limit > 1000) {
      return '<long buffer suppressed>';
    }
    for (var i = value.offset; i < value.limit; i++) {
      if (value.view[i] < 16) {
        hexstring += 0;
      }
      hexstring += value.view[i].toString(16);
    }
    return hexstring;
  }
  else if (value && !_.isUndefined(value.low) && !_.isUndefined(value.high) && !_.isUndefined(value.unsigned)) {
    return (new Long(value.low, value.high, value.unsigned)).toString();
  }
  return value;
}

function _jsonify(value, checkSig) {
  var pbMessage = ResponseFactory.SignedExchangeResponse.decode(
  ByteBuffer.wrap(value));
  //var signature = pbMessage.getSignature().toBase64();

  // if (!checkSig(pbMessage.getResponse().encode().toBuffer(), signature)) {
  //   throw 'signature invalid';
  // }
  return JSON.parse(JSON.stringify(pbMessage, bufferToHex, 0));
}

module.exports = _protoify;
module.exports.parse = _jsonify;
