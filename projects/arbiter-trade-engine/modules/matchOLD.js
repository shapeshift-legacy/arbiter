var uuid = require('node-uuid');

const util = require('@arbiter/arb-redis')
const redis = util.redis
let publisher = util.publisher

//mongo
var monk = require('monk')
var db = monk('127.0.0.1:27017/hte-match-history');
var matchSet = db.get("matches");

//const candleModule = require('./candleData')
//const accounting = require('./accounting.js')

var TAG = " | HTE | "
/*
     Engine Notes:

         Aggressor = taker
         Sell orders are negative quantity

         example:
         var sellId = engine.submitOrder({quantity: "-3", price: "2.5"});
         var buyId = engine.submitOrder({quantity: "3", price: "2.5"});

         Completely sync trade execution.

         Redis PubSub

         Output:

             Last Price:

             order created:

             Total-orderbook size updates:

             match info:

 */

//TPS meter
var tps = 0
var lasti = 0
var trades_per_second = function ()
{
    if ((tps - lasti) != 0) console.log(tps - lasti, " trades per second")
    lasti = tps
}
setInterval(trades_per_second, 1000)

//globals
var version = "HTE-00.01"
var init = false

var dailyHigh = false
var dailyLow = false
var dailyVolume = false
var dailyPctChange = false
var lastPrice = null

var debug = false
var production = false
var noPublish = false


