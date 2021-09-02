/*
    Types of schema

    Exchange accounts

    Wallets



 */

//get accounts

/*
    Binance

    Arbiter-custodial

    Wallets

 */


let schema = {
    COLLECTIONS:[
        'binance-balances',
        'binance-credits',
        'binance-debits',
        'binance-transfers',
        'binance-trades',
        'binance-txs',
        'binance-history',
        'binance-queries',
        'arbiterLa-balances',
        'arbiterLa-credits',
        'arbiterLa-debits',
        'arbiterLa-transfers',
        'arbiterLa-trades',
        'arbiterLa-cancels',
        'arbiterLa-matchs',
        'arbiterLa-txs',
        'arbiterLa-history',
        'arbiterLa-queries',
        'wallet-btc-balances',
        'wallet-btc-credits',
        'wallet-btc-debits',
        'wallet-btc-transfers',
        'wallet-btc-txs',
        'wallet-btc-history',
        'wallet-btc-queries',
        'wallet-btc-utxo',
        'wallet-ltc-balances',
        'wallet-ltc-credits',
        'wallet-ltc-debits',
        'wallet-ltc-transfers',
        'wallet-ltc-txs',
        'wallet-ltc-history',
        'wallet-ltc-queries',
        'wallet-ltc-utxo',
        'wallet-eth-balances',
        'wallet-eth-credits',
        'wallet-eth-debits',
        'wallet-eth-transfers',
        'wallet-eth-txs',
        'wallet-eth-history',
        'wallet-eth-queries',
        'wallet-eth-utx',
        'wallet-gnt-balances',
        'wallet-gnt-credits',
        'wallet-gnt-debits',
        'wallet-gnt-transfers',
        'wallet-gnt-txs',
        'wallet-gnt-history',
        'wallet-gnt-queries',
        'wallet-gnt-utx',
        'match-history',
        'arbiter-report',
        'LA-report',
        'signup-report',
        'asym-report',
        'orders',
        'users',
        'messages',
        'channels',
        'order-deposits',
        'admin-users'
    ],
    INDEXES:{
        'binance-transfers':'txId',
        'binance-trades':'id',
        'binance-txs':'txid',
        'binance-balances':'nonce',
        'arbiterLa-transfers':'txid',
        'arbiterLa-trades':'orderId',
        'arbiterLa-cancels':'orderId',
        'arbiterLa-txs':'txid',
        'arbiterLa-balances':'nonce',
        'wallet-btc-utxo':'txid',
        'wallet-btc-balances':'nonce',
        'wallet-ltc-balances':'nonce',
        'wallet-eth-balances':'nonce',
        'wallet-gnt-balances':'nonce',
        'wallet-btc-txs':'txid',
        'wallet-ltc-utxo':'txid',
        'wallet-ltc-txs':'txid',
        'wallet-eth-utx':'txid',
        'wallet-eth-txs':'txid',
        'wallet-gnt-utx':'txid',
        'wallet-gnt-txs':'txid',
    }
}

module.exports = schema


/*

let collections = schema
let match = connection.get('match-history')
let balances = connection.get('balances')
let credits = connection.get('credits')
let debits = connection.get('debits')
let reportARB = connection.get('arbiter-report')
let reportLA = connection.get('LA-report')
let reportSignup = connection.get('signup-report')
let reportAsym = connection.get('asym-report')
let orders = connection.get('orders')
let users = connection.get('users')
let exchangeBook = connection.get('exchangeBook')



 */