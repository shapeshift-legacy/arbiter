/*
    Tx builder

    Replaces SendToAddress

    select inputs

    get change address

    get fee

    build rawTx

    save

    (sign out of scope)

    (as is broadcast)

 */




module.exports = {
    send_to_address:function(address,amount,fee){
        return send_to_address(address,amount,fee)
    },
}

let send_to_address = async function (address,amount,fee) {
    let tag = " | build_btc_tx | "
    let debug = true
    try{
        //get inputs from local client
        let inputs = await(btc.listUnspent(0, 9999999))
        log.debug(tag,"inputs: ",inputs)

        //get change address
        // let changeAddress = await(btc.getRawChangeAddress())
        // if(debug) console.log(tag,"inputs:",inputs)
        // let inputAmount = 0
        // let selected = []
        // let i = 0
        // while(amount > inputAmount){
        //     if(debug) console.log(tag,"input:",inputs[i])
        //     selected.push(inputs[i])
        //     if(debug) console.log(tag,"selected:",selected)
        //     let selectedAmount = parseFloat(inputs[i].amount)
        //     inputAmount = inputAmount +  selectedAmount
        //     inputAmount = Math.floor(inputAmount * 100000000)/ 100000000
        //     if(debug) console.log(tag,"inputAmount:",inputAmount)
        //     i++
        // }
        // let change = inputAmount - amount
        // if(fee) change = change - fee
        // change = Math.floor(change * 100000000)/ 100000000
        // if(debug) console.log(tag,"change: ",change)
        // let outputs = {}
        //
        // outputs[address] = amount
        // outputs[changeAddress] = change
        // let tx
        // if(debug) console.log(tag,"inputs: ",inputs)
        // if(debug) console.log(tag,"outputs: ",outputs)
        // tx = await(btc.createRawTransaction(inputs,outputs))
        //
        // //if !fee or fee = auto*
        // if(!fee){
        //     //auto-fund to network conditions
        //     tx = await(btc.fundRawTransaction(tx))
        // }
        // return tx
    }catch(e){
        console.error(tag,"ERROR: ",e)
    }

}