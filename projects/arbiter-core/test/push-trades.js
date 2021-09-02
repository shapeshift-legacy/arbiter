
/*
        Debug tool for LA trades


        fund 0.2 btc

        fund 1 ltc

        replay events
 */
const TAG = " | push replay trades | "
const util = require('@arbiter/arb-redis')
const redis = util.redis
let publisher = util.publisher
let subscriber = util.subscriber
let mongo = require('@arbiter/arb-mongo')

// logging
const log = require('@arbiter/dumb-lumberjack')()

const pause = function(length){
    return new Promise(function(resolve, reject) {
        var done = function(){resolve(true)}
        setTimeout(done,length*1000)
    })
}


function sortByKey(array, key) {
    return array.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}



// const get_all_orders = async function () {
//     let tag = TAG + ' | get_order | '
//     try {
//         let output = await mongo['arbiterLa-queries'].find()
//
//
//         for(let i = 0; i < output.length; i++){
//             output[i].nonce = output[i].payload.nonce
//         }
//
//         let sorted = sortByKey(output,'nonce')
//         log.info(output)
//
//         return sorted
//     } catch (e) {
//         log.error('ERROR: ', e)
//         throw e
//     }
// }
// get_all_orders()


let orders =  [
    {
    account: 'mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL',
    payload:
        { orderId: '892c6e4f-3b5e-44bd-8bb8-a3e78563dbdd',
            market: 'LTC_BTC',
            quantity: '1.02848914',
            rate: '0.00972300',
            type: 'bid',
            nonce: 153807321988200,
            event: 'submit' },
    signature: 'H0vi1ePAJk57ZAk08OI+gdm3YgP98sfvU+0SzJSwujGoL8TeyECZ2vAYxLK5NSaPw4g1eWRnXPCa3heLxPiUI3U=',
    nonce: 153807321988200
    },
    {
        account: 'mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL',
        payload:
            { orderId: '68be44cc-42af-450e-920d-b9f27d5eaaa1',
                market: 'LTC_BTC',
                quantity: '1.00000000',
                rate: '0.00973000',
                type: 'ask',
                nonce: 153807321988500,
                event: 'submit' },
        signature: 'H/Gdk8FV4AqlwIQLC99//stwvg9LAbQ9hh3pt99RsupubBzeGDHiOPjPDskGSNd+plc0QeQK2tJSBBjaY7XVXes=',
        nonce: 153807321988500
    },
    {
        account: 'mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL',
        payload:
            { orderId: '892c6e4f-3b5e-44bd-8bb8-a3e78563dbdd',
                nonce: 153807321999100,
                event: 'cancel' },
        signature: 'IPZ/34pcDNrJ8bdCQwMjxMQnPVXTN1jJL251vbc2zZTieifHTWABtONY3EegbH7X4vCjfrqJauix0raAbLq9T3U=',
        nonce: 153807321999100
    },
    {
        account: 'mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL',
        payload:
            { orderId: '2a5cce7b-8e90-458d-a222-dac723a4cc17',
                market: 'LTC_BTC',
                quantity: '1.02848965',
                rate: '0.00972300',
                type: 'bid',
                nonce: 153807322004300,
                event: 'submit' },
        signature: 'H2DIMiNIn2Z4tpTf9ZvQUMzzFw6U464eGP6aCfHfFNl1B+RazoJ7aLb7gc8rSj5FZvC+hozyog14qv5/vrNeCBs=',
        nonce: 153807322004300
    },
    {
        account: 'mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL',
        payload:
            { orderId: '2a5cce7b-8e90-458d-a222-dac723a4cc17',
                nonce: 153807322096900,
                event: 'cancel' },
        signature: 'H7b1WfvEhldMJYRVGFqwm/yq78/XnmhB11aScK4GesVcX9cBJ+Nkb0Qm4oxVJJ6ctuJxWWNkqHU+MIaMz4E1oks=',
        nonce: 153807322096900 },
    {   account: 'mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL',
        payload:
            { orderId: '892c6e4f-3b5e-44bd-8bb8-a3e78563dbdd',
                nonce: 153807322096901,
                event: 'cancel' },
        signature: 'IBBeDv+BvGNESgKLDUIhGnQGXmm5gL/s/ndR+RRjJYtoOfZcl6Hex2ZmHNVz3LadS41BE0SgN2QgrakKSkmCkPk=',
        nonce: 153807322096901 },
    {   account: 'mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL',
        payload:
            { orderId: '68be44cc-42af-450e-920d-b9f27d5eaaa1',
                nonce: 153807322097100,
                event: 'cancel' },
        signature: 'IE15e8b9/jNu0LWzo+0qdaxGRXyLS2kM/aUy2Ag+hyl2ULjRsi1a26U/HLtxG3pV7EnryL/JgDUDG+CThmf6L/0=',
        nonce: 153807322097100 },
    {   account: 'mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL',
        payload:
            { orderId: 'de58d0c2-8ee2-4dd8-be4a-314ff9ad92c5',
                market: 'LTC_BTC',
                quantity: '1.02848990',
                rate: '0.00972300',
                type: 'bid',
                nonce: 153807322102200,
                event: 'submit' },
        signature: 'H1R15jn10vk7E4LRMhq1RiTCFvZhaGKINoX4nxL5WNbTE61mF1SHba3HtZjE9KcMz2EDbZ7z/NJwv3FJZggF9IE=',
        nonce: 153807322102200 },
    {   account: 'mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL',
        payload:
            { orderId: 'ded9619e-b1c4-460a-82cc-dba533121d9b',
                market: 'LTC_BTC',
                quantity: '1.00000000',
                rate: '0.00973500',
                type: 'ask',
                nonce: 153807322102300,
                event: 'submit' },
        signature: 'H8SoifMp3MEfsv/pYKSPw6f0wdr0bg6WEasVGiiErADnTwrq6LYnxDQ5PDswIohCLTXdefKdFi5NanNobixdU6I=',
        nonce: 153807322102300 },
    {   account: 'mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL',
        payload:
            { orderId: '2a5cce7b-8e90-458d-a222-dac723a4cc17',
                nonce: 153807322199400,
                event: 'cancel' },
        signature: 'H23HYsHLGjf52pWfO5tY+DtIFIBgFYOXBoTVuBCY7rdoEAEM1a0T2Va1hvd1NAcs0Z1L/HKyPLMjoKinEc9bPkQ=',
        nonce: 153807322199400 },
    {   account: 'mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL',
        payload:
            { orderId: '892c6e4f-3b5e-44bd-8bb8-a3e78563dbdd',
                nonce: 153807322199500,
                event: 'cancel' },
        signature: 'IMozL6egZ6dAU6CVnpIDc7OiBV1t7qWSG2EGyDU1KsXHF7T9dUVA6NkHxmqbuZ5IRkndQE1DKWdQ1DIjefGBBWg=',
        nonce: 153807322199500 },
    {   account: 'mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL',
        payload:
            { orderId: '68be44cc-42af-450e-920d-b9f27d5eaaa1',
                nonce: 153807322199600,
                event: 'cancel' },
        signature: 'H2Yc671uJS/L32Ec2vmObxytky64AWm9byfHW107SFl5HyyyTtFe0aS6vAZ+USWuILTnpUkDZf17HpJ4e7epjdg=',
        nonce: 153807322199600 },
    {   account: 'mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL',
        payload:
            { orderId: 'f7b00a78-cfc5-4776-b662-de11c90fe4fe',
                market: 'LTC_BTC',
                quantity: '0.20000000',
                rate: '0.00972500',
                type: 'bid',
                nonce: 153807322204700,
                event: 'submit' },
        signature: 'H9gQumkrJtoOl1bXYjJW8xE//Fuz7Ty5lTxXclROLverBKX6w1r7jc9ULqTa7I+DQQFzhKOgOplpR5r+UCWEJ6U=',
        nonce: 153807322204700 },
    {   account: 'mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL',
        payload:
            { orderId: 'efd73089-1fa2-45bc-b1b7-b5b2fbebe980',
                market: 'LTC_BTC',
                quantity: '0.82844876',
                rate: '0.00972300',
                type: 'bid',
                nonce: 153807322204900,
                event: 'submit' },
        signature: 'H8qxg5O830wuNlSKvUZbRTj1LA9ABSjKGGG7TMbyrs75delwYgf5ozaszGOzsD7ImPFB53n0yRRYHbNRFCzvBh4=',
        nonce: 153807322204900 },
    {   account: 'mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL',
        payload:
            { orderId: '7a80f082-d561-4a64-bc31-4ed0db5abf90',
                market: 'LTC_BTC',
                quantity: '0.87000000',
                rate: '0.00973600',
                type: 'ask',
                nonce: 153807322205000,
                event: 'submit' },
        signature: 'IFlec6E7kbGi8aL9R8RShuF0bnIgFjnOYBnxXv9JqnjNNSCJhc3PGDDvkZ2NVHCEYTAm3hnX3tKz4KH9dPE3C5E=',
        nonce: 153807322205000 },
    {   account: 'mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL',
        payload:
            { orderId: 'ef7b4a05-111e-47e6-b5cf-c1197683ef54',
                market: 'LTC_BTC',
                quantity: '0.13000000',
                rate: '0.00973900',
                type: 'ask',
                nonce: 153807322205100,
                event: 'submit' },
        signature: 'H34Z6EWiSzOZthDaPojo+ow44iEMum84SbxdGuhFaFdldGXgrXCpP+7+Ry2RroBzWurpKaqtIwprL1tgLuVmQws=',
        nonce: 153807322205100 },
    {   account: 'mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL',
        payload:
            { orderId: '2a5cce7b-8e90-458d-a222-dac723a4cc17',
                nonce: 153807322299100,
                event: 'cancel' },
        signature: 'IFSMGBz8+6AD5xCwywLqK2XrnP0x6gpz+O2ero/05vAvZYu8aD4KdJaNnHZiBMV6Idumr/tl9TLScy2AlByy8yE=',
        nonce: 153807322299100 },
]


