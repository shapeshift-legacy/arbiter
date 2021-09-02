
const TAG = " | audit-nexus | "

require('dotenv').config({path: '../.env'});
const log = require('@arbiter/dumb-lumberjack')()
let mongo = require('@arbiter/arb-mongo')
// let views = require('@arbiter/arb-views')
// let signing = require('@arbiter/arb-signing')


module.exports = {
    auditAccount: function (account) {
        return audit_from_scratch(account);
    },
    // auditEvent: function (trade, i, balances, balanceValuesBTC, balanceValuesUSD, prevBlock) {
    //     return audit_event(trade, i, balances, balanceValuesBTC, balanceValuesUSD, prevBlock);
    // },
    // digestTrade: function (trade) {
    //     return digest_trade(trade);
    // },
    // digestTransfer: function (transfer) {
    //     return digest_transfer(transfer);
    // },
}


let audit_from_scratch = async function(account){
    let tag = TAG + " | audit_from_scratch | "+account+" | "
    try{

        //get all txs

        let txs = await mongo['wallet-'+account+'-txs'].find({},{sort:{time:1}})
        log.info(tag,"txs: ",txs.length)
        log.debug(tag,"txs: ",txs)

        let totalFees = 0
        let totalCredits = 0
        let totalDebits = 0
        let nonce = 0
        let balance = 0
        for(let i = 0; i < txs.length; i++){
            let tx = txs[i]
            log.debug(tag,"tx: ",tx)

            let fee
            if(tx.category === 'receive') {
                fee = 0
                totalCredits = totalCredits + tx.amount
            }else{
                fee = tx.fee
                totalFees = totalFees + Math.abs(fee)
                totalDebits = totalDebits + Math.abs(tx.amount)
                balance = balance + tx.fee
            }

            balance = balance + tx.amount

            let summary = "txid: "+tx.txid+" type: "+tx.category+" amount: "+tx.amount+" fee:"+fee
            log.info(tag,summary)



            nonce = nonce + 1
            let block = {
                time:tx.time,
                balance,
                nonce,
                txid:tx.txid,
                type:tx.category,
                amount:tx.amount,
                fee
            }
            try{
                mongo['wallet-'+account+'-balances'].insert(block)
            }catch(e){
            }



        }

        let balanceFinal = totalCredits - totalDebits
        let summary = {balance:balanceFinal,credits:totalCredits,debits:totalDebits,fees:totalFees}
        log.info(tag,"summary: ",summary)

        return summary
    }catch(e){
        console.error(e)
    }
}

audit_from_scratch('btc')
