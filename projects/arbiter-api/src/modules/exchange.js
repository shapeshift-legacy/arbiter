

/*
    Exchange modules
    
    
    Arbiters Reference client

        Features:
            * Maintain Example Full Node/wallets expecting standard RPC's
            * Generate, Build and maintain HD wallet
            * Associate HD wallet with account on arbiter
            * Query order history based on PubKeys
            * Build transaction log of local trades
            * Create new order on arbiter
            * Cancel order on arbiter
            * Retarget order rate on arbiter
            * Create automated trading pattern
            * Maintain records on all trade history
            * Export trade history in (xyz) format

 */






module.exports = {
    getAccount:function(){
        return get_account()
    },
    signUp:function(btcSigningPub, ethAddress,privKey){
        return sign_up(btcSigningPub, ethAddress,privKey)
    },
    // broadCastOracle:function(coin,tx, orderId){
    //     return push_tx_oracle(coin,tx, orderId)
    // },
    // markets:function(){
    //     return get_markets()
    // },
    //
    // coins:function(){
    //     return get_coins()
    // },
    //
    // txid:function(txid){
    //     return get_txid(txid)
    // },
    //
    // // trade:function(input){
    // //     return create_order(input)
    // // },
    //
    // trade:function(amountIn,coinIn,amountOut,coinOut){
    //     return make_trade(amountIn,coinIn,amountOut,coinOut)
    // },
    //
    // ethWalletFactoryAddress: function() {
    //     return ethWalletFactoryAddress()
    // },
    //
    // orderCreate:function(input){
    //     return create_order(input)
    // },
    //
    // updateAccount: function(ethAddress, contractAddress) {
    //     return update_account(ethAddress, contractAddress)
    // },
    //
    // pairs:function(){
    //     return get_pairs()
    // },
    //
    // status:function(orderId){
    //     return get_order_status(orderId)
    // },
    //
    // getOrder:function(orderId){
    //     return get_order(orderId, ARBITER_URL)
    // },
    //
    // getOrderOracle:function(orderId){
    //     return get_order(orderId, ORACLE_URL)
    // },
    //
    // statusOracle:function(orderId){
    //     return get_order_status_oracle(orderId)
    // },
    //
    // retarget:function(orderId,rate){
    //     return retarget_order(orderId,rate)
    // },
    //
    // orders:function(){
    //     return orders()
    // },
    //
    // ordersLive:function(account){
    //     return get_all_orders_live(account)
    // },
    //
    // ordersAll:function(account){
    //     return get_all_orders(account)
    // },
    //
    // orderbook:function(pair){
    //     return get_orderbook(pair)
    // },
    //
    // cancel:function(orderId){
    //     return cancel_order(orderId)
    // },
    //
    // cancelOracle:function(orderId){
    //     return cancel_order_oracle(orderId)
    // },
    //
    // broadcastOracle:function(tx){
    //     return push_tx_oracle(tx)
    // },
}

//******************************************************************************
//   Primary
//******************************************************************************

let onSignUpWithArbiter = async function (account,ethAddress) {
    try {
        //get account address
        let accountPrivKey = localStorage.getItem('signingPriv')
        console.log("accountPrivKey: ",accountPrivKey)

        //save all the things??

        //build payload
        let payload = {
            action:"create",
            ethAddress
        }

        //sign payload
        var keyPair = bitcoin.ECPair.fromWIF(accountPrivKey)
        var privateKey = keyPair.d.toBuffer(32)
        var message = JSON.stringify(payload)

        let signature = bitcoinMessage.sign(message, privateKey, keyPair.compressed)
        signature = signature.toString('base64')
        console.log("signature: ",signature)


        let body = {account,payload,signature}
        console.log("body: ",body)

        let url = API_HOST+'/api/v1/account'
        console.log("url: ",url)

        let result = await axios.post(API_HOST+'/api/v1/account', body)
        console.log("result: ",result)

        return result
    } catch (error) {
        return error
    }
};




//******************************************************************************
//   Lib
//******************************************************************************