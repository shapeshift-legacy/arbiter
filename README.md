# arbiter


## deploy

## dev

The build process uses yarn workspaces for local dependency resolution. IE,
since `projects/arbiter-api` has `@arbiter/arb-daemons-manager` as a dependency,
we want it to use the current `packages/daemons-manager` as that module.

### quick start

```
# install yarn globally
npm i -g yarn

# clean any existing node_modules directories
./scripts/clean.sh

# seems best for getting started, more discussion probably required
rm yarn.lock

# install node_modules to all projects in monorepo using local resolution
yarn install
```

## overview

General Setup is 5 projects:
- arbiter
- oracle
- arbiterRI (reference implementation, includes e2e test suite)
- arbiterTE
- arbiterLA

## testing

Arbiter currently relies heavily on e2e tests that can be run manually in the
dev environment. However, we are transitioning to circleci so we can rely more
heavily on unit and integration tests.

### Unit/Integration tests

Documentation coming coon

### E2E Tests

```
ssh <user>@<server>
sudo su - <admin>
cd arbiter-reference-implementation
npm run test-e2e
```

## sequence diagrams

![alt text](https://github.com/shapeshift-legacy/arbiter/blob/master/docs/UserCreateAccountSequence.png)

- 1 (client interface)
- 2 (interface wallet mangement)
- 3 (interface wallet mangement)
- 4 (interface wallet mangement)
- 5 REST api

```
{
    account: '1J67XH3QMG1GTL8F7JSBgr91296tC67cFk',
    payload:
       { ethAddress: '0x33b35c665496bA8E71B22373843376740401F106',
         action: 'create' },
    signature: 'H1BQ97X7aBEUIDUf8atK0K98rL1ZkNgskneZYLZjY8ARLWGylM2+7Xoi9WbzcMRbwAO55z6/Sg1nTV5Bi6bJc+g=' }
}
```
 - 6
 - 7
 - 8 true
 - 9 REST response
 ```
 {
    success: true,
    payload:
       { account: '1J67XH3QMG1GTL8F7JSBgr91296tC67cFk',
         eth: true,
         ethAddress: '0x33b35c665496bA8E71B22373843376740401F106',
         contractAddress: '0xd5dbbc3813a15ab330c32d62ab24dcb5c94f064b' }
  }

 ```


## UserOrderCreateSequence
![alt text](https://github.com/shapeshift-legacy/arbiter/blob/master/docs/UserOrderCreateSequence.png)

 - 1
 - 2 Examples orderBook
 ```
{ bids:
   [ { quantity: 0.66399999, price: 0.01603, orders: [Array] },
     { quantity: 1, price: 0.01602761, orders: [Array] },
     { quantity: 1, price: 0.01601899, orders: [Array] },
     { quantity: 1, price: 0.01601781, orders: [Array] },
     { quantity: 1, price: 0.01601502, orders: [Array] },
     { quantity: 1, price: 0.01601, orders: [Array] },
     { quantity: 1, price: 0.01600609, orders: [Array] },
     { quantity: 1, price: 0.01600501, orders: [Array] },
     { quantity: 1, price: 0.016001, orders: [Array] },
     { quantity: 1, price: 0.01600019, orders: [Array] } ],
  offers:
   [ null,
     { quantity: 1, price: 0.016115, orders: [Array] },
     { quantity: 1, price: 0.016117, orders: [Array] },
     { quantity: 1, price: 0.01611775, orders: [Array] },
     { quantity: 1, price: 0.01611777, orders: [Array] },
     { quantity: 1, price: 0.01614486, orders: [Array] },
    ] }
 ```
 - 3
 - 8
 ```
  {
      account: '1LQ1TFBPLxcuXBzAorEbDxf1uKVK6jbfhL',
      payload:
       { expiration: '12',
         pubkey: '022a43067e12da19441f70ad95660629e0c9d14d25d8e902f46a9ad0a73c710afd',
         pair: 'LTC_BTC',
         rate: '0.01746006',
         amountIn: '.12',
         returnAddress: 'LLe4PciAJgMMJSAtQQ5nkC13t6SSMmERJ3',
         withdrawalAddress: '1LUEqRQv9NJZsfwEM2qqGrW4TVw5QeJd5r' },
      signature: 'H4cvuHsbW09Ac1wHas3q/lb6uIP1zjaxeGKxDGZgvO1qb1/tYAWU0GF7nJal/ZvJZ07TSDeJRB4PnU4RgQ3fq6M='
  }
 ```
 - 9
 ```
 getNewAddress()
 1KybMFZgHpVq2UiD6dm2i5UTrVxVf9VqFu
 validateAddress()
 {
  "isvalid": true,
  "address": "1KybMFZgHpVq2UiD6dm2i5UTrVxVf9VqFu",
  "scriptPubKey": "76a914d0263b2ff164cc88ba51f90e171dda79ae66641a88ac",
  "ismine": true,
  "iswatchonly": false,
  "isscript": false,
  "iswitness": false,
  "pubkey": "02b9a97b35206f38d6fdffef4a7bcf14305823609b0696bfd3857b448b66be811b",
  "iscompressed": true,
  "account": "",
  "timestamp": 1512691159,
  "hdkeypath": "m/0'/0'/325'",
  "hdmasterkeyid": "d26bc60fc167a8ead3a7467e7ebed34f331e7c26"
}

 ```
 - 10
 - 21 Eth Create Deposit Address
 ```
 {
  "method": "createforwarder",
  "params": [
    {
      "contractAddress": "0x6d44fb70fd3f4f7a77557dea565e7d3dfd0f812d",
      "gasAddress": "0xe3c4e792d77066a09886e035b3e6c967bab62a36"
    }
  ]
}
 ```
 - 22 Eth Create Forwarder Response
 ```
 {"id":4,"error":null,"result":{"address":"0x74e994c1c0682645598ee09042fc4ce98b146dba"}}
 ```
 - 23
 ```
  {
  success: true,
  signing: '1EbE7NHdEae1NQu2vQ9i6U43CaudQVfFQz',
  signature: 'H25K+bSx04TgpLfWg2FOYJ5eQTEKTh1k2Bv/Bz5zCJR2arJVzjTqOhN27F0hQNXd5dqyM3Uqfn9eSkE+HHt+G0k=',
  payload:
   { orderId: '6e8cac4b-1b53-4344-8f1e-4fc0f0c5c16d',
     pubkeyCustomer: '022a43067e12da19441f70ad95660629e0c9d14d25d8e902f46a9ad0a73c710afd',
     pubkeyArbiter: '03c731859ecb360d2d372ba133fb5e58df393705e1ee332c7de5bc42abfe467fda',
     pubkeyOracle: '03c7ba329580905263713071f3d61c1bbf1d313c75f1327b8d09708e60642460ed',
     depositAddress: 'MPwkRk2KHEqkXmW1HnnYmmVrUHXkHr88oX',
     returnAddress: 'LLe4PciAJgMMJSAtQQ5nkC13t6SSMmERJ3',
     withdrawalAddress: '1LUEqRQv9NJZsfwEM2qqGrW4TVw5QeJd5r',
     maxDeposit: 'Not set',
     minDeposit: 'Not set',
     coinIn: 'LTC',
     coinOut: 'BTC',
     amountIn: '.12',
     rate: '0.01746006',
     pair: 'LTC_BTC' }
     }

 ```
 - 24
 - 27
 ```
 {
    "payload":
        {
            "orderId":"6e8cac4b-1b53-4344-8f1e-4fc0f0c5c16d",
            "coin":"2.1",
            "arbiterPubKey":"03c731859ecb360d2d372ba133fb5e58df393705e1ee332c7de5bc42abfe467fda",
            "pubkeyOracle":"03c7ba329580905263713071f3d61c1bbf1d313c75f1327b8d09708e60642460ed",
            "userkey":"022a43067e12da19441f70ad95660629e0c9d14d25d8e902f46a9ad0a73c710afd",
            "depositAddress":"MPwkRk2KHEqkXmW1HnnYmmVrUHXkHr88oX"
         },
     "signature":"IGIlvixWbLKGN7HVMJUOhcvaMWdkfPPizp+V5jOLMDK3R/NL+CkBG+7P3A6u+2X4Jo2SU47JI7Hym2L304DGNEo="
     }


 ```


## LiqudityAgentMatchEventTrade
![LiqudityAgentMatchEventTrade](https://github.com/shapeshift-legacy/arbiter/blob/master/docs/LiqudityAgentMatchEventTrade.png)
 - 1 / 2
```
{ engine: 'LTC_BTC',
   restingOrder:
    { id: 'cecca7d7-6033-432f-a337-27862cf48719',
      taker: false,
      price: 0.0175,
      quantity: 0.07789997,
      status: 'Working',
      isBuy: false,
      event: 'order' },
   aggressiveOrder:
    { id: 'f1a62ce4-121b-492a-b31a-d0a348ec1d8b',
      taker: true,
      price: 0.0175,
      quantity: 0,
      status: 'complete',
      isBuy: true },
   restingOrderPrice: 0.0175,
   matchQuantity: 0.003,
   time: 1523558923329,
   market: 'LTC_BTC' }

```
- 3
params: marketPair, price, quantity
```
"BTC-LTC", 0.015, 1
```
- 4
```
{
	"success" : true,
	"message" : "",
	"result" : {
			"uuid" : "614c34e4-8d71-11e3-94b5-425861b86ab6"
		}
}
```
- 5
Save traded orders via exchanges to Arbiter Redis: To Be Done


## LiquidityAgentOrderCreate
![alt text](https://github.com/shapeshift-legacy/arbiter/blob/master/docs/LiquidityAgentOrderCreate.png)
- 1
LiquidityAgent CreateOrderDetails
- 2
```
"tradeAgent",
{
    time: 392349823492348,
    event: 'submit',
    orderId: '614c34e4-8d71-11e3-94b5-425861b86ab6',
    quantity: 1,
    rate: 0.001,
    type: 'open',
    market: "LTC_BTC"
}
```
- 3



## OrderDepositFundingSequence
![alt text](https://github.com/shapeshift-legacy/arbiter/blob/master/docs/OrderDepositFundingSequence.png)
## OrderExpiredSequence
![alt text](https://github.com/shapeshift-legacy/arbiter/blob/master/docs/OrderExpiredSequence.png)

- 1
- 2

## OrderRetargetSequence
![alt text](https://github.com/shapeshift-legacy/arbiter/blob/master/docs/OrderRetargetSequence.png)
## UserCancelOrderSequence
![alt text](https://github.com/shapeshift-legacy/arbiter/blob/master/docs/UserCancelOrderSequence.png)

## Setup

This guide is mostly specific to this project, but make occasional references to the others


## pull submodules



### Install Coin Daemons

1) Download tar.gz files from relevant repos

e.g., https://github.com/bitcoin/bitcoin/releases

2) unzip tar files to get daemons

```
$ tar -xvf bitcoin-0.15.1-osx64.tar.gz
$ cd bitcoin-0.15.1
$ find .
./bin/bitcoin-cli
./bin/bitcoind
[...]
```

3) start the coin daemons in testnet mode

```
./bitcoind -testnet -daemon
```

this will take maybe an hour or two to download the testnet chain, possibly less

### Setup config

1) Copy config files into place

```
$ cd configs
$ for f in `ls example*`; do len=${#f}; new=${f:8:len}; `cp $f $new`; done
```

2) Generate 2 addresses from coin cli to use in `configs/arbiterConfig.js` and `configs/oracleConfig.js`. One
will be used as the "master" address for oracle, one for arbiter. These are the master addresses used
for signing messages between arbiter and the oracle. *Note:* that even though the config names are `signingPub` or `pubKey`,
these fields should be populated with the addresses themselves.

```
./bitcoin-cli getnewaddress
```

3) In bitcoin.conf (usually in `"~/Library/Application Support/Bitcoin/bitcoin.conf"` for macs), add a line for
wallet notify that points at `walletNotifyScripts/walletnotify[coin].sh`. The script logs requests to
`/var/log/btc-wn.log` so you can check that file to make sure it's getting called.

```
walletnotify=/Users/<YOUR_USER_NAME_HERE>/projects/arbiter/walletNotifyScripts/walletnotifyBtc.sh %s
```

### Confirm setup by running the tests in the arbiterRI project

Once you've completed setup in all three projects, run `npm test-dev` in the
RI project to confirm that things are working as expected.

## API

## GET calls

### coins

http://127.0.0.1:3000/api/v1/coins

```
[
    "btc",
    "ltc",
    "eth"
]
```


### markets

http://127.0.0.1:3000/api/v1/markets

```
[
    {
        "id": 1,
        "pair1": "BTC_LTC",
        "pair2": "LTC_BTC",
        "base_currency": "LTC",
        "quote_currency": "BTC",
        "base_min_size": "0.00000001",
        "base_max_size": "21000000",
        "quote_increment": "0.0001"
    }
]
```

### orderbook

http://127.0.0.1:3000/api/v1/orderbook/BTC_LTC

```
{
    "bids": [
        {
            "quantity": 0.0036000000000000008,
            "price": 0.0175,
            "orders": [
                {
                    "id": "63284087-8095-4981-b6ff-63962f9f7dae",
                    "qty": 0.0004
                },
                {
                    "id": "34967cf9-e3dc-4f96-860d-49c0593b457e",
                    "qty": 0.0004
                },
                {
                    "id": "51b4598d-cd63-47ba-a84c-715cc208090e",
                    "qty": 0.0004
                },
                {
                    "id": "517581b4-8f2f-4635-a53c-c9d2444f389f",
                    "qty": 0.0004
                },
                {
                    "id": "96c0ba25-97d5-401b-b3ca-debb8926fd02",
                    "qty": 0.0004
                },
                {
                    "id": "b23ac23a-6cde-4dc7-b5ba-a1796f162bd7",
                    "qty": 0.0004
                },
                {
                    "id": "b56bc99e-447a-4bbe-8034-8ec0538ef0b7",
                    "qty": 0.0004
                },
                {
                    "id": "cd71cf9b-587c-4b5c-8506-5501e0145a07",
                    "qty": 0.0004
                },
                {
                    "id": "2418d0aa-b840-4003-928d-1a871d3322f0",
                    "qty": 0.0004
                }
            ]
        }
    ],
    "offers": []
}
```

### Lookup by txid

http://127.0.0.1:3000/api/v1/btc/*txid*

### Lookup by account

http://127.0.0.1:3000/api/v1/orderlist/*account*

### Lookup by orderId

http://127.0.0.1:3000/api/v1/orderlist/*account*

```
{ returnAddress: 'mpynbRVdG7MRJKXJK8h5FhGptPA1q1qkw9',
  coinOut: 'LTC',
  pubkeyArbiter: '0321111aa8ee45d4efb80bd08d9caf317261bf727d37962d94c260efcab8284ed4',
  coin: '1',
  owner: 'customer',
  arbiterPubKey: '0321111aa8ee45d4efb80bd08d9caf317261bf727d37962d94c260efcab8284ed4',
  pubkeyOracle: '029d0dca1be8bc6eda4dd6a0a68cb8c8f0ebebd20b47cffc54953408c39d53eaad',
  expiration: '1518464531774',
  amountIn: '0.0004',
  status: 'unfunded',
  userkey: '038d80a6c50322acaef7c3643100ea8bab20598afd7a91dbd811e27283ec731284',
  timeCreation: '1518464501774',
  rate: '0.0175',
  coinIn: 'BTC',
  withdrawalAddress: 'mjZWFhYg8ZXSHcBrcJoxk2yd41UTCdQRzG',
  depositAddress: '2Mt8NLJuvjCs6XtaxWMSR6MQPbCMjHyp9GS',
  orderId: 'c5931f3f-24fb-4c78-a7d9-539e121e3114' }
```

## POST

### Limit order
http://127.0.0.1:3000/api/v1/limitorder

JSON body IN
```
 { account: 'n1E5N1zX2ANQsFFY2ZiMvyMidoVK7TzQwC',
  payload:
   { expiration: 0.5,
     pubkey: '038d80a6c50322acaef7c3643100ea8bab20598afd7a91dbd811e27283ec731284',
     pair: 'BTC_LTC',
     rate: 0.0175,
     amountIn: 0.0004,
     returnAddress: 'mtUJbaoVtFKMqWeZWG5w6z8iKQFEBV1aDa',
     withdrawalAddress: 'n2NQJsoE3TjyaxMwR6dsSMMfshk9myhZ9P' },
  signature: 'this is a fake sig' }
```
Response
```
 bodyOracle:  { order:
   { account: 'n1E5N1zX2ANQsFFY2ZiMvyMidoVK7TzQwC',
     payload:
      { expiration: 0.5,
        pubkey: '038d80a6c50322acaef7c3643100ea8bab20598afd7a91dbd811e27283ec731284',
        pair: 'BTC_LTC',
        rate: 0.0175,
        amountIn: 0.0004,
        returnAddress: 'mtUJbaoVtFKMqWeZWG5w6z8iKQFEBV1aDa',
        withdrawalAddress: 'n2NQJsoE3TjyaxMwR6dsSMMfshk9myhZ9P' },
     signature: 'this is a fake sig' },
  arbiterData:
   { success: true,
     signature: 'thisisaninvalidsig',
     payload:
      { orderId: '94649951-edf1-4d18-8712-549033f9a783',
        pubkeyCustomer: '038d80a6c50322acaef7c3643100ea8bab20598afd7a91dbd811e27283ec731284',
        pubkeyArbiter: '02edeebf2034ea2e7b5d90f092f5b013d37cd8c981495c4267f9863cf89b8c1d85',
        depositAddress: '2N2JwPpo1UnHJB8AfD1o9sbo38FurhPynHz',
        returnAddress: 'mtUJbaoVtFKMqWeZWG5w6z8iKQFEBV1aDa',
        withdrawalAddress: 'n2NQJsoE3TjyaxMwR6dsSMMfshk9myhZ9P',
        maxDeposit: 'Not set',
        minDeposit: 'Not set',
        coinIn: 'BTC',
        coinOut: 'LTC',
        amountIn: 0.0004,
        rate: 0.0175,
        pair: 'BTC_LTC' } } }
```

### cancel

http://127.0.0.1:3000/api/v1/cancel

```
{ orderId: '94649951-edf1-4d18-8712-549033f9a783',
  status: 'cancelled',
  txid: '97963cffcac57dd57a6cc6286d05c280e172c2d71a9145d8c5ccab83ce73487f' }
```

### retarget

http://127.0.0.1:3000/api/v1/retarget



## Websocket

events
