
if(process.env['NODE_ENV'] === 'staging') {
    module.exports = {

        "bitcoin01": {"currency": "BTC", "currencyName": "bitcoin",
            "daemon": {
                "host": "",
                "port": 19330,
                "user": "",
                "pass": ""
            }
        },
        "litecoin": {"currency": "LTC", "currencyName": "litecoin",
            "daemon": {
                "host": "",
                "port": 19330,
                "user": "",
                "pass": ""
            }
        },
        // "ETH": {"currency": "ETH",
        //     "currencyName": "ether",
        //     "daemon": {"host": "localhost", "port": 8545},
        //     "unlock":""  // password for etherbase account
        // },
        "arb_btc01": {"currency": "BTC", "currencyName": "bitcoin",
            "daemon": {
                "host": "",
                "port": 19330,
                "user": "",
                "pass": ""
            }
        },
        "arb_ltc01": {
            "currency": "LTC", "currencyName": "litecoin",
            "daemon": {
                "host": "",
                "port": 19330,
                "user": "",
                "pass": ""
            }
        }


    }
} else {
    module.exports = {

        "BTC": {"currency": "BTC", "currencyName": "bitcoin",
            "daemon": {
                "host": "localhost",
                "port": 19330,
                "user": "",
                "pass": "%FP"
            }},
        "LTC": {"currency": "LTC", "currencyName": "litecoin",
            "daemon": {
                "host": "localhost",
                "port": 19331,
                "user": "",
                "pass": ""
            }},
        // "ETH": {"currency": "ETH",
        //     "currencyName": "ether",
        //     "daemon": {"host": "localhost", "port": 8545},
        //     "unlock":"test"  // password for etherbase account
        // },


    }
}

