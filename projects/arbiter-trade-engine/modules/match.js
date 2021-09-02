let uuid = require('node-uuid')

const util = require('@arbiter/arb-redis')
const redis = util.redis
let publisher = util.publisher

// mongo
let monk = require('monk')
let db = monk('127.0.0.1:27017/hte-match-history')
let matchSet = db.get('matches')
const log = require('@arbiter/dumb-lumberjack')()

// const candleModule = require('./candleData')
// const accounting = require('./accounting.js')

let TAG = ' | HTE | '
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

// TPS meter
let tps = 0
let lasti = 0
let trades_per_second = function () {
    if ((tps - lasti) != 0) log.info(tps - lasti, ' trades per second')
    lasti = tps
}
setInterval(trades_per_second, 1000)

// globals
let version = 'HTE-00.01'
let lastPrice = null

let createEngine = function createEngine (pair) {
    let util = require('util'),
        EventEmitter = require('events').EventEmitter

    let tag = ' | match-engine ' + pair + ' | '

    // var getNewId = function getNewId() {
    //     var orderId = 0;
    //     return function() {
    //         orderId = orderId + 1;
    //         return orderId;
    //     }
    // }();

    let adjustQuantity = function (order, newQuantity) {
        order.quantity = Math.max(0, newQuantity)
        if (order.quantity === 0) {
            order.status = 'complete'
        }
    }

    let Book = function () {
        this.levels = []
    }

    Book.prototype.map = function (fun) {
        return this.levels.map(fun)
    }

    Book.prototype.addOrder = function (order) {
        if (order.quantity <= 0) { return }
        let levelIndex = 0
        let level = this.levels[0]

        let comp = order.isBuy ?
            function (price) { return order.price < price }
            :
            function (price) { return order.price > price }

        while (level && comp(level.price)) {
            levelIndex = levelIndex + 1
            level = this.levels[levelIndex]
        }

        if (!level || level.price !== order.price) {
            level = []
            level.price = order.price
            this.levels.splice(levelIndex, 0, level)
        }
        level.push(order)
    }

    Book.prototype.removeOrder = function (order) {
        let tag = " | removeOrder | "
        try{
            log.debug(tag,"order: ",order)
            log.debug(tag,"levels before: ",this.levels)

            for (let l = 0; l < this.levels.length; l++) {
                let level = this.levels[l]
                log.debug(tag,"level: ",level)

                // if(!level[0]){
                //     this.levels.splice(l+1, 1)
                // }

                if (level.price === order.price) {

                    for (let i = 0; i < level.length; i++) {
                        log.debug(tag,"level2: ",level[i])

                        if (level[i].id === order.id) {
                            //log.debug(tag,"level3: ",level.splice(i, 1))
                            //delete level[i].price
                            level.splice(i, 1)
                            if (level.length === 0) {
                                if(!level[0] && level.price){
                                    log.debug(tag," Bad case???? empty level??")
                                    log.debug(tag,"level3: ",level)
                                    this.levels.splice(l, 1)
                                    //this.levels.splice(i+1, 1)
                                } else {

                                    //TODO WHY THE FUCK +1??????
                                    //this.levels.splice(i+1, 1)
                                    log.debug(tag, "normal: ****")
                                    this.levels.splice(i, 1)
                                }
                                //this.levels.splice(i, 1)
                                log.debug(tag,"levels final: ",this.levels)

                            }
                            return true
                        }
                    }
                }
            }

            return false
        }catch(e){
            console.error(tag,e)
        }
    }

    Book.prototype.findMatches = function (order) {
        let comp = order.isBuy ?
            function (price) { return order.price >= price }
            :
            function (price) { return order.price <= price }

        var level = this.levels[0]
        let remainingQuantity = order.quantity
        let matches = []
        for (let i = 0; i < this.levels.length; i++) {
            var level = this.levels[i]
            if (!comp(level.price)) {
                break
            }

            for (let j = 0; j < level.length && remainingQuantity > 0; j++) {
                let restingOrder = level[j]
                matches.push(restingOrder)
                remainingQuantity = remainingQuantity - restingOrder.quantity
            }
        }

        return matches
    }

    let Engine = function () {
        this.bids = new Book()
        this.offers = new Book()
        this.orders = {}
    }
    util.inherits(Engine, EventEmitter)

    Engine.prototype.submitOrder = function (order) {
        if (order.quantity === 0) {
            throw new Error('Order must have non-zero quantity')
        }
        if (this.orders[order.id]) {
            return Error('Order Already Live')
        }
        let isBuy = order.quantity > 0
        let book = isBuy ? this.bids : this.offers
        let otherBook = isBuy ? this.offers : this.bids

        let aggressiveOrder = {
            id: order.id,
            price: order.price,
            quantity: Math.abs(order.quantity),
            status: 'Working',
            isBuy: isBuy
        }

        let matches = otherBook.findMatches(aggressiveOrder)

        this.orders[aggressiveOrder.id] = aggressiveOrder

        for (let i = 0; i < matches.length; i++) {
            let restingOrder = matches[i]
            let matchQuantity = Math.min(aggressiveOrder.quantity, restingOrder.quantity)
            adjustQuantity(restingOrder, restingOrder.quantity - matchQuantity)
            adjustQuantity(aggressiveOrder, aggressiveOrder.quantity - matchQuantity)

            // temp
            log.debug(' ^^^^^^^ ^ matching happens ^^^^^^^^^^^^, restingOrder', restingOrder)
            log.debug(' ^^^^^^^^^^ matching happens, aggressiveOrder ^^^^^^^^', aggressiveOrder)
            log.debug('^^^^^^^^^^^^ matching happens, restingOrder.price ^^^^^^^^^^^^', restingOrder.price)
            log.debug('^^^^^^^^^^^^ matching happens, matchQuantity ^^^^^^^^^^^^^^^^', matchQuantity)


            this.emit('match', restingOrder, aggressiveOrder, restingOrder.price, matchQuantity)

            if (restingOrder.quantity === 0) {
                otherBook.removeOrder(restingOrder)
            }
        }

        if (aggressiveOrder.quantity > 0) {
            book.addOrder(aggressiveOrder)
        }

        return aggressiveOrder.id
    }

    Engine.prototype.lastPrice = function () {
        return lastPrice
    }

    Engine.prototype.getStatus = function (orderId) {
        let order = this.orders[orderId]
        return order ?
            {
                status: order.status,
                workingQuantity: order.quantity
            }
            : undefined
    }

    Engine.prototype.cancelOrder = function (orderId) {
        let order = this.orders[orderId]
        if (!order) {
            return false
        }

        if (order.status !== 'Working') {
            return false
        }
        let book = order.isBuy ? this.bids : this.offers
        book.removeOrder(order)
        order.status = 'Cancelled'

        return true
    }

    // Engine.prototype.getMarketData = function () {
    //     let levelReduce = function (order1, order2) {
    //         return {
    //             quantity: order1.quantity + order2.quantity,
    //             price: order1.price
    //         }
    //     }
    //     let levelConverter = function (level) {
    //         if (!level) return []
    //         if (level.length === 1) {
    //             return { quantity: level[0].quantity, price: level[0].price }
    //         }
    //         return level.reduce(levelReduce)
    //     }
    //     let bids = this.bids.map(levelConverter)
    //     let offers = this.offers.map(levelConverter)
    //
    //     return {
    //         bids: bids,
    //         offers: offers
    //     }
    // }

    // update this on every event
    Engine.prototype.getMarketData = function () {
        let tag = TAG + ' | getMarketData | '
        let levelReduce = function (order1, order2) {
            log.debug(tag, 'order1: ', order1)
            log.debug(tag, 'order2: ', order2)
            let orders = []
            if (!order2.id) {
                for (let i = 0; i < order1.orders.length; i++) {
                    orders.push(order1.orders[i])
                }
            } else {
                orders.push({ id: order1.id, qty: order1.quantity })
            }
            orders.push({ id: order2.id, qty: order2.quantity })

            return {
                quantity: order1.quantity + order2.quantity,
                price: order1.price,
                orders: orders
            }
        }
        let levelConverter = function (level) {
            let tag = TAG + ' | levelConverter | '
            log.debug(tag,"level: ",level)
            if (!level) return []

            if (level.length == 1) {
                return {
                    quantity: level[0].quantity,
                    price: level[0].price,
                    orders: [{ id: level[0].id, qty: level[0].quantity }]
                }
            }
            try {
                // var reduction
                // if(level.quantity)reduction = level.reduce(levelReduce)
                var reduction = level.reduce(levelReduce)
                log.debug(tag, 'reduction: ', reduction)
                log.debug(tag, 'level: ', level)
                log.debug(tag, 'levelReduce: ', levelReduce)
                return reduction
            } catch (e) {
                console.error(tag, ' Failed to reduce error: ', e)
            }
        }
        let bids = this.bids.map(levelConverter)
        let offers = this.offers.map(levelConverter)
        log.debug(tag,'bids: ', bids)
        log.debug(tag,'offers: ', offers)
        let output = {
            bids: bids,
            offers: offers
        }
        redis.set('orderbook', JSON.stringify(output))
        log.debug(tag, 'orderbook: ', output)
        return output
    }

    return new Engine()
}

exports.createEngine = createEngine
