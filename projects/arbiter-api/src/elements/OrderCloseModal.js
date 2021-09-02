import React, { Component } from 'react';
import {connect} from "react-redux";
import { Modal } from 'reactstrap';
import {LineChart, Line, CartesianGrid, ReferenceLine, XAxis, ResponsiveContainer} from 'recharts';
import {FacebookIcon, TwitterIcon} from 'react-share';
import {set_order_close_modal} from '../actions/menu'
import ReactSVG from 'react-svg';
import {
    Card, CardBody, Row, Col, Button,
    FormGroup, Label, Input, Table,
    Dropdown, DropdownToggle, DropdownMenu, DropdownItem
} from 'reactstrap';
import arbClient from '@arbiter/arb-api-client'
import expandOrders from '../assets/icons/close_bg.svg'
import expandOrdersWhite from '../assets/icons/white_close_bg.svg'
import MultiStep     from '../components/jc_order_creation/multiStep'
//import { steps }   from '../components/jc_order_creation/index'
import { StepOne }   from '../components/jc_order_creation/StepOne'
import { StepTwo }   from '../components/jc_order_creation/StepTwo'
import { StepThree } from '../components/jc_order_creation/StepThree'
import { API_HOST } from '../config'
let accountSigning = localStorage.getItem('signingAddress')
let accountPriv = localStorage.getItem('signingPriv')
arbClient.init(API_HOST,accountSigning,accountPriv)

let balancesCold = {
    BTC:0.001,
    LTC: 1.01
}

let balancesCustody = {
    BTC:0.002,
    LTC: 2.01
}

let assetNames = {
    BTC:"bitcoin",
    LTC:"litecoin",
}


let walletSummary = {
    cold:{
        id:"cold",
        long:"Hardware Cold storage",
    },
    trade:{
        id:"trade",
        active:true,
        long:"Custodial Account (Trading)",
    },
}
let walletMap = Object.keys(walletSummary)

class OrderCloseModal extends Component{

    constructor(props) {
        super(props);

        this.state = {
            price:"",
            amount:"",
            orderType:"",
            market:"",
            coinIn:"",
            coinOut:"",
            balancesCold,
            balancesCustody,
            walletSummary,
            walletMap,
            depositAddress:"",
            depositAmount:"",
            arbiterResponse:{account:"",payload:{status:"pending"},signature:""},
            oracleResponse:{account:"",payload:{status:"pending"},signature:""},
            returnAddress:"",
            withdrawalAddress:""
        }
        this.handleWithdrawalAddressUpdate = this.handleWithdrawalAddressUpdate.bind(this);
        this.handleReturnAddressUpdate = this.handleReturnAddressUpdate.bind(this);
        this.handleSubmitArbiter = this.handleSubmitArbiter.bind(this);
        this.handleSubmitOracle = this.handleSubmitOracle.bind(this);
        this.onTransition = this.onTransition.bind(this);
    }

    async componentDidMount(){
        console.log("componentDidMount: ***************")
        //get coin in/out
        let coinIn
        let coinOut
        let orderType = this.props.orderType
        console.log("formType: ",orderType)
        let market = this.props.market
        let coins = market.split("_")
        if(orderType === 'ask'){
            coinIn = coins[0]
            coinOut = coins[1]
        }else if(orderType === 'bid'){
            coinIn = coins[1]
            coinOut = coins[0]
        } else {
            console.error(" unable to determine order type! ")
        }
        console.log("coinIn: ",coinIn)
        console.log("coinOut: ",coinOut)
        // this.setState({
        //     returnAddress:localStorage.getItem('cold'+coinIn),
        //     withdrawalAddress:localStorage.getItem('cold'+coinOut)
        // })
        // this.props.returnAddress = localStorage.getItem('cold'+coinIn)
        // this.props.withdrawalAddress = localStorage.getItem('cold'+coinOut)

        // localStorage.setItem('coldBTC',"mrPtLrXqhYX9Len1xjcDrUDRhCUfVa9dTb")
        // localStorage.setItem('coldLTC',"QdZp27Tkaxds3hKT7u4TgGyER45Fu6YAkV")
        // localStorage.setItem('coldETH',"0x33b35c665496bA8E71B22373843376740401F106")
        // localStorage.setItem('coldGNT',"0x33b35c665496bA8E71B22373843376740401F106")

        console.log("props: ",this.props)
        console.log("*********** props: ",this.props.orderPrice)

        this.setState({
            price:this.props.price,
            amount:this.props.amount,
            orderType:this.props.orderType,
            coinIn,
            coinOut,
            market:this.props.market,
        })

    }

    async handleSubmitArbiter(){
        console.log("handleSubmitArbiter: ")
    }

    async handleSubmitOracle(){
        console.log("handleSubmitOracle: ")
    }

