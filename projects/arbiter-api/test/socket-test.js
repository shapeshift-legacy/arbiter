//client.js
var io = require('socket.io-client');
var socket = io.connect('https://localhost:3000', {reconnect: true, rejectUnauthorized: false});

// Add a connect listener
socket.on('connect', function (socket) {
    console.log('Connected!');
});

socket.on('message', function (message) {
    console.log('message: ',message);
});


socket.on('orderUpdate', function (message) {
    console.log('orderUpdate: ',message);
});

socket.on('mpyF2zVQAiQ1ysaDqxhXhiCBV2kBLPdYra', function (message) {
    console.log('mpyF2zVQAiQ1ysaDqxhXhiCBV2kBLPdYra: ',message);
});

// socket.on('message', function (message) {
//     console.log('message: ',message);
// });
//
// socket.on('message', function (message) {
//     console.log('message: ',message);
// });


socket.emit('message', 'me', 'test msg');