/**
 * Created by highlander on 12/26/16.
 */
var WebSocket = require('ws');
var Message = require('bitcore-message');
var protoify = require("./proto/index.js");

function checkSig(message, sig) {
    return Message(message).verify(sigKeyPub, sig);
}

//Sub to arbiter
var ws = new WebSocket('ws://127.0.0.1:4200');
ws.on('message', function(data, flags) {
    //console.log("data", data)


    var decodedResp = protoify.parse(data);
    //console.log(decodedResp);

});
