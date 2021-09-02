import openSocket from 'socket.io-client';
const  socket = openSocket(process.env.REACT_APP_API_HOST,{reconnect: true, rejectUnauthorized: false});
console.log("SOCKET HOST: ",process.env.REACT_APP_API_HOST)
/*
    Websocket API

    Events:

    LastPrice
    order create
    order cancelled
    order update
    order match

 */

function subscribeToAccount(cb) {
    socket.on(localStorage.getItem('signingAddress'), accountEvent => cb(null, accountEvent));
}

// function subscribeToTimer(cb) {
//     socket.on('timer', timestamp => cb(null, timestamp));
//     //socket.on('lastPrice', lastPrice => cb(null, lastPrice));
//     socket.emit('subscribeToTimer', 1000);
// }

//orderbooks
function subscribeToOrderUpdates(cb) {
    socket.on('orderUpdate', events => cb(null, events));
    //socket.emit('subscribeToTimer', 1000);
}


//Globals
function subscribeToLastPrice(cb) {
    socket.on('lastPrice', lastPrice => cb(null, lastPrice));
    //socket.emit('subscribeToTimer', 1000);
}

function subscribeToVolume24h(cb) {
    socket.on('volume24h', volume24h => cb(null, volume24h));
    //socket.emit('subscribeToTimer', 1000);
}

function subscribeToPctChange24h(cb) {
    socket.on('pctChange24h', pctChange24h => cb(null, pctChange24h));
    //socket.emit('subscribeToTimer', 1000);
}

function subscribeToPctChange1h(cb) {
    socket.on('pctChange1h', pctChange1h => cb(null, pctChange1h));
    //socket.emit('subscribeToTimer', 1000);
}

function subscribeToLowBid(cb) {
    socket.on('lowBid', lowBid => cb(null, lowBid));
    //socket.emit('subscribeToTimer', 1000);
}

function subscribeToHighAsk(cb) {
    socket.on('highAsk', highAsk => cb(null, highAsk));
    //socket.emit('subscribeToTimer', 1000);
}

function subscribeToHigh24(cb) {
    socket.on('high24', high24 => cb(null, high24));
    //socket.emit('subscribeToTimer', 1000);
}

function subscribeToLow24(cb) {
    socket.on('low24', low24 => cb(null, low24));
    //socket.emit('subscribeToTimer', 1000);
}

export {
    subscribeToAccount,
    subscribeToLastPrice,
    subscribeToOrderUpdates,
    subscribeToVolume24h,
    subscribeToPctChange24h,
    subscribeToPctChange1h,
    subscribeToLowBid,
    subscribeToHighAsk,
    subscribeToHigh24,
    subscribeToLow24
};
/*

                            <h2>Complete order information</h2>
                            <p><bold>price: </bold> {this.props.price} </p>
                            <p><bold>amount:</bold> {this.props.amount}</p>
                            <p><bold>orderType:</bold> {this.props.orderType}</p>

 */