var createEngine = function createEngine(pair) {
    var util = require('util'),
        EventEmitter = require('events').EventEmitter;

    var tag = " | match-engine " + pair + " | "

    // var getNewId = function getNewId() {
    //     var orderId = 0;
    //     return function() {
    //         orderId = orderId + 1;
    //         return orderId;
    //     }
    // }();

    var adjustQuantity = function(order, newQuantity) {
        order.quantity = Math.max(0, newQuantity);
        if (order.quantity === 0) {
            order.status = "complete";
        }
    };

    var Book = function () {
        this.levels = [];
    };

    Book.prototype.map = function(fun) {
        return this.levels.map(fun);
    };

    Book.prototype.addOrder = function(order) {
        if (order.quantity <= 0)
            return;
        var levelIndex = 0;
        var level = this.levels[0];

        var comp = order.isBuy ?
            function(price) { return order.price < price; }
            :
            function(price) { return order.price > price; }

        while (level && comp(level.price))
        {
            levelIndex = levelIndex + 1;
            level = this.levels[levelIndex];
        }

        if (!level || level.price !== order.price)
        {
            level = [];
            level.price = order.price;
            this.levels.splice(levelIndex, 0, level);
        }
        level.push(order);
    };

    Book.prototype.removeOrder = function(order) {
        for (var l = 0; l < this.levels.length; l++)
        {
            var level = this.levels[l];
            if (level.price === order.price)
            {
                for (var i = 0; i < level.length; i++)
                {
                    if (level[i].id === order.id)
                    {
                        level.splice(i, 1);
                        if (level.length === 0)
                        {
                            this.levels.splice(i, 1);
                        }
                        return true;
                    }
                }
            }
        }

        return false;
    };

    Book.prototype.findMatches = function(order) {
        var comp = order.isBuy ?
            function(price) { return order.price >= price; }
            :
            function(price) { return order.price <= price; }

        var level = this.levels[0];
        var remainingQuantity = order.quantity;
        var matches = [];
        for (var i = 0; i < this.levels.length; i++)
        {
            var level = this.levels[i];
            if (!comp(level.price))
            {
                break;
            }

            for (var j = 0; j < level.length && remainingQuantity > 0; j++)
            {
                var restingOrder = level[j];
                matches.push(restingOrder);
                remainingQuantity = remainingQuantity - restingOrder.quantity;
            }
        }

        return matches;
    };

    var Engine = function(){
        this.bids = new Book();
        this.offers = new Book();
        this.orders = {};
    };
    util.inherits(Engine, EventEmitter);

    Engine.prototype.submitOrder = function(order) {
        if (order.quantity === 0 ) {
            throw new Error("Order must have non-zero quantity");
        }
        if (this.orders[order.id])
        {
            return Error("Order Already Live");
        }
        var isBuy = order.quantity > 0;
        var book = isBuy ? this.bids : this.offers;
        var otherBook = isBuy ? this.offers : this.bids;

        var aggressiveOrder = {
            id: 		order.id,
            price: 		order.price,
            quantity: 	Math.abs(order.quantity),
            status:  	"Working",
            isBuy: 		isBuy
        };

        var matches = otherBook.findMatches(aggressiveOrder);

        this.orders[aggressiveOrder.id] = aggressiveOrder;

        for (var i = 0; i < matches.length; i++)
        {
            var restingOrder = matches[i];
            var matchQuantity = Math.min(aggressiveOrder.quantity, restingOrder.quantity);
            adjustQuantity(restingOrder, restingOrder.quantity - matchQuantity);
            adjustQuantity(aggressiveOrder, aggressiveOrder.quantity - matchQuantity);

            // let matchEvent = {
            //     engine:pair,
            //     time:new Date().getTime(),
            //     restingOrder,
            //     aggressiveOrder,
            //     restingOrderPrice:restingOrder.price,
            //     matchQuantity
            // }
            // //publish to redis
            // //console.log("matchEvent: ",matchEvent)
            //
            // publisher.publish("match",JSON.stringify(matchEvent))

            this.emit('match', restingOrder, aggressiveOrder, restingOrder.price, matchQuantity);

            if (restingOrder.quantity === 0)
            {
                otherBook.removeOrder(restingOrder);
            }
        }

        if (aggressiveOrder.quantity > 0)
        {
            book.addOrder(aggressiveOrder);
        }

        return aggressiveOrder.id;
    };

    Engine.prototype.lastPrice = function ()
    {
        return lastPrice
    };


    Engine.prototype.getStatus = function (orderId)
    {
        var order = this.orders[orderId];
        return order ?
            {
                status: order.status,
                workingQuantity: order.quantity
            }
            : undefined;
    };

    Engine.prototype.cancelOrder = function(orderId) {
        var order = this.orders[orderId];
        if (!order)
        {
            return false;
        }

        if (order.status !== "Working")
        {
            return false;
        }
        var book = order.isBuy ? this.bids : this.offers;
        book.removeOrder(order);
        order.status = "Cancelled";

        return true;
    };

    // Engine.prototype.getMarketData = function() {
    //     var levelReduce = function(order1, order2) {
    //         return {
    //             quantity: 	order1.quantity + order2.quantity,
    //             price: 		order1.price
    //         }
    //     };
    //     var levelConverter = function(level) {
    //         if (!level) return [];
    //         if (level.length == 1) {
    //             return { quantity: level[0].quantity, price: level[0].price };
    //         }
    //         return level.reduce(levelReduce)
    //     };
    //     var bids = this.bids.map(levelConverter);
    //     var offers = this.offers.map(levelConverter);
    //
    //     return {
    //         bids: 	bids,
    //         offers: offers
    //     };
    // };

    //update this on every event
    Engine.prototype.getMarketData = function ()
    {
        var tag = TAG + " | getMarketData | "
        var levelReduce = function (order1, order2)
        {
            if (debug) console.log(tag, "order1: ", order1)
            if (debug) console.log(tag, "order2: ", order2)
            var orders = []
            if (!order1.id)
            {
                for (var i = 0; i < order1.orders.length; i++)
                {
                    orders.push(order1.orders[i])
                }
            } else
            {
                orders.push({id: order1.id, qty: order1.quantity})
            }
            orders.push({id: order2.id, qty: order2.quantity})
            return {
                quantity: order1.quantity + order2.quantity,
                price: order1.price,
                orders: orders
            }
        };
        var levelConverter = function (level)
        {
            var tag = TAG + " | levelConverter | "
            if (!level) return [];
            if (level.length == 1)
            {
                return {
                    quantity: level[0].quantity,
                    price: level[0].price,
                    orders: [{id: level[0].id, qty: level[0].quantity}]
                };
            }
            try
            {
                var reduction = level.reduce(levelReduce)
                if (debug) console.log(tag, "reduction: ", reduction)
                if (debug) console.log(tag, "level: ", level)
                if (debug) console.log(tag, "levelReduce: ", levelReduce)
            } catch (e)
            {
                console.error(tag, " Failed to reduce error: ", e)
            }
            return reduction
        };
        var bids = this.bids.map(levelConverter);
        var offers = this.offers.map(levelConverter);
        if(debug) console.log("bids: ",bids)
        if(debug) console.log("offers: ",offers)
        var output = {
            bids: bids,
            offers: offers
        };
        redis.set("orderbook",JSON.stringify(output))
        if(debug) console.log(tag, "orderbook: ", output)
        return output
    };

    return new Engine();
};

exports.createEngine = createEngine;