const replay_order = async function (order) {
    let tag = TAG + ' | get_order | '
    try {
        //let allOrders = await get_all_orders()


        //get account nonce
        let nonce = await redis.hget('mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL','nonce')
        if(!nonce) nonce = 1
        log.info(tag,"nonce: ",nonce)
        nonce = parseInt(nonce) + 1
        order.payload.nonce = nonce
        //intercept and replace

        log.info(tag,"order: ",order)
        //replay event
        publisher.publish("tradeAgent",JSON.stringify(order))

        //pause
        await pause(1)
        //check balances
        let balanceBTC = await redis.hget('mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL','BTC')
        let balanceLTC = await redis.hget('mpJ19nmaDocEQdTBvh6jnD3pMFyp3rFYmL','LTC')
        log.info(tag,"BTC: ",balanceBTC," LTC: ",balanceLTC)


    } catch (e) {
        log.error('ERROR: ', e)
        throw e
    }
}

replay_order(orders[12])


// const replay_history = async function () {
//     let tag = TAG + ' | get_order | '
//     try {
//         //let allOrders = await get_all_orders()
//
//
//         for(let i = 3; i< allOrders.length; i++){
//             let order = allOrders[i]
//
//             replay_order(order)
//
//         }
//
//
//
//         return output
//     } catch (e) {
//         log.error('ERROR: ', e)
//         throw e
//     }
// }
//
// replay_history()
