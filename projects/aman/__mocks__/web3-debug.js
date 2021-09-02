const Web3 = require('web3')

let Web3Mock = function() {
  this.eth = {
    Contract: function() {}
  }

  this.utils = Web3.utils // actually use these, for now...
}

Web3Mock.providers = {
  HttpProvider: function() {},
  WebsocketProvider: function() {}
}

Web3Mock.prototype.setProvider = () => {}

module.exports = Web3Mock
