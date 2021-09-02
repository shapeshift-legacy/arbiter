let Wallet = artifacts.require("./WalletSimple.sol");
let Forwarder = artifacts.require("./Forwarder.sol");
let ProxyFactory = artifacts.require("./ProxyFactory.sol");
let erc20 = artifacts.require("./ERC20Interface.sol");
const { web3 } = require('../modules/web3-manager')

// let accounts = web3.eth.accounts

module.exports = async deployer => {
    //deployer.deploy(erc20,{gas:16712388});
    //deployer.link(erc20,forwarder)
    //deployer.deploy(forwarder);
    //deployer.link(erc20,wallet)
    // deployer.link(forwarder,wallet)
    let forwarder = await deployer.deploy(Forwarder)
    let proxyFactory = await deployer.deploy(ProxyFactory)
    
    console.log('x', forwarder, proxyFactory)
    
    // deployer.deploy(Wallet,[
    //   accounts[0],accounts[1],accounts[2]
    // ], proxyFactory.address, forwarder.address);
    //deployer.link(ConvertLib, MetaCoin);
    //deployer.deploy(MetaCoin);
    
    deployer.then(() => {
      console.log(`then`, proxyFactory, forwarder)
    })
};
