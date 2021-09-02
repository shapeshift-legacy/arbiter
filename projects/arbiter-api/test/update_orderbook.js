

let orderbook = {
    "bids": [
        {
            "quantity": 0.77372158,
            "price": "0.00819400",
            "orders": [
                {
                    "id": "8796c22c-3e9d-4e72-b288-467bf7a26a5f",
                    "qty": 0.77372159
                }
            ]
        }
    ],
    "offers": [
        {
            "quantity": 0.77372159,
            "price": "0.00819400",
            "orders": [
                {
                    "id": "2c1f9724-6a24-4f7a-a709-055637d4a95b",
                    "qty": 0.77372159
                }
            ]
        },
        {
            "quantity": 1.27872243,
            "price": "0.00831000",
            "orders": [
                {
                    "id": "e4ba498d-8a72-4170-b20b-05224d09cbc5",
                    "qty": 1.27872243
                },
                {
                    "id": "e4ba498d-8a72-4170-b20b-05224d09cbc6",
                    "qty": 2.27872243
                },
                {
                    "id": "e4ba498d-8a72-4170-b20b-05224d09cbc7",
                    "qty": 3.27872243
                }
            ]
        }
    ]
}




// let match = { event: 'orderUpdate',
//     market: 'LTC_BTC',
//     eventSummaries:
//         [ 'order: a346c75d-1b83-4bd1-86e4-9840808f9b50 funded! new order status: live' ],
//     newOrderStates:
//         [ { orderId: 'a346c75d-1b83-4bd1-86e4-9840808f9b50',
//             qty: 0.023255813953488375,
//             price: '0.043' } ] }

let match = { event: 'orderUpdate',
    market: 'LTC_BTC',
    eventSummaries:
    [ 'order: dca7a52e-e0f0-4def-8cb4-e22ae8e6e887 funded! new order status: live' ],
        newOrderStates:
    [ { orderId: 'dca7a52e-e0f0-4def-8cb4-e22ae8e6e887',
        qty: 0.023255813953488375,
        price: '0.043' } ] }


// let match = {
//     market: 'LTC_BTC',
//     eventSummaries:
//         [ 'event: 1539980734611 order: 8796c22c-3e9d-4e72-b288-467bf7a26a5f bought 0.000192 (LTC) at 0.00825600',
//             'event: 1539980734611 order: e4ba498d-8a72-4170-b20b-05224d09cbc5 sold 0.023255813953488375 (LTC) at 0.00825600' ],
//     newOrderStates:
//         [
//             {orderId: 'e4ba498d-8a72-4170-b20b-05224d09cbc5',qty: 0.9667441860465116},
//             {orderId: '8796c22c-3e9d-4e72-b288-467bf7a26a5f',qty: 0 }
//         ],
//     event: 'orderUpdate'
// }

// let match = {
//     market: 'LTC_BTC',
//     eventSummaries:
//         [ 'event: 1539980734611 order: 8796c22c-3e9d-4e72-b288-467bf7a26a5f bought 0.000192 (LTC) at 0.00825600',
//             'event: 1539980734611 order: e4ba498d-8a72-4170-b20b-05224d09cbc5 sold 0.023255813953488375 (LTC) at 0.00825600' ],
//     newOrderStates:
//         [
//             {orderId: 'e4ba498d-8a72-4170-b20b-05224d09cbc5',qty: 0.9667441860465116}
//         ],
//     event: 'orderUpdate'
// }


let find_order = function(orderTier,orderId){
    let tag = " | find_order | "
    try{
        console.log(tag,"orderTier:  ",orderTier)
        let position = -1
        for(var i = 0; i < orderTier.length; i++) {
            let orders = orderTier[i].orders
            console.log(tag,"orders: ",orders)


            for(let j = 0; j < orders.length; j++){
                let order = orders[j]
                console.log(tag,"order: ",order)
                console.log(tag,"order: ",order.id)

                if (order.id == orderId) {
                    position = i
                }
            }
        }
        return position
    }catch(e){
        console.error(e)
        throw e
    }
}


