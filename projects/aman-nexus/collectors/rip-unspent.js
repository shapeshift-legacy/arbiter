/**
 * Created by highlander on 8/31/17.
 */

let TAG = " | coin rip | "
//const when = require('when');
require('dotenv').config({path:"../.env"});
// const { btc,ltc,eth} = require('../modules/daemons-manager')


const { daemons } = require('@arbiter/arb-daemons-manager')
const { btc, ltc, eth } = daemons
const uwallet = { btc, ltc }


//list unspent

btc.listUnspent()
    .then(function(resp){
        console.log("resp: ",resp)

        //sum
        let total = 0
        for(let i = 0; i < resp.length;i++){
            console.log(resp[i].amount)
            console.log(typeof(resp[i].amount))
            total = total + resp[i].amount
        }
        console.log("total: ",total)
    })

//save totals

//compair to open orders