    async onTransition(){
        console.log("onTransition")
        console.log("State: ",this.state)
        console.log("props: ",this.props)

        this.setState({
            price:this.props.price,
            amount:this.props.amount,
            orderType:this.props.orderType,
            market:this.props.market,
        })



        //is nav state good
        let orderInfo = {
            rate:this.props.price,
            pair:"LTC_BTC",
            amountIn:this.props.amount,
            expiration:0.1,
            pubkey:"0273e9b70abce8233229a0c7afbeb9bfd240f9bfc524e7cb398f75868d4b17a42f",
            orderType:this.props.orderType,
            market:this.props.market,
            returnAddress:this.state.returnAddress,
            withdrawalAddress:this.state.withdrawalAddress
        }
        console.log("orderInfo: ",orderInfo)

        //if complete
        //TODO pass errors to front!
        if(!orderInfo.rate) console.error("101: rate missing")
        if(!orderInfo.pubkey) console.error("100: pubkey missing")
        if(!orderInfo.amountIn) console.error("102: amountIn missing")
        if(!orderInfo.orderType) console.error("103: orderType missing")
        if(!orderInfo.returnAddress) console.error("104: returnAddress missing")
        if(!orderInfo.withdrawalAddress) console.error("105: withdrawalAddress missing")

        //submit

        //state state to result arbiter
        let resultArbiter = await arbClient.orderCreate(orderInfo)
        console.log("resultArbiter: ",resultArbiter)
        console.log("resultArbiter orderId: ",resultArbiter.payload.orderId)
        console.log("resultArbiter depositAddress: ",resultArbiter.payload.depositAddress)


        let resultOracle = await arbClient.getOrderOracle(resultArbiter.payload.orderId)
        console.log("resultOracle: ",resultOracle)

        this.setState({
            arbiterResponse:resultArbiter,
            oracleResponse:resultOracle,
            depositAmount:resultArbiter.payload.amountIn,
            depositAddress:resultArbiter.payload.depositAddress,
            coinIn:resultArbiter.payload.coinIn,
            orderId:resultArbiter.payload.orderId
        })

        //set state to result oracle
        //let resultOracle = await arbClient.lookupOracle(orderInfo)

        //validate payloads:


    }

    async handleWithdrawalAddressUpdate (event) {
        console.log("handleWithdrawalAddressUpdate: ",event)
        // console.log("handleWithdrawalAddressUpdate: ",event.target)
        console.log("handleWithdrawalAddressUpdate: ",event.target.value)

        this.setState({
            withdrawalAddress:event.target.value
        })
    }

    async handleReturnAddressUpdate (event) {
        console.log("handleReturnAddressUpdate: ",event)
        console.log("handleReturnAddressUpdate: ",event.target.value)
        this.setState({
            returnAddress:event.target.value
        })
    }


    render() {

        const {order_close_modal, set_order_close_modal, theme, price,amount,orderType} = this.props;

        const data = [
            {name: 'Page A', uv: 4000, pv: 2400, amt: 2400},
            {name: 'Page B', uv: 3000, pv: 1398, amt: 2210},
            {name: 'Page C', uv: 2000, pv: 9800, amt: 2290},
            {name: 'Page D', uv: 2780, pv: 3908, amt: 2000},
            {name: 'Page E', uv: 1890, pv: 4800, amt: 2181},
            {name: 'Page F', uv: 2390, pv: 3800, amt: 2500},
            {name: 'Page G', uv: 3490, pv: 4300, amt: 2100},
        ];

        return (
            <Modal
                isOpen={order_close_modal}
                toggle={() => set_order_close_modal(false)}
                className={`it-modal ${theme.night_class}`}
            >

                <div>
                    <MultiStep onTransition={this.onTransition} steps={[
                        {name: 'Create', component: <StepOne
                            market={this.props.market}
                            orderPrice={this.props.price}
                            orderAmount={this.props.amount}
                            orderType={this.props.orderType}
                            withdrawalAddress={this.state.withdrawalAddress}
                            withdrawalAddressUpdate={this.handleWithdrawalAddressUpdate}
                            returnAddress={this.state.returnAddress}
                            returnAddressUpdate={this.handleReturnAddressUpdate}
                        />},
                        {name: 'Verify', component: <StepTwo
                            arbiterResponse={this.state.arbiterResponse}
                            oracleResponse={this.state.oracleResponse}
                            orderParamsOra={Object.keys(this.state.oracleResponse.payload)}
                            orderParamsArb={Object.keys(this.state.arbiterResponse.payload)}
                        />},
                        {name: 'Fund', component: <StepThree
                            balancesCold={this.state.balancesCold}
                            orderId={this.state.orderId}
                            balancesCustody={this.state.balancesCustody}
                            walletMap={this.state.walletMap}
                            walletSummary={this.state.walletSummary}
                            depositAddress={this.state.depositAddress}
                            depositAmount={this.state.depositAmount}
                            coinIn={this.state.coinIn}
                        />},
                    ]}/>
                </div>


            </Modal>
        )
    }
}

const mapStateToProps = state => {
    console.log("state:",state )
    return {
        theme: state.theme,
        order_close_modal: state.modals.order_close,
        price:state.modals.price,
        amount:state.modals.amount,
        orderType:state.modals.orderType,
        market:state.modals.market
    }
};

const mapDispatchToProps = dispatch => {
    return {
        set_order_close_modal: modal => dispatch(set_order_close_modal(modal))
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(OrderCloseModal);
