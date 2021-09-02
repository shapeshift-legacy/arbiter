/*

    Rules modules

    send to customer is valid
      * node is healthy (TODO depends on MOCKS)
      * is on chain (TODO depends on MOCKS)

      * is amount expected
      * is customers address

    sweep tx is valid
      * is customers input
      * is a valid tx (not a double spend)
      * is amount expected
      * is to arbiters hot address

 */

/*
  arbiter info

  { coinOut: 'LTC',
  pubkeyOracle: '02550fca42ecd57e47b25da468a96bdf6dde7034f1446b14b1c7498fd787a5e98d',
  userkey: '0303057bd6eb652315fc382ebdc04825a02267cf77eac06ceda8683808511fec94',
  quantity: '0.01',
  price: '0.01',
  amountIn: '0.001',
  BTC: '100000',
  timeCreation: '1533580658488',
  pubkeyArbiter: '039cafeab2a2c87c498aec334a060c8033256dad532be50a8831e8cacf03d42d58',
  txidIn: '8368b97cf7d1bce8039c5683f5ac66c2a3fadf3d57aa640dd31333d732056980',
  depositAddress: '2MxoeAiBTFpq5u4D5Sd2QPMAVj7zSopNozR',
  owner: 'customer',
  rate: '0.01',
  status: 'live',
  orderId: 'dab6d28b-add7-4fd7-acd4-47c5de27c66d',
  signingAddress: 'mgeWf3udvKDhF6ndr8dXBpnUHKSWCUEBCx',
  coin: '1',
  returnAddress: 'mr2bSjoXNTZDuBSGgQ3r7yrKVKCY3E2WKG',
  coinIn: 'BTC',
  arbiterPubKey: '039cafeab2a2c87c498aec334a060c8033256dad532be50a8831e8cacf03d42d58',
  expiration: '1533580670488',
  withdrawalAddress: 'mtRBXGu5ZxpqqxbwGzENANPLPcbQA28ava',
  amountOut: '0.1',
  account: 'mgeWf3udvKDhF6ndr8dXBpnUHKSWCUEBCx',
  market: 'LTC_BTC',
  return: 'true' }

  local info

  { coinOut: 'LTC',
  pubkeyOracle: '02550fca42ecd57e47b25da468a96bdf6dde7034f1446b14b1c7498fd787a5e98d',
  userkey: '0303057bd6eb652315fc382ebdc04825a02267cf77eac06ceda8683808511fec94',
  quantity: '0.01',
  price: '0.01',
  amountIn: '0.001',
  BTC: '100000',
  timeCreation: '1533580658488',
  pubkeyArbiter: '039cafeab2a2c87c498aec334a060c8033256dad532be50a8831e8cacf03d42d58',
  txidIn: '8368b97cf7d1bce8039c5683f5ac66c2a3fadf3d57aa640dd31333d732056980',
  depositAddress: '2MxoeAiBTFpq5u4D5Sd2QPMAVj7zSopNozR',
  owner: 'customer',
  rate: '0.01',
  status: 'live',
  orderId: 'dab6d28b-add7-4fd7-acd4-47c5de27c66d',
  signingAddress: 'mgeWf3udvKDhF6ndr8dXBpnUHKSWCUEBCx',
  coin: '1',
  returnAddress: 'mr2bSjoXNTZDuBSGgQ3r7yrKVKCY3E2WKG',
  coinIn: 'BTC',
  arbiterPubKey: '039cafeab2a2c87c498aec334a060c8033256dad532be50a8831e8cacf03d42d58',
  expiration: '1533580670488',
  withdrawalAddress: 'mtRBXGu5ZxpqqxbwGzENANPLPcbQA28ava',
  amountOut: '0.1',
  account: 'mgeWf3udvKDhF6ndr8dXBpnUHKSWCUEBCx',
  market: 'LTC_BTC' }


  tx info
    {
      "txid": "d93ae309dac25dc842f1c868adc5ae9646dbf4958438645c15f5dccb3ec642f3",
      "hash": "d93ae309dac25dc842f1c868adc5ae9646dbf4958438645c15f5dccb3ec642f3",
      "size": 223,
      "vsize": 223,
      "version": 2,
      "locktime": 1462944,
      "vin": [
        {
          "txid": "0427d057f92e07a18a80f606586b6aa520c0aafc1e86ed45f48e9b4c128f5413",
          "vout": 1,
          "scriptSig": {
            "asm": "304402203591b88c4deb502759b99155d32108f83a84f8d4065d2ac633ff837b2458542902202cb614196b1169cd22cd0d1a1d62b054903d8096f5aa74c706010377d465bf40[ALL] 029b87a0d76f8d9114d76c09a25d49f140072d29d9efd68c4575c5baf219e3478f",
            "hex": "47304402203591b88c4deb502759b99155d32108f83a84f8d4065d2ac633ff837b2458542902202cb614196b1169cd22cd0d1a1d62b054903d8096f5aa74c706010377d465bf400121029b87a0d76f8d9114d76c09a25d49f140072d29d9efd68c4575c5baf219e3478f"
          },
          "sequence": 4294967294
        }
      ],
      "vout": [
        {
          "value": 0.33910400,
          "n": 0,
          "scriptPubKey": {
            "asm": "OP_DUP OP_HASH160 f3e593c8df18c8e0b69f94c64a449a913f757e06 OP_EQUALVERIFY OP_CHECKSIG",
            "hex": "76a914f3e593c8df18c8e0b69f94c64a449a913f757e0688ac",
            "reqSigs": 1,
            "type": "pubkeyhash",
            "addresses": [
              "LhTZV8uZCnMS1dmagLfx3u7EhRPT7Jhoko"
            ]
          }
        },
        {
          "value": 0.04000000,
          "n": 1,
          "scriptPubKey": {
            "asm": "OP_HASH160 ed388082ca60a9a6fed3ab78591dada07535ad4a OP_EQUAL",
            "hex": "a914ed388082ca60a9a6fed3ab78591dada07535ad4a87",
            "reqSigs": 1,
            "type": "scripthash",
            "addresses": [
              "MVXU4ioKjc9ov3wG9S3YQsd9ps4vNjtCGf"
            ]
          }
        }
      ]
    }


 */
