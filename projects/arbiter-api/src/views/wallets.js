/*

    Render views for given API data




 */

const TAG = " | wallets | "


let balancesCustodial = [
    {
        symbol:"BTC",
        name:"Bitcoin",
        valueUSD:"",
        amount:"0.0013"
    },
    {
        symbol:"LTC",
        name:"Litecoin",
        valueUSD:"",
        amount:"1"
    },
    {
        symbol:"ETH",
        name:"Ethereum",
        valueUSD:"",
        amount:"1.001"
    },
]

let balancesCustodialJSON = {
    "BTC":{
        symbol:"BTC",
        name:"Bitcoin",
        valueUSD:"",
        amount:"0.0013"
    },
    "LTC":{
        symbol:"LTC",
        name:"Litecoin",
        valueUSD:"",
        amount:"1"
    },
    "ETH":{
        symbol:"ETH",
        name:"Ethereum",
        valueUSD:"",
        amount:"1.001"
    }
}



let balancesJoint = [
    {
        symbol:"BTC",
        name:"Bitcoin",
        address:"fakeaddressbro",
        valueUSD:"",
        amount:"0.0013"
    },
    {
        symbol:"LTC",
        name:"Litecoin",
        address:"fakeaddressbro",
        valueUSD:"",
        amount:"1"
    },
    {
        symbol:"ETH",
        name:"Ethereum",
        address:"fakeaddressbro",
        valueUSD:"",
        amount:"1.001"
    },
]

let balancesJointJSON = {
    "BTC":{
        symbol:"BTC",
        name:"Bitcoin",
        valueUSD:"",
        amount:"0.0013"
    },
    "LTC":{
        symbol:"LTC",
        name:"Litecoin",
        valueUSD:"",
        amount:"1"
    },
    "ETH":{
        symbol:"ETH",
        name:"Ethereum",
        valueUSD:"",
        amount:"1.001"
    }
}


let balancesCold = [
    {
        symbol:"BTC",
        name:"Bitcoin",
        address:"fakeaddressbro",
        valueUSD:"",
        amount:"0.0013"
    },
    {
        symbol:"LTC",
        name:"Litecoin",
        address:"fakeaddressbro",
        valueUSD:"",
        amount:"1"
    },
    {
        symbol:"ETH",
        name:"Ethereum",
        address:"fakeaddressbro",
        valueUSD:"",
        amount:"1.001"
    },
]


let balancesColdJSON = {
    "BTC":{
        symbol:"BTC",
        name:"Bitcoin",
        valueUSD:"",
        amount:"0.0013"
    },
    "LTC":{
        symbol:"LTC",
        name:"Litecoin",
        valueUSD:"",
        amount:"1"
    },
    "ETH":{
        symbol:"ETH",
        name:"Ethereum",
        valueUSD:"",
        amount:"1.001"
    }
}

let pieChartInfoCold = [
    ['32', '#ff9300', '12% BTC'],
    ['15', '#aeaeae', '35% LTC'],
    ['36', '#d8d8d8', '36% ETH'],
]

let pieChartInfoTrade = [
    ['32', '#ff9300', '12% BTC'],
    ['15', '#aeaeae', '35% LTC'],
    ['36', '#d8d8d8', '36% ETH'],
]

let pieChartInfoJoint= [
    ['32', '#ff9300', '32% BTC'],
    ['15', '#aeaeae', '45% LTC'],
    ['36', '#d8d8d8', '16% ETH'],
]


let walletSummary = {
    cold:{
        id:"cold",
        long:"Hardware Cold storage",
        active:false,
        assets:balancesCold,
        pieChartInfo:pieChartInfoCold,
        lastTx:new Date().getTime(),
    },
    trade:{
        id:"trade",
        active:true,
        long:"Custodial Account (Trading)",
        assets:balancesCustodial,
        pieChartInfo:pieChartInfoTrade,
        lastTx:new Date().getTime(),
    },
    joint:{
        id:"joint",
        long:"Joint Custody Wallet",
        active:true,
        assets:balancesJoint,
        pieChartInfo:pieChartInfoJoint,
        lastTx:new Date().getTime(),
    },
}

let walletMap = Object.keys(walletSummary)


let longNames = {
    BTC:"Bitcoin",
    LTC:"Litecoin",
    ETH:"Ethereum",
    GNT:"Golem"
}

let assetColors = {
    BTC:"f2a900",
    LTC:"d3d3d3",
    ETH:"3c3c3d",
    GNT:"b0c5e8"
}

/*
    input: accountInfo

     {
         account: 'mzN4kBEgDcQrZWb6bGfStUbMEWykhBdXbr',
         payload:
             {
                type: 'Liquidity agent',
                account: 'mht1Dn6YqEnYkd1yGh2kPrxUG3gHepevz7',
                nonce: '154161484198800',
                balances: {
                    BTC: '98329893'
                }
             },
         signature:'H2jw0oPuNxw1qTnzQJCUydSQhC5PFgBgnDOcIpbGydZ4G6tcf5uihSY2wOUd8H8jraj3eHoXFYfV6RIa57wfKiY='
     }

 */

let walletView = function(accountInfo){
    let tag = TAG +  " | walletViewFactory | "
    try{
        let view = {}
        view.assets = []
        view.pieChartInfo = []

        if(accountInfo.payload) accountInfo = accountInfo.payload

        //
        let assets = Object.keys(accountInfo.balances)
        for(let i =0; i < assets.length; i++){
            let asset = assets[i]
            let entry = {
                symbol:asset,
                name:longNames[asset],
                amount:accountInfo.balances[asset],
                valueUSD:""
            }

            view.assets.push(entry)
        }


        //calculate pie chart
        for(let i =0; i < assets.length; i++){
            let asset = assets[i]
            let piechartEntry = []

            piechartEntry.push(100)
            piechartEntry.push("#"+assetColors[asset])
            piechartEntry.push("100% BTC")
            view.pieChartInfo.push(piechartEntry)
        }

        return view
    }catch(e){
        console.error(e)
    }
}


export default {walletMap,walletSummary,walletView}