

let { btc,ltc,eth} = require('@arbiter/arb-daemons-manager').daemons


// btc.getNewAddress()
//     .then(function(resp){
//         console.log(resp)
//     })
//
// ltc.getNewAddress()
//     .then(function(resp){
//         console.log(resp)
//     })

eth.getNewAddress()
    .then(function(resp){
        console.log(resp)
    })
