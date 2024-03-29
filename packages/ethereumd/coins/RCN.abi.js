module.exports = {
    metaData: {
        contractAddress: "0xf970b8e36e23f7fc3fd752eea86f8be8d83375a6",
        BASE: 1000000000000000000,
        accountsList: "RCN_accounts",
        from: "_from",
        to: "_to",
        value: "_value"
    },
    ABI: [{
        "constant": true,
        "inputs": [],
        "name": "mintingFinished",
        "outputs": [{"name": "", "type": "bool"}],
        "payable": false,
        "type": "function"
    }, {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [{"name": "", "type": "string"}],
        "payable": false,
        "type": "function"
    }, {
        "constant": false,
        "inputs": [{"name": "_spender", "type": "address"}, {"name": "_value", "type": "uint256"}],
        "name": "approve",
        "outputs": [{"name": "success", "type": "bool"}],
        "payable": false,
        "type": "function"
    }, {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"name": "", "type": "uint256"}],
        "payable": false,
        "type": "function"
    }, {
        "constant": false,
        "inputs": [{"name": "_from", "type": "address"}, {"name": "_to", "type": "address"}, {
            "name": "_value",
            "type": "uint256"
        }],
        "name": "transferFrom",
        "outputs": [{"name": "success", "type": "bool"}],
        "payable": false,
        "type": "function"
    }, {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "payable": false,
        "type": "function"
    }, {
        "constant": false,
        "inputs": [{"name": "_to", "type": "address"}, {"name": "_amount", "type": "uint256"}],
        "name": "mint",
        "outputs": [],
        "payable": false,
        "type": "function"
    }, {
        "constant": true,
        "inputs": [],
        "name": "version",
        "outputs": [{"name": "", "type": "string"}],
        "payable": false,
        "type": "function"
    }, {
        "constant": false,
        "inputs": [{"name": "_spender", "type": "address"}, {"name": "_subtractedValue", "type": "uint256"}],
        "name": "decreaseApproval",
        "outputs": [{"name": "success", "type": "bool"}],
        "payable": false,
        "type": "function"
    }, {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "payable": false,
        "type": "function"
    }, {
        "constant": false,
        "inputs": [],
        "name": "finishMinting",
        "outputs": [],
        "payable": false,
        "type": "function"
    }, {
        "constant": true,
        "inputs": [],
        "name": "owner",
        "outputs": [{"name": "", "type": "address"}],
        "payable": false,
        "type": "function"
    }, {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "payable": false,
        "type": "function"
    }, {
        "constant": false,
        "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}],
        "name": "transfer",
        "outputs": [{"name": "success", "type": "bool"}],
        "payable": false,
        "type": "function"
    }, {
        "constant": false,
        "inputs": [{"name": "_spender", "type": "address"}, {"name": "_addedValue", "type": "uint256"}],
        "name": "increaseApproval",
        "outputs": [{"name": "success", "type": "bool"}],
        "payable": false,
        "type": "function"
    }, {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}, {"name": "_spender", "type": "address"}],
        "name": "allowance",
        "outputs": [{"name": "remaining", "type": "uint256"}],
        "payable": false,
        "type": "function"
    }, {
        "constant": false,
        "inputs": [{"name": "newOwner", "type": "address"}],
        "name": "transferOwnership",
        "outputs": [],
        "payable": false,
        "type": "function"
    }, {
        "anonymous": false,
        "inputs": [{"indexed": true, "name": "to", "type": "address"}, {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
        }],
        "name": "Mint",
        "type": "event"
    }, {"anonymous": false, "inputs": [], "name": "MintFinished", "type": "event"}, {
        "anonymous": false,
        "inputs": [{"indexed": true, "name": "previousOwner", "type": "address"}, {
            "indexed": true,
            "name": "newOwner",
            "type": "address"
        }],
        "name": "OwnershipTransferred",
        "type": "event"
    }, {
        "anonymous": false,
        "inputs": [{"indexed": true, "name": "_from", "type": "address"}, {
            "indexed": true,
            "name": "_to",
            "type": "address"
        }, {"indexed": false, "name": "_value", "type": "uint256"}],
        "name": "Transfer",
        "type": "event"
    }, {
        "anonymous": false,
        "inputs": [{"indexed": true, "name": "_owner", "type": "address"}, {
            "indexed": true,
            "name": "_spender",
            "type": "address"
        }, {"indexed": false, "name": "_value", "type": "uint256"}],
        "name": "Approval",
        "type": "event"
    }]
}