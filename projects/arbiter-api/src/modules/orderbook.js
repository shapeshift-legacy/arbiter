/*

    Orderbook toolkit

    Building and updateing order book state events

 */



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
        if(!order.orderId) console.error("101: invalid event! ",order)
        if(!order.qty) console.error("102: invalid event! ",order)
        if(!order.orderId) console.error("103: invalid event! ",order)

        let elementNew = {}
        let orderId = order.orderId

        elementNew.quantity = Math.abs(order.qty)
        elementNew.price = order.price
        elementNew.orders = []
        elementNew.orders.push({id:orderId,qty:order.qty})
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
                console.log(tag,"detect submit")
                console.log(tag,"submit: ",event)

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


export default {update_function}