let update_element = function(element,order){
    let tag = " | update_element | "
    try{
        let elementNew = {}
        let orderId = order.id

        console.log(tag,"element:  ",element)

        //splice out element
        console.log(tag,"oldArr: ",element.orders)

        for(let i = 0; i < element.orders.length; i++){
            let orderOld = element.orders[i]
            console.log(tag,"order: ",orderOld)
            console.log(tag,"order: ",orderOld.id)

            if (orderOld.orderId == orderId) {
                console.log(tag,"WINNING")
                //splice out
                if(order.qty > 0){
                    element.orders.splice(i, 1, order)
                } else {
                    element.orders.splice(i, 1)
                }
            }

        }
        console.log(tag,"newArr: ",element.orders)

        //calculate new quantity
        let newQuantity = 0
        for(let i = 0; i < element.orders.length; i++){
            let order = element.orders[i]
            newQuantity = order.qty + order.qty
        }
        elementNew.price = element.price
        elementNew.quantity = newQuantity
        elementNew.orders = element.orders
        //


        return elementNew
    }catch(e){
        console.error(e)
        throw e
    }
}


let create_element = function(order){
    let tag = " | create_element | "
    try{
        let elementNew = {}
        let orderId = order.orderId

        elementNew.quantity = order.qty
        elementNew.price = order.price
        elementNew.orders = []
        elementNew.orders.push({id:order.orderId,qty:order.qty})
        return elementNew
    }catch(e){
        console.error(e)
        throw e
    }
}


let update_function = function(orderbook,events){
    let tag = " | update_function | "
    try{
        let newOrderBook = orderbook
        console.log("event: ",events)

        for(let i = 0; i < events.length; i ++){
            let event = events[i]
            console.log("event: ",event)
            let orderId = event.orderId
            console.log("orderId: ",orderId)
            //for each state change

            //find location in array
            console.log("orders: ",orderbook.offers)
            //console.log("orders: ",orderbook.offers.orders)

            let locationBid = find_order(orderbook.bids,orderId)
            let locationAsk = find_order(orderbook.offers,orderId)
            console.log(tag,"locationBids",locationBid)
            console.log(tag,"locationAsks",locationAsk)

            //get element
            let elementOld

            //if bid
            if(locationBid >= 0){
                elementOld = orderbook.bids[locationBid]
                //
                console.log(tag,"elementOld: ",elementOld)

                //calculate new element
                let elementNew = update_element(elementOld, event)
                console.log(tag,"elementNew: ",elementNew)

                if(elementNew.order > 0){
                    newOrderBook.bids.splice(locationBid,0,elementNew)
                } else {
                    //delete whole element
                    newOrderBook.bids.splice(locationBid,1)
                }
            }

            //if ask
            if(locationAsk >= 0){
                elementOld = orderbook.offers[locationAsk]
                //
                console.log(tag,"elementOld: ",elementOld)

                //calculate new element
                let elementNew = update_element(elementOld, event)
                console.log(tag,"elementNew: ",elementNew)
                if(elementNew.order > 0){
                    newOrderBook.offers.splice(locationAsk,0,elementNew)
                } else {
                    //delete whole element
                    newOrderBook.offers.splice(locationAsk,1)
                }
            }

            if(locationAsk < 0 && locationBid < 0){
                //if amount is positive
                if (event.qty > 0){
                    //push to bids
                    let elementNew = create_element(event)
                    newOrderBook.bids.push(elementNew)
                    //sort bids by price
                } else {
                    //push to offers
                    let elementNew = create_element(event)
                    newOrderBook.offers.push(elementNew)
                }
            }



        }

        return newOrderBook
    }catch(e){
        console.error(e)
        throw e
    }
}

//apply each state update once at a time



let newBook = update_function(orderbook,match.newOrderStates)
console.log(newBook)
console.log("Bids: ",JSON.stringify(newBook.bids))
console.log("Asks: ",newBook.offers)