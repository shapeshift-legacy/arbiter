// require('dotenv').config({ path: '../../../../.env' })
const { initialOrderbook, finalOrderbook, wsEvent, ResultOneWsEventReplayed, wsQue } = require('../../__mocks__/binance')
const {redis, publisher} = require('arb-redis')
// const coinBal = require('../../../modules/binance/coinBal')
const config = require('../../configs/env')
const btcAllocationForMarkets = config.BTC_ALLOCATION_FOR_MARKETS

let events = [
    // cancel bid LTC_BTC
    {
        account: 'mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK',
        'orderId' : '4ae54ea7-0afd-4490-b0b3-b93378dafad5',
        orderInfo: {
            account: 'mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK',
            market: 'LTC_BTC',
            orderId: '4ae54ea7-0afd-4490-b0b3-b93378dafad5',
            amountQuote: '0.015412740989280001',
            rate: '0.00911600',
            type: 'bid',
            owner: 'liquidityAgent',
            coinIn: 'BTC',
            coinOut: 'LTC',
            coinFunding: 'BTC',
            BTC: '1541274',
            price: '0.00911600',
            quantity: '1.69073508' },
        cancel: 'true',
        balanceIn: 0.01541274,
        balanceOut: 0,
        // note: this newBalance is the total BTC LA has
        newBalance: 0.04623822,

        event: 'cancel',
        txid: 'cancel:4ae54ea7-0afd-4490-b0b3-b93378dafad5',
        time: 1538519485998
    },

    // cancel ask LTC_BTC
    { 
        account: 'mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK',
        orderId: '06ee372d-0e7f-4bfe-b405-d85fd4cbc1ab',
        orderInfo:
            { account: 'mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK',
                market: 'LTC_BTC',
                orderId: '06ee372d-0e7f-4bfe-b405-d85fd4cbc1ab',
                amountQuote: '-2.01024441',
                rate: '0.00912700',
                type: 'ask',
                owner: 'liquidityAgent',
                coinIn: 'LTC',
                coinOut: 'BTC',
                coinFunding: 'LTC',
                LTC: '201024441',
                price: '0.00912700',
                quantity: '-2.01024441' },
        cancel: 'true',
        balanceIn: 2.01024441,
        balanceOut: 0,
        newBalance: 2.01024441,
        event: 'cancel',
        txid: 'cancel:06ee372d-0e7f-4bfe-b405-d85fd4cbc1ab',
        time: 1538519486002
    },

    // submit bid LTC_BTC
    { realm: 'arbiter',
        event: 'submit',
        txid: '26d64b61-2ce8-4c0d-8f4d-65ab1b648839',
        time: 1539019362106,
        account: 'mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK',
        market: 'LTC_BTC',
        orderId: '26d64b61-2ce8-4c0d-8f4d-65ab1b648839',
        quantity: 0.013997036638400002, // btc amount
        rate: '0.00888500',
        type: 'bid',
        coinIn: 'BTC',
        coinOut: 'LTC',
        coinFunding: 'BTC',
        debit:
            { realm: 'arbiter',
                account: 'mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK',
                coin: 'BTC',
                amount: 0.013997036638400002 },
        credit:
            { realm: 'arbiter',
                account: '26d64b61-2ce8-4c0d-8f4d-65ab1b648839',
                coin: 'BTC',
                amount: 0.013997036638400002 },
        newBalanceAccount: 0.05558169,
        newBalanceOrder: 252644
    },
    // submit ask LTC_BTC
    { 
        realm: 'arbiter',
        event: 'submit',
        txid: '02d34acb-a51e-405c-8d47-5f69fbeb2bf5',
        time: 1539199883469,
        account: 'mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK',
        market: 'LTC_BTC',
        orderId: '02d34acb-a51e-405c-8d47-5f69fbeb2bf5',
        quantity: '8.07900004',
        rate: '0.00879200',
        type: 'ask',
        coinIn: 'LTC',
        coinOut: 'BTC',
        coinFunding: 'LTC',
        debit: 
            { realm: 'arbiter',
            account: 'mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK',
            coin: 'LTC',
            amount: 8.07900004 },
        credit: 
            { realm: 'arbiter',
            account: '02d34acb-a51e-405c-8d47-5f69fbeb2bf5',
            coin: 'LTC',
            amount: 8.07900004 },
        newBalanceAccount: 0,
        newBalanceOrder: 807900004 
    },


    // deposit BTC
    { 
        account: 'mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK',
        time: 1539203954865,
        custodial: true,
        event: 'deposits',
        txid: 'fc30a341e44c6aea6f434201ef94c83f1c8d0fdf02ec837abf78c383a1417079',
        value: 0.01,
        coin: 'BTC',
        address: 'mgNeWASnhrpFqhM2h8ftunmY1cGCsEGJWd',
        txInfo: 
        { value: 0.01,
        n: 1,
        scriptPubKey: 
            { asm: 'OP_DUP OP_HASH160 0965f25d11183a8fdf4f906b93410247fbceac90 OP_EQUALVERIFY OP_CHECKSIG',
            hex: '76a9140965f25d11183a8fdf4f906b93410247fbceac9088ac',
            reqSigs: 1,
            type: 'pubkeyhash',
            addresses: [Array] },
        txid: 'fc30a341e44c6aea6f434201ef94c83f1c8d0fdf02ec837abf78c383a1417079',
        coin: 'btc',
        account: 'mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK',
        _id: '5bbe6372931bfac4fb2c7401' },
        addressInfo: 
        { address: 'mgNeWASnhrpFqhM2h8ftunmY1cGCsEGJWd',
        iswatchonly: 'false',
        hdkeypath: 'm/0\'/0\'/6851\'',
        agent: 'true',
        isscript: 'false',
        account: 'mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK',
        hdmasterkeyid: '9dfa81dd7c928648ab6ebd4f0c64ef842e4382e1',
        scriptPubKey: '76a9140965f25d11183a8fdf4f906b93410247fbceac9088ac',
        timestamp: '1519170348',
        pubkey: '02aa2e4fca48b4961ed7d7b994c892594992298c23fd3e6ba3513106347579e6ba',
        isvalid: 'true',
        ismine: 'true',
        iscompressed: 'true' },
        _id: '5bbe6372931bfac4fb2c7400',
        newBalance: 0.05980697 
    },

    // withdraw BTC
    { 
        account: 'mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK',
        coin: 'BTC',
        address: '2MsovWqEKzJ5orh5mTFLmVRUMqm9bE7aWQp',
        amount: '0.02',
        event: 'debits',
        withdrawalId: '5437f5fb-a8a3-4ca0-b1fe-a20a90382668',
        newBalance: 0.03980697,
        txidOut: '1b2a00e41c962d999ae1b131c09f79a1ac5effb310c09979bf1fd54d56d09e00' 
    },

    //trade bid, received LTC with BTC
    { market: 'LTC_BTC',
        orderId: '35b9833b-96da-44de-9101-df2522a0254c',
        event: 'trade',
        time: 1538595079558,
        type: 'bid',
        quantity: 0.01,
        price: '0.00881500'
    },

    //trade ask, received BTC with LTC
    { market: 'LTC_BTC',
        orderId: 'a4674de9-0eb8-427b-b4fe-13cf7a77ea2e',
        event: 'trade',
        time: 1538595079558,
        type: 'ask',
        quantity: 0.01,
        price: '0.00881500'
    },



    // debits BTC
    { 
        account: 'mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK',
        coin: 'BTC',
        address: '2MsovWqEKzJ5orh5mTFLmVRUMqm9bE7aWQp',
        amount: '0.02',
        event: 'debits',
        withdrawalId: '5437f5fb-a8a3-4ca0-b1fe-a20a90382668',
        newBalance: 0.03980697,
        txidOut: '1b2a00e41c962d999ae1b131c09f79a1ac5effb310c09979bf1fd54d56d09e00' 
    },

    // debits eth
    { account: 'mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK',
        coin: 'ETH',
        address: 'FAKE7dc2b3ee-ba90-4184-b28c-888551f999b6',
        amount: '0.1',
        event: 'debits',
        withdrawalId: 'a1f5fe1d-3731-48ad-87a5-e999a97f20e5',
        newBalance: 0.9,
        txidOut: 'Thisisafaketxidbroe4c5c777-a8d7-48aa-86d6-e9b835ce0f1e'
    },

    // deposit LTC
    { 
        account: 'mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK',
        time: 1539203974153,
        custodial: true,
        event: 'deposits',
        txid: 'ba5055ea181502bcfbf33e1e99f0270e82415832558455705b332748b6ee1280',
        value: 1,
        coin: 'LTC',
        address: 'mn7Jz8MF5ybFZUHfHuYCXZjP5j22CBC9cJ',
        txInfo: 
        { value: 1,
        n: 0,
        scriptPubKey: 
            { asm: 'OP_DUP OP_HASH160 48502b5847277da2afc453c99d07c857daad08f7 OP_EQUALVERIFY OP_CHECKSIG',
            hex: '76a91448502b5847277da2afc453c99d07c857daad08f788ac',
            reqSigs: 1,
            type: 'pubkeyhash',
            addresses: [Array] },
        txid: 'ba5055ea181502bcfbf33e1e99f0270e82415832558455705b332748b6ee1280',
        coin: 'ltc',
        account: 'mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK',
        _id: '5bbe6386931bfac4fb2c7403' },
        addressInfo: 
        { address: 'mn7Jz8MF5ybFZUHfHuYCXZjP5j22CBC9cJ',
        iswatchonly: 'false',
        hdkeypath: 'm/0\'/0\'/1039\'',
        agent: 'true',
        isscript: 'false',
        account: 'mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK',
        hdmasterkeyid: '87e4bade9770e488d26cb6369f84a4b0a78f71d7',
        scriptPubKey: '76a91448502b5847277da2afc453c99d07c857daad08f788ac',
        timestamp: '1525732566',
        pubkey: '033d50ce72e18bf00bca1d3615aa78b1e1758b87c0681b452b3a28278ed6a4a178',
        isvalid: 'true',
        ismine: 'true',
        iscompressed: 'true' },
        _id: '5bbe6386931bfac4fb2c7402',
        newBalance: 1 
    },

    // deposit eth
    { 
        account: 'mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK',
        custodial: true,
        time: 1539204000859,
        event: 'deposits',
        txid: 'Thisisafaketxidbro04b3600a-9f9c-4ade-bccd-850e14c9cbd5',
        value: '2',
        coin: 'ETH',
        address: 'FAKEa139a7b1-8e2a-4d58-bdca-ae7b0d789085',
        txInfo: 
            { coin: 'ETH',
                value: '2',
                to: 'FAKEa139a7b1-8e2a-4d58-bdca-ae7b0d789085',
                fee: '0.001',
                from: '0x33b35c665496bA8E71B22373843376740401F106',
                txid: 'Thisisafaketxidbro04b3600a-9f9c-4ade-bccd-850e14c9cbd5',
                account: 'mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK',
                _id: '5bbe63a0931bfac4fb2c7407' },
            addressInfo: 
            { agent: 'true',
                isscript: 'false',
                hdmasterkeyid: '971c341b615edb6342990a8e456d557d33f3bd86',
                account: 'mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK',
                scriptPubKey: '76a914eb2608abe4c100d501e3556d5630988b3c6c723e88ac',
                address: 'n2xJemqwi4nKDVUDqnzZmWx1zAjBN75w6Z',
                hdkeypath: 'm/0\'/0\'/2021\'',
                timestamp: '1526065775',
                iswitness: 'false',
                pubkey: '03c9e6459b7077c89168b41aeb3d65b83aa67b05a770bb63dd0e6e801f19ed6cdc',
                isvalid: 'true',
                iswatchonly: 'false',
                ismine: 'true',
                iscompressed: 'true' },
        _id: '5bbe63a0931bfac4fb2c7406',
        newBalance: 2.9 
    },
    // withdraw eth
    { 
        account: 'mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK',
        coin: 'ETH',
        address: 'FAKE6c1d5476-89dd-4eed-8f90-663df804e70f',
        amount: '0.5',
        event: 'debits',
        withdrawalId: '421b8a52-ce7e-43a3-b04c-5c65c853ee82',
        newBalance: 2.4,
        txidOut: 'Thisisafaketxidbro94840fb7-feac-4c33-9378-a19b49b7f3c5' 
    },

    // deposit GNT
    { 
        account: 'mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK',
        custodial: true,
        time: 1539204013053,
        event: 'deposits',
        txid: 'Thisisafaketxidbro74f2bd2d-1b69-4a4b-8ed0-39a19522a74e',
        value: '20',
        coin: 'GNT',
        address: 'FAKE8e10c382-16b4-4703-87f9-94808deb9edc',
        txInfo: 
        { coin: 'GNT',
        value: '20',
        to: 'FAKE8e10c382-16b4-4703-87f9-94808deb9edc',
        fee: '0.001',
        from: '0x33b35c665496bA8E71B22373843376740401F106',
        txid: 'Thisisafaketxidbro74f2bd2d-1b69-4a4b-8ed0-39a19522a74e',
        account: 'mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK',
        _id: '5bbe63ad931bfac4fb2c7409' },
        addressInfo: 
        { agent: 'true',
        isscript: 'false',
        hdmasterkeyid: '971c341b615edb6342990a8e456d557d33f3bd86',
        account: 'mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK',
        scriptPubKey: '76a914eb2608abe4c100d501e3556d5630988b3c6c723e88ac',
        address: 'n2xJemqwi4nKDVUDqnzZmWx1zAjBN75w6Z',
        hdkeypath: 'm/0\'/0\'/2021\'',
        timestamp: '1526065775',
        iswitness: 'false',
        pubkey: '03c9e6459b7077c89168b41aeb3d65b83aa67b05a770bb63dd0e6e801f19ed6cdc',
        isvalid: 'true',
        iswatchonly: 'false',
        ismine: 'true',
        iscompressed: 'true' },
        _id: '5bbe63ad931bfac4fb2c7408',
        newBalance: 320 
    },

    // withdraw GNT
    { 
        account: 'mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK',
        coin: 'GNT',
        address: 'FAKEc9097119-b66d-41ac-b216-85e3701d9217',
        amount: '5',
        event: 'debits',
        withdrawalId: 'a281a153-a3e3-44b0-a653-4ff456e3a93b',
        newBalance: 315,
        txidOut: 'Thisisafaketxidbro994b79cc-2e50-40ce-af2c-a7ea62389fdb' 
    },
    
    // matching in LTC_BTC
    { engine: 'LTC_BTC',
        time: 1539383528313,
        restingOrder: 
        { id: 'c5653524-39b7-4083-9da2-748975df76f8',
            price: '0.00851000',
            quantity: 0.9,
            status: 'Working',
            isBuy: false },
        aggressiveOrder: 
        { id: '1361b427-4258-4a37-81bb-7e32785ce366',
            price: '0.012126',
            quantity: 0,
            status: 'complete',
            isBuy: true },
        restingOrderPrice: '0.00851000',
        matchQuantity: 0.1,
        event: 'match',
        balances: 
        { summary: 
            [ 'event: 1539383528313 order: 1361b427-4258-4a37-81bb-7e32785ce366 bought 0.000851 (LTC) at 0.00851000',
                'event: 1539383528313 order: c5653524-39b7-4083-9da2-748975df76f8 sold 0.1 (LTC) at 0.00851000' ],
            balanceResting: 
            { id: 'c5653524-39b7-4083-9da2-748975df76f8',
                LTC: 90000000,
                BTC: 85100 },
            balanceAggresive: 
            { id: '1361b427-4258-4a37-81bb-7e32785ce366',
                LTC: 10000000,
                BTC: 36160 } },
        restingInfoVerbose: 
        { account: 'mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK',
            market: 'LTC_BTC',
            orderId: 'c5653524-39b7-4083-9da2-748975df76f8',
            amountQuote: '-1',
            rate: '0.00851000',
            type: 'ask',
            owner: 'liquidityAgent',
            coinIn: 'LTC',
            coinOut: 'BTC',
            coinFunding: 'LTC',
            LTC: '90000000',
            price: '0.00851000',
            quantity: '-1',
            BTC: '85100' },
        aggessiveInfoVerbose: 
        { account: 'mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK',
            market: 'LTC_BTC',
            orderId: '1361b427-4258-4a37-81bb-7e32785ce366',
            amountQuote: '0.0012126',
            rate: '0.012126',
            type: 'bid',
            owner: 'liquidityAgent',
            coinIn: 'BTC',
            coinOut: 'LTC',
            coinFunding: 'BTC',
            BTC: '36160',
            price: '0.012126',
            quantity: '0.1',
            LTC: '10000000' },
        resultOrderBalanceLAAggressive: 0,
        resultAccountBalanceLAAggressive: { coin: 'LTC', resultAccountBalanceLA: 90000000 },
        resultOrderBalanceLAResting: 0,
        resultAccountBalanceLAResting: { coin: 'BTC', resultAccountBalanceLA: 100000813 },
        market: 'LTC_BTC' 
    }, 

    // submit bid ETH_BTC
    { 
        realm: 'arbiter',
        event: 'submit',
        txid: '77bf6d08-b70c-4fdc-b0f2-e4d5c8e71c2d',
        time: 1539645302097,
        account: 'mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK',
        market: 'ETH_BTC',
        orderId: '77bf6d08-b70c-4fdc-b0f2-e4d5c8e71c2d',
        quantity: 0.0028354184082,
        rate: '0.03168500',
        type: 'bid',
        coinIn: 'BTC',
        coinOut: 'ETH',
        coinFunding: 'BTC',
        debit: 
        { realm: 'arbiter',
        account: 'mrKpS83rotErnLApXs3h1z6GcHcRjzU4TK',
        coin: 'BTC',
        amount: 0.0028354184082 },
        credit: 
        { realm: 'arbiter',
        account: '77bf6d08-b70c-4fdc-b0f2-e4d5c8e71c2d',
        coin: 'BTC',
        amount: 0.0028354184082 },
        newBalanceAccount: 0.06237922,
        newBalanceOrder: 283541 
    }

    // submit bid

]

describe('coinBal for rebalancing BTC', () => {
    test('main logic', () =>
    {
        events.forEach(event => {
            if(event.event == 'trade')
                publisher.publish("trade", JSON.stringify(event))

            if(event.event == 'debits')
                publisher.publish("debits", JSON.stringify(event))

            if(event.event == 'deposits')
                publisher.publish("arbiterLa", JSON.stringify(event))

            if(event.event == 'submit')
                publisher.publish("arbiterLa", JSON.stringify(event))


            if(event.event == 'cancel')
                publisher.publish("arbiterLa", JSON.stringify(event))

            if(event.event == 'match')
                publisher.publish("match", JSON.stringify(event))

            else 
                publisher.publish('arbiterLa', JSON.stringify(event))

        })
    })
})

// describe('coinBal for rebalancing BTC', () => {
//     test(' coinBal starts up, it get balance for all coins', async () =>
//     {
        
//         let laCoinBalances = await redis.hgetall('laCoinBalances')

//         let laBtcPerMarketBalances = await redis.hgetall('laBtcPerMarketBalances')

//         console.log('laCoinBalances', laCoinBalances)

//         console.log('laBtcPerMarketBalances', laBtcPerMarketBalances)

        
//     })
// })