const Big = require('big.js')
const log = require('@arbiter/dumb-lumberjack')()

let TAG = " | Coin-Diff-tool | "

module.exports = {
    diff: function (balancesLocal,balancesRemote) {
        return diffTool(balancesLocal,balancesRemote);
    }
}


let diffTool = function(balancesLocal,balancesRemote){
    let tag = TAG + " | diffToll | "
    let longest
    let longestKeys
    let keysLocal = Object.keys(balancesRemote)
    let keysRemote = Object.keys(balancesLocal)
    if(keysLocal.length > keysRemote.length){
        longest = balancesRemote
        longestKeys = keysLocal
    } else {
        longest = balancesRemote
        longestKeys = keysRemote
    }
    let output = {}
    //iterate over longest
    for(let i = 0; i < longestKeys.length; i++){
        let asset = longestKeys[i]
        if(!balancesLocal[asset]) balancesLocal[asset] = 0
        if(!balancesRemote[asset]) balancesRemote[asset] = 0

        let roundedLocal  = Big(balancesLocal[asset])
        let roundedRemote = Big(balancesRemote[asset])
        log.info(tag,asset,"roundedLocal: ",roundedLocal.toString())
        log.info(tag,asset,"balancesRemote: ",roundedRemote.toString())


        // let roundedLocal  = toFixed(balancesLocal[asset],6)
        // let roundedRemote = toFixed(balancesRemote[asset],6)
        // log.info(tag,asset,"roundedLocal: ",roundedLocal)
        // log.info(tag,asset,"balancesRemote: ",balancesRemote)
        //
        // //trim to 7~ decimicals to compare
        // //TODO take this to 8 baby every satoshi accounted for
        if(roundedLocal.round(6).toString() == roundedRemote.round(6).toString()){
            output[asset] = "WINNING!!! MATCH!"
        } else {
            let diff = {
                remote:balancesRemote[asset],
                local:balancesLocal[asset],
                diff:roundedLocal - roundedLocal
            }
            output[asset] = diff
        }

    }
    return output
}


let remote = {BTC:0.00010000000001}
let local = {BTC:0.0001000000000}

console.log(diffTool(remote,local))
