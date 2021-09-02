const config = require("./configs/env")

const Web3 = require('web3');
const web3 = new Web3();
// console.log(`eth daemon`, host, port, websocketport)



async function go() {
  let urls = [
    "http://ethereum-testnet-v2.0.5.cointainers.dev.*yourdomain*.org:8332",
    "http://ethereum-testnet-v1.11.6.cointainers.dev.*yourdomain*.org:8332",
    "https://ropsten.infura.io/v3/<redacted>",
    // "http://localhost:8545"
  ]

  for (let url of urls) {
    console.log(`\nurl`, url)
    const provider = new Web3.providers.HttpProvider(url)

    web3.setProvider(provider)

    for (let i = 0; i < 5; i++) {
      let network = await web3.eth.net.getNetworkType()
      let isSyncing = await web3.eth.isSyncing()
      let blockNumber = await web3.eth.getBlockNumber()
      let count = await web3.eth.getTransactionCount("0xA9789DAf0cd229B3f4Ca0783a1b74772dCDbd4FC")

      console.log(`stats`, { network, isSyncing, blockNumber, count })
    }

  }

}

go().catch(console.error)