require('dotenv').config();

const rules = require('../modules/rules')

describe(' | Rules module tests | ', () => {


    let fullfillmentInfo = {
        "txid": "d912ce85f57ad424fb7710d3cce45545e6de0e1aee46c88411bdb55df3269220",
        "hash": "4c0e954e521447c8bc7a756de7eded3cb77fc233d47d32ab6ca2ba31cad9e868",
        "version": 2,
        "size": 590,
        "vsize": 347,
        "locktime": 794999,
        "vin": [
            {
                "txid": "c16318be3b5cafd79852e514333b36a171707673f8d84ff0af8a684917c61545",
                "vout": 1,
                "scriptSig": {
                    "asm": "0014c28bb593bf46492163e8defea0df9d76a2d29811",
                    "hex": "160014c28bb593bf46492163e8defea0df9d76a2d29811"
                },
                "txinwitness": [
                    "3044022052973eea116dab74be21fe676d796566e17fbc307d5e119168d5c0d0811daa570220673a7fbe255e905c6aab888e031f33103852cfe8568f6bba0d273b1e91f14e4701",
                    "0308ab0e385297d029677d79be763e0410284f471e178d138e215e3a5022766e64"
                ],
                "sequence": 4294967294
            },
            {
                "txid": "0ecb770597ee530854723a23255af8f63b11f1aab02a2281895a2f2b16c9726b",
                "vout": 1,
                "scriptSig": {
                    "asm": "00144841f63498953299439dba266a86944ff92252e5",
                    "hex": "1600144841f63498953299439dba266a86944ff92252e5"
                },
                "txinwitness": [
                    "3045022100fc1853397664924ec8453da123549b64620324cadf23adacf1a2a3779517f3690220141df2a90b8adbc2ec5bc1785513915d73e69515590ed53d76f9750c068d15f101",
                    "034621a7c8888f83889a99fedde88fc66598f44326ed0de24d27c8f69d49dc48b3"
                ],
                "sequence": 4294967294
            },
            {
                "txid": "72cf32eebe72e423c72626516c4856c5b3047b60d0a1176d47c2d3f9e3cf037e",
                "vout": 1,
                "scriptSig": {
                    "asm": "0014d3385dee08cb47bd48368f647fead3562dbc42ae",
                    "hex": "160014d3385dee08cb47bd48368f647fead3562dbc42ae"
                },
                "txinwitness": [
                    "30440220693afc830a41b5c8dc79a2a564c72d2e82ba06d2db75ddf658e9d872f03d5b2402203d9140b0ec1c35947f1d266bc9217c8d199901a2979003316be2d20e03373dce01",
                    "0363fd2eb620601a0d6accda0af51516f09336ba5246f73c8c876f11b74a1469a1"
                ],
                "sequence": 4294967294
            }
        ],
        "vout": [
            {
                "value": 0.02325581,
                "n": 0,
                "scriptPubKey": {
                    "asm": "OP_HASH160 5ff92c821426daae9dcc4e4f92d0ee7e45211c26 OP_EQUAL",
                    "hex": "a9145ff92c821426daae9dcc4e4f92d0ee7e45211c2687",
                    "reqSigs": 1,
                    "type": "scripthash",
                    "addresses": [
                        "QVMSoRfZy478ZEqbeRMboGfZpPuhfR21jn"
                    ]
                }
            },
            {
                "value": 0.01276108,
                "n": 1,
                "scriptPubKey": {
                    "asm": "OP_HASH160 c41953b1ba16c75dac330ba3d3098b35500b92f6 OP_EQUAL",
                    "hex": "a914c41953b1ba16c75dac330ba3d3098b35500b92f687",
                    "reqSigs": 1,
                    "type": "scripthash",
                    "addresses": [
                        "QeUrteHTqK2FggR7P1Bt5uAoi6os2CKrJa"
                    ]
                }
            }
        ]
    }

    let orderInfo = {
        coinOut: 'LTC',
        averageRate: '0.04300000731000125',
        status: 'complete',
        quantity: '0.043',
        depositAddress: '2N9pKeBrpYBKWtDafiFxA72dyLdvVWzBSDe',
        txidOut:
         'd912ce85f57ad424fb7710d3cce45545e6de0e1aee46c88411bdb55df3269220',
        pubkeyOracle:
         '023363b8fb4669db6bef0b57743701af070a80b9fa1edd92c131e663bf6eba979c',
        timeCreation: '1539209753980',
        expiration: '1539221753980',
        owner: 'customer',
        txidIn:
         '6980338576ce4f8ee1eb7e6d4c8bfea6deede16701be6d7c51d8ce35a8e48088',
        coin: '1',
        market: 'LTC_BTC',
        withdrawalAddress: 'QVMSoRfZy478ZEqbeRMboGfZpPuhfR21jn',
        amountOutMin: '0.023254809999999997',
        amountIn: '0.001',
        orderId: 'f8bfc6db-d2ab-4a5f-a8cb-0bd575d5393a',
        LTC: '2325581',
        amountOut: '0.02325581',
        partial: 'true',
        BTC: '79528',
        price: '0.043',
        rate: '0.043',
        signingAddress: 'mgeWf3udvKDhF6ndr8dXBpnUHKSWCUEBCx',
        pubkeyArbiter:
         '027c399d8171628d4c02d6671f2854a9dd0e1914055daeb5c945ed8385dcce45c5',
        arbiterPubKey:
         '027c399d8171628d4c02d6671f2854a9dd0e1914055daeb5c945ed8385dcce45c5',
        returnAddress: 'mq9p6ZVv7xZTDgSW6WAbuvzRwsL9EG78Fj',
        coinIn: 'BTC',
        userkey:
         '02e94021a91231d339886fdb942df8b29ee4a542801ca00d4ff193fd9d8b4f0476',
        account: 'mgeWf3udvKDhF6ndr8dXBpnUHKSWCUEBCx',
        return: 'true'
    }



    test(' Rules accept valid tx input ', () => {
        //peers

        let isValid = rules.validateFullfillment(fullfillmentInfo,orderInfo)
        expect(isValid).toEqual(true)

    })


    let fullfillmentInfo2 = {
        "txid": "d912ce85f57ad424fb7710d3cce45545e6de0e1aee46c88411bdb55df3269220",
        "hash": "4c0e954e521447c8bc7a756de7eded3cb77fc233d47d32ab6ca2ba31cad9e868",
        "version": 2,
        "size": 590,
        "vsize": 347,
        "locktime": 794999,
        "vin": [
            {
                "txid": "c16318be3b5cafd79852e514333b36a171707673f8d84ff0af8a684917c61545",
                "vout": 1,
                "scriptSig": {
                    "asm": "0014c28bb593bf46492163e8defea0df9d76a2d29811",
                    "hex": "160014c28bb593bf46492163e8defea0df9d76a2d29811"
                },
                "txinwitness": [
                    "3044022052973eea116dab74be21fe676d796566e17fbc307d5e119168d5c0d0811daa570220673a7fbe255e905c6aab888e031f33103852cfe8568f6bba0d273b1e91f14e4701",
                    "0308ab0e385297d029677d79be763e0410284f471e178d138e215e3a5022766e64"
                ],
                "sequence": 4294967294
            },
            {
                "txid": "0ecb770597ee530854723a23255af8f63b11f1aab02a2281895a2f2b16c9726b",
                "vout": 1,
                "scriptSig": {
                    "asm": "00144841f63498953299439dba266a86944ff92252e5",
                    "hex": "1600144841f63498953299439dba266a86944ff92252e5"
                },
                "txinwitness": [
                    "3045022100fc1853397664924ec8453da123549b64620324cadf23adacf1a2a3779517f3690220141df2a90b8adbc2ec5bc1785513915d73e69515590ed53d76f9750c068d15f101",
                    "034621a7c8888f83889a99fedde88fc66598f44326ed0de24d27c8f69d49dc48b3"
                ],
                "sequence": 4294967294
            },
            {
                "txid": "72cf32eebe72e423c72626516c4856c5b3047b60d0a1176d47c2d3f9e3cf037e",
                "vout": 1,
                "scriptSig": {
                    "asm": "0014d3385dee08cb47bd48368f647fead3562dbc42ae",
                    "hex": "160014d3385dee08cb47bd48368f647fead3562dbc42ae"
                },
                "txinwitness": [
                    "30440220693afc830a41b5c8dc79a2a564c72d2e82ba06d2db75ddf658e9d872f03d5b2402203d9140b0ec1c35947f1d266bc9217c8d199901a2979003316be2d20e03373dce01",
                    "0363fd2eb620601a0d6accda0af51516f09336ba5246f73c8c876f11b74a1469a1"
                ],
                "sequence": 4294967294
            }
        ],
        "vout": [
            {
                "value": 0.02325581,
                "n": 0,
                "scriptPubKey": {
                    "asm": "OP_HASH160 5ff92c821426daae9dcc4e4f92d0ee7e45211c26 OP_EQUAL",
                    "hex": "a9145ff92c821426daae9dcc4e4f92d0ee7e45211c2687",
                    "reqSigs": 1,
                    "type": "scripthash",
                    "addresses": [
                        "QVMSoRfZy478ZEqbeRMboGfZpPuhfR21jn"
                    ]
                }
            },
            {
                "value": 0.01276108,
                "n": 1,
                "scriptPubKey": {
                    "asm": "OP_HASH160 c41953b1ba16c75dac330ba3d3098b35500b92f6 OP_EQUAL",
                    "hex": "a914c41953b1ba16c75dac330ba3d3098b35500b92f687",
                    "reqSigs": 1,
                    "type": "scripthash",
                    "addresses": [
                        "QeUrteHTqK2FggR7P1Bt5uAoi6os2CKrJa"
                    ]
                }
            }
        ]
    }

    let orderInfo2 = {
        coinOut: 'LTC',
        averageRate: '0.04300000731000125',
        status: 'complete',
        quantity: '0.043',
        depositAddress: '2N9pKeBrpYBKWtDafiFxA72dyLdvVWzBSDe',
        txidOut:
            'd912ce85f57ad424fb7710d3cce45545e6de0e1aee46c88411bdb55df3269220',
        pubkeyOracle:
            '023363b8fb4669db6bef0b57743701af070a80b9fa1edd92c131e663bf6eba979c',
        timeCreation: '1539209753980',
        expiration: '1539221753980',
        owner: 'customer',
        txidIn:
            '6980338576ce4f8ee1eb7e6d4c8bfea6deede16701be6d7c51d8ce35a8e48088',
        coin: '1',
        market: 'LTC_BTC',
        withdrawalAddress: 'QVMSoRfZy478ZEqbeRMboGfZpPuhfR21jnA',
        amountOutMin: '0.023254809999999997',
        amountIn: '0.001',
        orderId: 'f8bfc6db-d2ab-4a5f-a8cb-0bd575d5393a',
        LTC: '2325581',
        amountOut: '0.02325581',
        partial: 'true',
        BTC: '79528',
        price: '0.043',
        rate: '0.043',
        signingAddress: 'mgeWf3udvKDhF6ndr8dXBpnUHKSWCUEBCx',
        pubkeyArbiter:
            '027c399d8171628d4c02d6671f2854a9dd0e1914055daeb5c945ed8385dcce45c5',
        arbiterPubKey:
            '027c399d8171628d4c02d6671f2854a9dd0e1914055daeb5c945ed8385dcce45c5',
        returnAddress: 'mq9p6ZVv7xZTDgSW6WAbuvzRwsL9EG78Fj',
        coinIn: 'BTC',
        userkey:
            '02e94021a91231d339886fdb942df8b29ee4a542801ca00d4ff193fd9d8b4f0476',
        account: 'mgeWf3udvKDhF6ndr8dXBpnUHKSWCUEBCx',
        return: 'true'
    }



    test(' Rules accepts reject invalid address ', () => {
        //peers
        let isValid = rules.validateFullfillment(fullfillmentInfo2,orderInfo2)
        expect(isValid).toEqual(false)

    })


    let fullfillmentInfo3 = {
        "txid": "d912ce85f57ad424fb7710d3cce45545e6de0e1aee46c88411bdb55df3269220",
        "hash": "4c0e954e521447c8bc7a756de7eded3cb77fc233d47d32ab6ca2ba31cad9e868",
        "version": 2,
        "size": 590,
        "vsize": 347,
        "locktime": 794999,
        "vin": [
            {
                "txid": "c16318be3b5cafd79852e514333b36a171707673f8d84ff0af8a684917c61545",
                "vout": 1,
                "scriptSig": {
                    "asm": "0014c28bb593bf46492163e8defea0df9d76a2d29811",
                    "hex": "160014c28bb593bf46492163e8defea0df9d76a2d29811"
                },
                "txinwitness": [
                    "3044022052973eea116dab74be21fe676d796566e17fbc307d5e119168d5c0d0811daa570220673a7fbe255e905c6aab888e031f33103852cfe8568f6bba0d273b1e91f14e4701",
                    "0308ab0e385297d029677d79be763e0410284f471e178d138e215e3a5022766e64"
                ],
                "sequence": 4294967294
            },
            {
                "txid": "0ecb770597ee530854723a23255af8f63b11f1aab02a2281895a2f2b16c9726b",
                "vout": 1,
                "scriptSig": {
                    "asm": "00144841f63498953299439dba266a86944ff92252e5",
                    "hex": "1600144841f63498953299439dba266a86944ff92252e5"
                },
                "txinwitness": [
                    "3045022100fc1853397664924ec8453da123549b64620324cadf23adacf1a2a3779517f3690220141df2a90b8adbc2ec5bc1785513915d73e69515590ed53d76f9750c068d15f101",
                    "034621a7c8888f83889a99fedde88fc66598f44326ed0de24d27c8f69d49dc48b3"
                ],
                "sequence": 4294967294
            },
            {
                "txid": "72cf32eebe72e423c72626516c4856c5b3047b60d0a1176d47c2d3f9e3cf037e",
                "vout": 1,
                "scriptSig": {
                    "asm": "0014d3385dee08cb47bd48368f647fead3562dbc42ae",
                    "hex": "160014d3385dee08cb47bd48368f647fead3562dbc42ae"
                },
                "txinwitness": [
                    "30440220693afc830a41b5c8dc79a2a564c72d2e82ba06d2db75ddf658e9d872f03d5b2402203d9140b0ec1c35947f1d266bc9217c8d199901a2979003316be2d20e03373dce01",
                    "0363fd2eb620601a0d6accda0af51516f09336ba5246f73c8c876f11b74a1469a1"
                ],
                "sequence": 4294967294
            }
        ],
        "vout": [
            {
                "value": 0.02325581,
                "n": 0,
                "scriptPubKey": {
                    "asm": "OP_HASH160 5ff92c821426daae9dcc4e4f92d0ee7e45211c26 OP_EQUAL",
                    "hex": "a9145ff92c821426daae9dcc4e4f92d0ee7e45211c2687",
                    "reqSigs": 1,
                    "type": "scripthash",
                    "addresses": [
                        "QVMSoRfZy478ZEqbeRMboGfZpPuhfR21jn"
                    ]
                }
            },
            {
                "value": 0.01276108,
                "n": 1,
                "scriptPubKey": {
                    "asm": "OP_HASH160 c41953b1ba16c75dac330ba3d3098b35500b92f6 OP_EQUAL",
                    "hex": "a914c41953b1ba16c75dac330ba3d3098b35500b92f687",
                    "reqSigs": 1,
                    "type": "scripthash",
                    "addresses": [
                        "QeUrteHTqK2FggR7P1Bt5uAoi6os2CKrJa"
                    ]
                }
            }
        ]
    }

    let orderInfo3 = {
        coinOut: 'LTC',
        averageRate: '0.04300000731000125',
        status: 'complete',
        quantity: '0.043',
        depositAddress: '2N9pKeBrpYBKWtDafiFxA72dyLdvVWzBSDe',
        txidOut:
            'd912ce85f57ad424fb7710d3cce45545e6de0e1aee46c88411bdb55df3269220',
        pubkeyOracle:
            '023363b8fb4669db6bef0b57743701af070a80b9fa1edd92c131e663bf6eba979c',
        timeCreation: '1539209753980',
        expiration: '1539221753980',
        owner: 'customer',
        txidIn:
            '6980338576ce4f8ee1eb7e6d4c8bfea6deede16701be6d7c51d8ce35a8e48088',
        coin: '1',
        market: 'LTC_BTC',
        withdrawalAddress: 'QVMSoRfZy478ZEqbeRMboGfZpPuhfR21jn',
        amountOutMin: '0.024254809999999997',
        amountIn: '0.001',
        orderId: 'f8bfc6db-d2ab-4a5f-a8cb-0bd575d5393a',
        LTC: '2325581',
        amountOut: '0.02425581',
        partial: 'true',
        BTC: '79528',
        price: '0.043',
        rate: '0.043',
        signingAddress: 'mgeWf3udvKDhF6ndr8dXBpnUHKSWCUEBCx',
        pubkeyArbiter:
            '027c399d8171628d4c02d6671f2854a9dd0e1914055daeb5c945ed8385dcce45c5',
        arbiterPubKey:
            '027c399d8171628d4c02d6671f2854a9dd0e1914055daeb5c945ed8385dcce45c5',
        returnAddress: 'mq9p6ZVv7xZTDgSW6WAbuvzRwsL9EG78Fj',
        coinIn: 'BTC',
        userkey:
            '02e94021a91231d339886fdb942df8b29ee4a542801ca00d4ff193fd9d8b4f0476',
        account: 'mgeWf3udvKDhF6ndr8dXBpnUHKSWCUEBCx',
        return: 'true'
    }




    test(' Rules reject invalid amount ', () => {
        //peers

        let isValid = rules.validateFullfillment(fullfillmentInfo3,orderInfo3)
        expect(isValid).toEqual(false)

    })

    let sweepTxInfo = {
        "txid": "b9aaf14e9545d59d386af78b636320e59f3dcb4ae09059d500b2738bd0c4e738",
        "hash": "b9aaf14e9545d59d386af78b636320e59f3dcb4ae09059d500b2738bd0c4e738",
        "version": 2,
        "size": 371,
        "vsize": 371,
        "weight": 1484,
        "locktime": 0,
        "vin": [
            {
                "txid": "9ed11436e786940054647d6f855e073d22887d3b8a461e0ca8c257ce62db37de",
                "vout": 1,
                "scriptSig": {
                    "asm": "0 304402203f0799f25258a9b8e7c84d06f03321303dd2cef97e02eefb8c4753cc89fd71f5022024596e151e895de39d6f16ebd64513dc7ce87405c8cc7c2c3889496a4d4c3b54[ALL] 304402200d9b46b750dccadd4d08d3a92aafc8350b5b8f992116724e1163dd689e8c4b130220782debd1f3aa6791468b5d66977fd44a8f7992027a97b323502d8aef8d8146ba[ALL] 522102b546768a3c374d49527d56757d411335abbf417958f577a2b12cf839f99101fb2103b5554b644686da6db264b4d2cfadc278bb9d218e640f517a3fb07508a1b954db21029d296b2a7e7e5dc35e385197355f60784cf2ebc5d87c00e19abc13bfcb3b383753ae",
                    "hex": "0047304402203f0799f25258a9b8e7c84d06f03321303dd2cef97e02eefb8c4753cc89fd71f5022024596e151e895de39d6f16ebd64513dc7ce87405c8cc7c2c3889496a4d4c3b540147304402200d9b46b750dccadd4d08d3a92aafc8350b5b8f992116724e1163dd689e8c4b130220782debd1f3aa6791468b5d66977fd44a8f7992027a97b323502d8aef8d8146ba014c69522102b546768a3c374d49527d56757d411335abbf417958f577a2b12cf839f99101fb2103b5554b644686da6db264b4d2cfadc278bb9d218e640f517a3fb07508a1b954db21029d296b2a7e7e5dc35e385197355f60784cf2ebc5d87c00e19abc13bfcb3b383753ae"
                },
                "sequence": 4294967295
            }
        ],
        "vout": [
            {
                "value": 0.00009248,
                "n": 0,
                "scriptPubKey": {
                    "asm": "OP_DUP OP_HASH160 1c09585cf318297423240061b62c351ede70849b OP_EQUALVERIFY OP_CHECKSIG",
                    "hex": "76a9141c09585cf318297423240061b62c351ede70849b88ac",
                    "reqSigs": 1,
                    "type": "pubkeyhash",
                    "addresses": [
                        "mi5CQjp5Yq2aik4CYQiTdM7nAiN9nZEugp"
                    ]
                }
            },
            {
                "value": 0.00080752,
                "n": 1,
                "scriptPubKey": {
                    "asm": "OP_DUP OP_HASH160 47368cbed7be0d440521f02f97cb674cf6f46638 OP_EQUALVERIFY OP_CHECKSIG",
                    "hex": "76a91447368cbed7be0d440521f02f97cb674cf6f4663888ac",
                    "reqSigs": 1,
                    "type": "pubkeyhash",
                    "addresses": [
                        "mn1Vcrp3o39kLHPtRV3DtTjtUsUsGk5xb4"
                    ]
                }
            }
        ]
    }

    let orderInfo4 = {
        coinOut: 'LTC',
        averageRate: '0.04300000731000125',
        status: 'complete',
        quantity: '0.043',
        depositAddress: '2N9pKeBrpYBKWtDafiFxA72dyLdvVWzBSDe',
        txidOut:
            'd912ce85f57ad424fb7710d3cce45545e6de0e1aee46c88411bdb55df3269220',
        pubkeyOracle:
            '023363b8fb4669db6bef0b57743701af070a80b9fa1edd92c131e663bf6eba979c',
        timeCreation: '1539209753980',
        expiration: '1539221753980',
        owner: 'customer',
        txidIn:
            '6980338576ce4f8ee1eb7e6d4c8bfea6deede16701be6d7c51d8ce35a8e48088',
        coin: '1',
        market: 'LTC_BTC',
        withdrawalAddress: 'QVMSoRfZy478ZEqbeRMboGfZpPuhfR21jn',
        amountOutMin: '0.023254809999999997',
        amountIn: '0.001',
        orderId: 'f8bfc6db-d2ab-4a5f-a8cb-0bd575d5393a',
        LTC: '2325581',
        amountOut: '0.02325581',
        partial: 'true',
        BTC: '79528',
        price: '0.043',
        rate: '0.043',
        signingAddress: 'mgeWf3udvKDhF6ndr8dXBpnUHKSWCUEBCx',
        pubkeyArbiter:
            '027c399d8171628d4c02d6671f2854a9dd0e1914055daeb5c945ed8385dcce45c5',
        arbiterPubKey:
            '027c399d8171628d4c02d6671f2854a9dd0e1914055daeb5c945ed8385dcce45c5',
        returnAddress: 'mq9p6ZVv7xZTDgSW6WAbuvzRwsL9EG78Fj',
        coinIn: 'BTC',
        userkey:
            '02e94021a91231d339886fdb942df8b29ee4a542801ca00d4ff193fd9d8b4f0476',
        account: 'mgeWf3udvKDhF6ndr8dXBpnUHKSWCUEBCx',
        return: 'true'
    }

    //
    test(' Rules accept valid sweep ', () => {
        //
        let isValid = rules.validateSweep(sweepTxInfo,orderInfo4)
        expect(isValid).toEqual(true)

    })
    //
    // test(' Rules reject invalid customer signatures ', () => {
    //     //peers
    //
    //
    // })
    //
    // test(' Rules accept valid arbiter signatures ', () => {
    //     //peers
    //
    //
    // })
    //
    // test(' Rules reject invalid customer signatures ', () => {
    //     //peers
    //
    //
    // })


})
