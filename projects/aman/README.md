# aman

Life after the middle earth

## Intro

The Aman project is a node layer used to interact with Ethereum network for the
arbiter project. It's main capability is managing a multisig smart contract
and associated forwarding addresses. The smart contract is a fork of the [Bitgo
Multisig Wallet](https://github.com/BitGo/eth-multisig-v2).

It also uses redis to manage addresses associated with the wallet so it can detect payments.

Aman is designed to support both ETH and tokens, with each token listening on a
different RPC port. See [RPC] section for moar details.


## Getting Started

#### Eth node
   This repo includes [docker-compose.yml](./docker-compose.yml) which can be used to run a local geth  
   node in dev mode via docker. To start, make sure your docker daemon is running  
   and then, from the project directory, run:  

   ```
   docker-compose up geth-dev
   ```

   If successful, this will start a node running on ports 8545 (http) and 8546 (websocket).  
#### Copy config template into place
   Aman uses environment variables for config management.

   ```
   cp configs/example_dotenv.sh .env

   # then, edit .env to include parameters you want
   ```  

#### Determine master address
   By default, Aman basically picks an address at random to use as the gas address.  
   This makes testing Aman easy, but for integration testing you will likely need to  
   specify a MASTER_ADDRESS in the config. If using for integration testing, the  
   MASTER_ADDRESS *MUST* match the Arbiter config for master address.  

#### Deploy static contracts
   The multisig wallet contract depends on a Logger, Proxy Factory, and Forwarder template
   address. These are deployed once and then used by all subsequent wallets. Once you have
   your eth node and master address configured (if applicable), run:

   ```node tools/deploy-prerequisites.js```

   Copy the generated lines into your config

   ```
   export LOGGER_ADDRESS="0x..."
   export PROXY_FACTORY_ADDRESS="0x..."
   export FORWARDER_ADDRESS="0x..."
   export WALLET_ADDRESS="0x..."
   export WALLET_FACTORY_ADDRESS="0x..."
   ```
#### Start app and workers
   ```source .env && pm2 start process.json```

## Processes

You will see that [process.json](./process.json) defines several processes

### rpc.js

HTTP RPC client that serves requests.

IMPORTANT: Each RPC process is specific to a given coin. e.g., from `process.json`:

```
{
  "script"    : "./rpc.js",
  "name" : "rpc-ETH-3003",
  "env" : {
    "RPC_PORT": 3003,
    "COIN": "ETH"
  }
}, {
  "script"    : "./rpc.js",
  "name" : "rpc-GNT-3004",
  "env" : {
    "RPC_PORT": 3004,
    "COIN": "GNT"
  }
}, {
```

Accordingly, behavior will be different if sending to ETH vs TOKEN endpoints.
You can see that different routes are loaded depending on the coin type.

```
// rpc.js
const ethWallet = require('./modules/eth-wallet')
const tokenWallet = require('./modules/token-wallet')

...

if ( isToken(COIN) ) {
  methods = Object.assign(client, tokenWallet)
} else if ( COIN === "ETH" ) {
  methods = Object.assign(client, ethWallet)
}

```

### workers/block-digester

Processes blocks and detects payments

### workers/block-listener

Listens for blocks and puts them into redis queue for processing by block-digester

### workers/create-forwarders

When a new multisig contract is created, we want to create 5 forwarders for that
contract so we can immediately hand out addresses when requested via `getForwarder`

### workers/contract-payments-listener

Listens for payments on forwarder addresses

### workers/flush-finder and workers/flush-worker

Checks forwarder addresses owned by Aman and flushes them to the wallet contract

### workers/wallet-notify

Pushes notifications to a configurable endpoint for payments and other events

### tools/unlock

TODO: kill with fire, temp unlocking solution

## Testing

Tests are configured to run in CircleCI using docker-compose.

Unit Tests: `jest __tests__/*.unit.*`

Integration Tests: `jest __tests__/*.int.* --runInBand` NOTE: it's important to
run integration tests using the --runInBand flag or there will be nonce conflicts
when broadcasting transactions against the geth-dev container

# RPC client

See the [JSON RPC spec](http://www.jsonrpc.org/specification) for general
examples on how to use JSON RPC.

#### addmultisigaddress

```
$ curl http://localhost:3003 -d '{"jsonrpc": "2.0", "method": "addmultisigaddress", "params": [["0x1e937fd7c85ffd5bf6071b2ea8420a19a3f61f23","0xfd6d2028c11ee3b118416ee1e35f09ef2332face","0x2854274f8b3521310d0db099439c1821cfd10cd1"]], "id": 3}'

{
  "id": 3,
  "error": null,
  "result": {
    "address": "0x540261Ae4abFea4bc51C8Ac5D9916dB36426de0d",
    "signers": [
      "0x2854274F8B3521310d0dB099439c1821Cfd10cd1", "0x67DdD8a128E68913ce056F944782Af9c89B3E866", "0x0935B14851b822bD9434D069d47E7d6571C7E6ed"
    ],
    "forwarders": ["0xFf1A8581335c953FeCbdC30766191943d1A6Fc07", "0x032e5188b0891846233562375F098F40352A915a", "0xb2779e7DcFBde2B943120Bdf2370314eCB54C0a4", "0x4880A257a1B0b5e32271AB22B990EE3Cf5c452Ae", "0x366118B1005BeA9E856c717D40fA0730013A9667"]
  }
}
```

#### getinfo

```
$ curl http://localhost:3003 -d '{"jsonrpc": "2.0", "method": "getinfo", "params": [], "id": 4 }'

{ version: 'aman-0.0.1',
  parity: '',
  coin: 'ETH',
  gasPrice: '0',
  keypoolsize: 0,
  accounts: [],
  protocolVersion: '63',
  isSyncing:
   { currentBlock: 0,
     highestBlock: 4283120,
     startingBlock: 0,
     warpChunksAmount: '0x4e3',
     warpChunksProcessed: '0x1cf' },
  network: 'ropsten',
  peers: 21,
  blockNumber: 0 }
```

#### createforwarder

```
$ curl http://localhost:3003 -d '{"jsonrpc": "2.0", "method": "createforwarder", "params": [{ "contractAddress": "0x6d44fb70fd3f4f7a77557dea565e7d3dfd0f812d", "gasAddress": "0xe3c4e792d77066a09886e035b3e6c967bab62a36" }], "id": 4 }'

{"id":4,"error":null,"result":{"address":"0x74e994c1c0682645598ee09042fc4ce98b146dba"}}
```

#### getforwarder

```
$ curl http://localhost:3003 -d '{"jsonrpc": "2.0", "method": "getforwarder", "params": [{ "contractAddress": "0xe8dd28484c001E4dFd0516D51Ca602c9C7D3502E" }], "id": 4 }'

{"id":4,"error":null,"result":{"address":"0x74e994c1c0682645598ee09042fc4ce98b146dba"}}
```

#### getsequenceid

```
$ curl http://localhost:3003 -d '{"jsonrpc": "2.0", "method": "getsequenceid", "params": ["<contract_address>"], "id": 4 }'

{"id":4,"error":null,"result":{"sequenceId":1}}
```

#### sendmultisig

For ETH

```
$ curl http://localhost:3003 -d '{"jsonrpc": "2.0", "method": "sendmultisig", "params": [{
    "contractAddress": "0x...",
    "gasAddress": "0x...",
    "toAddress": "0x...",
    "expireTime": 1521230562,
    "amountInEth": 1,
    "data": "0x",
    "sequenceId": 1,
    "otherSig" "0x56102ade73b5e71286192780dafeeb4051c84afde22e008edd9bd3f5668468437cb2138faa590ecf0be5f2e5ea8578be29f5820af393e2eeff374e2517f1304d1c"
  }], "id": 4 }'

{
  txid: '0xe879a12032780e920f6ed4796e67ee85a81cb513d65c3406d06dfddd79a6dfbb'
}
```

For TOKENS

```
$ curl http://localhost:3003 -d '{"jsonrpc": "2.0", "method": "sendmultisig", "params": [{
    "contractAddress": "0x...",
    "gasAddress": "0x...",
    "toAddress": "0x...",
    "expireTime": 1521230562,
    "value": 1,
    "sequenceId": 1,
    "otherSig" "0x56102ade73b5e71286192780dafeeb4051c84afde22e008edd9bd3f5668468437cb2138faa590ecf0be5f2e5ea8578be29f5820af393e2eeff374e2517f1304d1c"
  }], "id": 4 }'

{
  txid: '0xe879a12032780e920f6ed4796e67ee85a81cb513d65c3406d06dfddd79a6dfbb'
}
```

#### createrawmultisigtransaction

called to get the hash for a multisig signing request

ETH

```
$ curl http://localhost:3003 -d '{"jsonrpc": "2.0", "method": "createrawmultisigtransaction", "params": [{ "toAddress": "0xc4d547efd75783aaffe15ad06793f22810e2818b", "amountInEth": 1, "data" : "", "sequenceId": 1, "expireTime": "" }], "id": 4 }'

{"id":4,"error":null,"result":{"ophash":"5076bfbbe0442dc247936122c1b43291bdf8ea2951b8ccb14bf7608e20c82550"}}
```

TOKENS

```
$ curl http://localhost:3003 -d '{"jsonrpc": "2.0", "method": "createrawmultisigtransaction", "params": [{ "toAddress": "0xc4d547efd75783aaffe15ad06793f22810e2818b", "value": 1, "sequenceId": 1, "expireTime": "" }], "id": 4 }'

{"id":4,"error":null,"result":{"ophash":"5076bfbbe0442dc247936122c1b43291bdf8ea2951b8ccb14bf7608e20c82550"}}
```


#### sendtoaddress

```
curl -v http://arb-eth01.dev.redacted.example.com:3003 -d '{"jsonrpc": "2.0", "method": "sendtoaddress", "params": ["0xA2AC95734275Ac02F750686D44154E3d2B516429", "5"], "id": 4 }'
```

#### getnewaddress

```
$ curl -v http://arb-eth01.dev.redacted.example.com:3003 -d '{"jsonrpc": "2.0", "method": "getnewaddress", "params": [], "id": 4 }'

{"id":4,"error":null,"result":"0x845bc24bfaeb1009b531c430f4434632ad6b5e27"}
```

#### signrawtransaction

```
$ curl http://localhost:3003 -d '{"jsonrpc": "2.0", "method": "signrawtransaction", "params": ["6f49d6fb8222037b96f392a5a5af65e6363c18596c55397ada6600ceb099f992"], "id": 4 }'

{"id":4,"error":null,"result":{"signature":"0x516856801fa56a9afb96634685454cbbba2a9df30611a030fb2cec44633d2ca22a3ae9c383371abb73759f3e89692e1fad3338154ae648243f336973069bf9c61b"}}
```

#### validatewalletaddress

```
$ curl http://localhost:3003 -d '{"jsonrpc": "2.0", "method": "validatewalletaddress", "params": [{ "signerAddress": "0x3c67d625C3cfaAAd30c801181973b2d9486D63c4", "walletAddress": "0xe0e534DcA5F095D04314A67f159B83E1941E4823" }], "id": 4 }'

{"id":4,"error":null,"result":{"valid":true}}
```
