module.exports = require("protobufjs").newBuilder({})["import"]({
    "package": null,
    "messages": [
        {
            "name": "ExchangeAddress",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "coin_type",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "address",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "dest_tag",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "string",
                    "name": "rs_address",
                    "id": 4
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "ExchangeResponse",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "ExchangeAddress",
                    "name": "deposit_address",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "deposit_amount",
                    "id": 2
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "int64",
                    "name": "expiration",
                    "id": 3
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "quoted_rate",
                    "id": 4
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "ExchangeAddress",
                    "name": "withdrawal_address",
                    "id": 5
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "withdrawal_amount",
                    "id": 6
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "ExchangeAddress",
                    "name": "return_address",
                    "id": 7
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "api_key",
                    "id": 8
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "miner_fee",
                    "id": 9
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "order_id",
                    "id": 10
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        },
        {
            "name": "SignedExchangeResponse",
            "fields": [
                {
                    "rule": "optional",
                    "options": {},
                    "type": "ExchangeResponse",
                    "name": "response",
                    "id": 1
                },
                {
                    "rule": "optional",
                    "options": {},
                    "type": "bytes",
                    "name": "signature",
                    "id": 2
                }
            ],
            "enums": [],
            "messages": [],
            "options": {},
            "oneofs": {}
        }
    ],
    "enums": [],
    "imports": [],
    "options": {
        "java_package": "com.keepkey.device-protocol",
        "java_outer_classname": "KeepKeyExchange"
    },
    "services": []
}).build();
