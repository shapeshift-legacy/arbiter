
require('dotenv').config({path:"../.env"});
const log = require('@arbiter/dumb-lumberjack')()

//let difftool = require('keys-diff')
const TAG = " test-module "
let balanceRemote = {
   BTC: 0.15109294,
   LTC: 0.00715,
   ETH: 0.010864,
   NEO: 0.00403,
   BNB: 0.00003843,
   QTUM: 0.00078,
   EOS: 0.8,
   GAS: 0.0037114,
   BCC: 0.48759441,
   OMG: 0.0022,
   WTC: 0.00651,
   TRX: 0.665,
   FUN: 0.151,
   IOTA: 0.942,
   TNT: 0.092,
   MTL: 0.0043,
   SUB: 0.704,
   DGD: 0.000255,
   VEN: 0.645,
   AMB: 0.33,
   BCPT: 0.538,
   CND: 0.704,
   GVT: 0.01,
   BCD: 0.000519,
   TNB: 0.844,
   ADA: 0.943,
   CMT: 0.561,
   ICX: 0.00758,
   ELF: 0.446,
   AION: 0.00698,
   NEBL: 0.0003,
   VIBE: 0.545,
   IOST: 0.89,
   NANO: 0.007551,
   NCASH: 0.117,
   ONT: 0.603,
   ZIL: 0.926,
   STORM: 0.075,
   XEM: 0.868,
   WAN: 0.00461,
   QLC: 0.705,
   LOOM: 0.191,
   VET: 64.5
}


let balancesLocal = {
   ENJ: 0.00007957999999952392,
   GAS: 0.1,
   EON: 0.8,
   ADD: 0.4,
   MEETONE: 0.4,
   ADT: 0.8,
   EOP: 0.8,
   IQ: 4.08,
   VET: 64.5,
   VTHO: 0.70404858,
   ONG: 0.0056079,
   BTC: 0.15393958800000004,
   BCC: 0.59426977,
   TRX: 0.665091179999763,
   ETH: 0.010875200000000015,
   TNB: 0.8440315200000441,
   CND: 0.7040061400000184,
   VEN: 0.645185639999994,
   ELF: 0.44607370000002433,
   EOS: 0.8058347000000041,
   WTC: 0.007181409999998278,
   VIBE: 0.5450063100000193,
   TNT: 0.09203963000004478,
   BNB: 0.15962921000000208,
   NANO: 0.007700029999995195,
   BCPT: 0.5380398799999853,
   MTL: 0.029968510000003334,
   BCD: 0.0005588599999994948,
   DGD: 0.023127310000000234,
   ICX: 0.032591800000048465,
   GVT: 0.007178520000000077,
   NCASH: 0.11438530000123137,
   ZIL: 0.9260448699988046,
   IOST: 0.8901070399988384,
   SUB: 0.7040919000001509,
   ONT: 0.6033703799999977,
   NEBL: 0.0003448200000022439,
   IOTA: 0.9418920799999739,
   AION: 0.007024870000023498,
   QTUM: 0.0008379099999977768,
   QLC: 0.7050448999999617,
   NEO: 0.004078770000000398,
   ADA: 0.943054819999702,
   STORM: 0.07509906000132105,
   XEM: 0.868050699999884,
   OMG: 0.002250320000001693,
   LTC: 0.007196409999999931,
   AMB: 0.33004469000002246,
   WAN: 0.004491039999990676,
   CMT: 0.5610448099998848,
   FUN: 0.1510455699996669,
   LOOM: 0.19105172000001858
}

function toFixed(num, fixed) {
    var re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
    return num.toString().match(re)[0];
}

let diffTool = function(balancesLocal,balanceRemote){
    let tag = TAG + " | diffToll | "
    let longest
    let longestKeys
    let keysLocal = Object.keys(balancesLocal)
    let keysRemote = Object.keys(balancesLocal)
    if(keysLocal.length > keysRemote.length){
        longest = balancesLocal
        longestKeys = keysLocal
    } else {
        longest = balanceRemote
        longestKeys = keysRemote
    }
    let output = {}
    //iterate over longest
    for(let i = 0; i < longestKeys.length; i++){
        let asset = longestKeys[i]
        if(!balancesLocal[asset]) balancesLocal[asset] = 0
        if(!balanceRemote[asset]) balanceRemote[asset] = 0

        let roundedLocal  = toFixed(balancesLocal[asset],6)
        let roundedRemote = toFixed(balanceRemote[asset],6)
        log.info(tag,asset,"roundedLocal: ",roundedLocal)
        log.info(tag,asset,"roundedRemote: ",roundedRemote)

        //trim to 7~ decimicals to compare
        //TODO take this to 8 baby every satoshi accounted for
        if(roundedLocal === roundedRemote){
            output[asset] = "WINNING!!! MATCH!"
        } else {
            let diff = {
                remote:balanceRemote[asset],
                local:balancesLocal[asset],
                diff:balanceRemote[asset] - balancesLocal[asset]
            }
            output[asset] = diff
        }

    }
    return output
}

let result = diffTool(balancesLocal,balanceRemote)
console.log(result)
