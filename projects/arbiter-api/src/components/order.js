import React, { Component } from 'react';
import { connect } from 'react-redux'
import { Row, Col, Progress, Card, CardBody, CardText, Table } from 'reactstrap';
import FontAwesome from 'react-fontawesome'
import URLS from '../constants/urls'
import {push} from "react-router-redux";
import ReactSVG from 'react-svg';
import BaseLeftPage from '../elements/BaseLeftPage'
import {ClosePageAction} from '../actions/LeftPage'
import walletViewFactory from '../views/wallets.js'
import arbClient from '@arbiter/arb-api-client'
import { API_HOST } from '../config'
import QRCode from 'qrcode.react'

import plusIcon from '../assets/icons/plus.svg'
import depIcon from '../assets/icons/dep.svg'
import witIcon from '../assets/icons/wit.svg'

let walletMap = []
let walletSummary = []
let pieChartInfo = []
let assets = []

// let walletMap = walletMapView.walletMap
// let walletSummary = walletMapView.walletSummary


// let orderInfo =
//     {
//         account: 'mht1Dn6YqEnYkd1yGh2kPrxUG3gHepevz7',
//         market: 'LTC_BTC',
//         orderId: 'cf94f3df-679f-4f56-a236-8daab18eedf4',
//         amountQuote: '0.00012326',
//         rate: '0.012326',
//         type: 'bid',
//         owner: 'liquidityAgent',
//         coinIn: 'BTC',
//         coinOut: 'LTC',
//         coinFunding: 'BTC',
//         BTC: '0',
//         price: '0.012326',
//         quantity: '0.01',
//         LTC: '0'
//     }


let orderInfo
let orderParams = []
class Wallet extends Component{

    constructor(props) {
        super(props);

        this.state = {
            orderInfo:{},
            orderParams:[],
            coinSelected:null,
            depositAddress:""
        }
    }

    async componentDidMount(){
        let orderId = this.props.match.params.order

        //get wallet info for user
        // walletMap = walletMapView.walletMap
        // walletSummary = walletMapView.walletSummary
        // pieChartInfo = walletSummary[wallet].pieChartInfo
        // assets = walletSummary[wallet].assets

        //get account info
        let accountSigning = localStorage.getItem('signingAddress')
        let accountPriv = localStorage.getItem('signingPriv')
        arbClient.init(API_HOST,accountSigning,accountPriv)

        //get balances
        orderInfo = await arbClient.order(orderId)
        console.log("orderInfo: ",orderInfo)

        //orderInfo = orderInfo.payload
        orderParams = Object.keys(orderInfo)
        this.setState({
            orderInfo:orderInfo,
            orderParams:orderParams
        })
    }




    render() {
        let orderId = this.props.match.params.order
        // let pieChartInfo = []
        // if(walletSummary && walletSummary[wallet] && walletSummary[wallet].pieChartInfo) pieChartInfo = walletSummary[wallet].pieChartInfo
        // let assets = walletSummary[wallet].assets

        console.log("orderId: ",orderId)
        // console.log("pieChartInfo: ",pieChartInfo)
        // console.log("assets: ",assets)

        const {push, theme, ClosePageAction} = this.props;

        //TODO state selected asset



        return (
            <BaseLeftPage
                BasePageProps={{
                    active: [false, false, false],
                    wallet_active: true
                }}
            >
                <h1>Order: {orderId}</h1>

                <Table className='border-bottom table-night'>
                    <thead>
                    <tr>
                        {/*<th><span className='it-dashed'>orderId</span></th>*/}
                        {/*<th>market</th>*/}
                        {/*<th><span className='it-dashed'>price</span></th>*/}
                        {/*<th><span className='it-dashed'>quantity</span></th>*/}
                        {/*<th><span className='it-dashed'>type</span></th>*/}
                    </tr>
                    </thead>
                    <tbody>
                    {

                        orderParams.map(param => (
                            <tr>
                                <td>
                                    <span className='it-fs16 ml-3 it-medium'>{param}:   {orderInfo[param]} </span>
                                </td>


                            </tr>
                        ))
                    }
                    </tbody>
                </Table>
            </BaseLeftPage>
        )
    }
}

const mapStateToProps = state => {
    return {
        theme: state.theme
    }
};

const mapDispatchToProps = dispatch => {
    return {
        push: url => dispatch(push(url)),
        ClosePageAction: url => dispatch(ClosePageAction(url))
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(Wallet);
