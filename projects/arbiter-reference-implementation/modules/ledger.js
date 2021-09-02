//ledger intergation
if (typeof ledger == 'undefined') {
    ledger = require('../src');
    comm = ledger.comm_node;
    browser = false;
}
else {
    browser = true;
    comm = ledger.comm_u2f;
}

let TAG = " | ledger | "
const log = require('@arbiter/dumb-lumberjack')()

module.exports = {
    init: function () {
        return connect_to_client();
    },
    //sign
    sign: function (msg) {
        return sign_msg(msg);
    },
}

let sign_msg = async function(msg){
    let tag = TAG+" | sign_msg | "
    let debug = false
    try{
        let output = {}
        let comm = await ledger.comm_node.create_async()
        var btc = new ledger.btc(comm);
        log.debug(comm.device.getDeviceInfo());


        // let loginChallenge = "signthismessageyo"
        // let signature = await btc.signMessageNew_async("44'/0'/0'/1/0",Buffer.from(loginChallenge, 'utf8').toString('hex'))
        // console.log(signature)

        let signature = await btc.signMessageNew_async("44'/0'/0'/1/0", Buffer.from(msg).toString('hex'))
        log.debug("Signature : " + signature);

        var v = signature['v'] + 27 + 4;
        let signatureFinal = Buffer.from(v.toString(16) + signature['r'] + signature['s'], 'hex').toString('base64');
        log.debug("signatureFinal : " + signatureFinal);
        output.success = true
        output.body = signatureFinal
        return output
    }catch(e){
        if(e === "Invalid status 6982"){
            log.error(" Please unlock your ledger! ")
            return {success:false,error:" Please unlock your ledger! "}
        } else if(e === "Invalid channel") {
            log.error(" Please select the correct coin on the ledger! ")
            return {success:false,error:" Please select the correct coin on the ledger! "}
        }else{
            log.debug("e: ",e)
            return {success:false,error:e}
        }
    }
}



let connect_to_client = async function(){
    let tag = TAG+" | connect_to_client | "
    let debug = false
    try{
        let output = {}
        let comm = await ledger.comm_node.create_async()
        var btc = new ledger.btc(comm);
        log.debug(comm.device.getDeviceInfo());


        //let address = await btc.getWalletPublicKey_async("44'/0'/0'/0")
        let address = await btc.getWalletPublicKey_async("44'/0'/0'/1/0")
        log.debug(address);

        // let loginChallenge = "signthismessageyo"
        // // let signature = await btc.signMessageNew_async("44'/0'/0'/1/0",Buffer.from(loginChallenge, 'utf8').toString('hex'))
        // // console.log(signature)
        //
        // let signature = await btc.signMessageNew_async("44'/0'/0'/1/0", Buffer.from(loginChallenge).toString('hex'))
        // console.log("Signature : " + signature);
        //
        // var v = signature['v'] + 27 + 4;
        // let signatureFinal = Buffer.from(v.toString(16) + signature['r'] + signature['s'], 'hex').toString('base64');
        // console.log("signatureFinal : " + signatureFinal);
        // console.log("************ want: H27pjjkhio99tji02b5oWUQKEHl0M5yqjMlx91IZqfPlTDFjLQeoz1nnwOYwSUjJ3adPFKKpX8MqdeB5mndWNSo=")
        output.success = true
        output.body = address
        return output
    }catch(e){
        if(e === "Invalid status 6982"){
            log.error(" Please unlock your ledger! ")
            return {success:false,error:" Please unlock your ledger! "}
   } else if(e === "Invalid channel") {
            log.error(" Please select the correct coin on the ledger! ")
            return {success:false,error:" Please select the correct coin on the ledger! "}
        }else{
            log.debug("e: ",e)
            return {success:false,error:e}
        }
    }
}
