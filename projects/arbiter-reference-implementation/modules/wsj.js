/**
 * Created by highlander on 12/28/16.
 */
/**
 * Created by highlander on 12/26/16.
 */
var WebSocket = require('ws');
var Message = require('bitcore-message');
let debug = false
//events

//Order goes live

//order is canceled

//order is partially filled

//Sub to arbiter
//var ws = new WebSocket('ws://127.0.0.1:4200');
var ws = new WebSocket('ws://redacted.example.com:3010');
ws.on('message', function(data, flags) {
    console.log("data", data)


    var decodedResp = JSON.parse(data);
    log.debug(decodedResp);
    //TODO throw events bro!

});

/*

curl --include \
     --no-buffer \
     --header "Connection: Upgrade" \
     --header "Upgrade: websocket" \
     --header "Host: example.com:80" \
     --header "Origin: http://example.com:80" \
     --header "Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==" \
     --header "Sec-WebSocket-Version: 13" \
http://redacted.example.com:3010/



curl --include \
     --no-buffer \
     --header "Connection: Upgrade" \
     --header "Upgrade: websocket" \
     --header "Host: example.com:80" \
     --header "Origin: http://example.com:80" \
     --header "Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==" \
     --header "Sec-WebSocket-Version: 13" \
http://127.0.0.1:4200/

 */
