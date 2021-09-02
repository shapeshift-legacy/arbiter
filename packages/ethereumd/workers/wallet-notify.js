
let TAG = " | wallet-notify | "

let when = require('when')
let request = require('request')

//sub to pubsub
const pubsubLib = require("redis")
    , subscriber = pubsubLib.createClient()
    , publisher = pubsubLib.createClient();
//git rest on payment recieved


var get_request = function(url){
    var d = when.defer();
    var tag = TAG + " | get_request | "
    console.log(tag,"url:",url)
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            //console.log(body) // Show the HTML for the Google homepage.
            d.resolve(body)
        } else {

            console.error(tag,"e: ",error)
        }
    })
    return d.promise
}


subscriber.subscribe("credits");
subscriber.on("message", async function (channel, payloadS)
{
    var tag = TAG+ " | payments | "
    let debug = true
    try{
        if(debug) console.log(tag,"payloadS: ",payloadS)
        let payload = JSON.parse(payloadS)
        if(debug) console.log(tag,"payload: ",payload)

        //push txid
        let url = "http://127.0.0.1:3000/api/v1/eth/txid/"+payload.txid
        let resp = await get_request(url)

    }catch(e){
        console.error(tag,"Error: ",e)
    }
})