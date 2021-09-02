import React, { Component } from 'react';
import { connect } from 'react-redux'
import { Row, Col, Progress, Card, CardBody, CardText } from 'reactstrap';
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

class Wallet extends Component{

    constructor(props) {
        super(props);

        this.state = {
            coinSelected:null,
            depositAddress:"",
            selectedBalance:"",
            selectedAsset:"BTC",
            selectedValueUSD:""
        }
    }

    async componentDidMount(){
        let wallet = this.props.match.params.wallet

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
        let accountInfo = await arbClient.getInfo()
        //accountInfo = accountInfo.payload
        console.log("accountInfo: ",accountInfo)

        //pass info and render view
        let walletView = walletViewFactory.walletView(accountInfo)
        console.log("walletView: ",walletView)

        pieChartInfo = walletView.pieChartInfo
        assets = walletView.assets
    }


    async onDeposit(){

        //get address from api
        let depositAddress = await arbClient.address("BTC")
        console.log("deposit Address:  ",depositAddress)

        //display it
        this.setState({
            depositAddress:depositAddress
        })
    }

    async onWithdraw(){

        //get address from api
        let depositAddress = arbClient.address("BTC")
        console.log("deposit Address:  ",depositAddress)

        //display it

    }


    render() {
        let wallet = this.props.match.params.wallet
        // let pieChartInfo = []
        // if(walletSummary && walletSummary[wallet] && walletSummary[wallet].pieChartInfo) pieChartInfo = walletSummary[wallet].pieChartInfo
        // let assets = walletSummary[wallet].assets

        console.log("wallet: ",wallet)
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
                <div className='it_wallet'>
                    <Row className='justify-content-between'>
                        <Col className='mt-3'>
                            <p className='it_page_title'>My wallets</p>
                        </Col>
                        <Col className='mt-3'>
                            <div className='it_cycle_times' onClick={() => ClosePageAction(URLS.Trading)}>
                                <ReactSVG
                                    path={require('../assets/icons/close_bg.svg')}
                                />
                            </div>
                        </Col>
                    </Row>
                    <div className="d-flex flex-row wallet-icon-gr it-pointer">
                        {
                            walletMap.map(walletName => (
                                <div className="d-flex flex-column wallet-icon" onClick={() => push(walletSummary[walletName].id)}>
                                    <div className='text-center'>
                                        <img src={theme.wallet_1}/>
                                    </div>
                                    <p className='it-fs14 it_light_opacity'>{walletSummary[walletName].long}</p>
                                </div>
                            ))
                        }
                    </div>

                    <Progress multi className='mt-3 mr-4'>
                        {

                            pieChartInfo.map((item, i) => (
                                <div className="progress-bar" role="progressbar" style={{width: `${item[0]}%`, backgroundColor: item[1]}} aria-valuenow={item[0]} aria-valuemin="0" aria-valuemax="100">
                                    <span className='progress_text'>{item[2]}</span>
                                </div>
                            ))

                            // [
                            //     ['32', '#ff9300', '32% BTC'],
                            //     ['15', '#aeaeae', '15% LTC'],
                            //     ['36', '#d8d8d8', '36% ETH'],
                            //     ['17', '#008fec', '17% DASH'],
                            //     ['22', '#ff6600', '22% XMR'],
                            // ].map((item, i) => (
                            //     <div className="progress-bar" role="progressbar" style={{width: `${item[0]}%`, backgroundColor: item[1]}} aria-valuenow={item[0]} aria-valuemin="0" aria-valuemax="100">
                            //         <span className='progress_text'>{item[2]}</span>
                            //     </div>
                            // ))
                        }
                    </Progress>


                    <Row className='currency-block'>
                        <Col md={3} xl={3} lg={3} className='col-3 it-pointer'>
                            <Card onClick={() => push(URLS.AddCurrency)}>
                                <CardBody>
                                    <div className='add_carrency'>
                                        <img src={plusIcon}></img>
                                    </div>
                                    <div className='text-center mt-1'>
                                        <span className='add_carrency_title'>Add currency</span>
                                    </div>
                                </CardBody>
                            </Card>
                            {
                                assets.map(asset => (
                                    //className='card_active'
                                    <Card>
                                        <CardBody>
                                            <div className="d-flex justify-content-center text-center">
                                                <div className='oval bg-warning'/>
                                                <div className='it-fs14 it-medium'>{asset.symbol}</div>
                                            </div>
                                            <CardText className='text-center'>
                                                <span className='it-fs18 it-medium'>{asset.amount} {asset.symbol}</span>
                                                <div className='it-fs14 it_light_opacity'>$ {asset.valueUSD}</div>
                                            </CardText>
                                        </CardBody>
                                    </Card>
                                ))
                            }

                        </Col>
                        <Col md={9} xl={9} lg={9} className='col-9 current_currency'>
                            <div className='text-center'>
                                {this.state.coinSelected}
                                <img src='https://chain.so/Bitcoin@2x.png' className='cr-logo'/>
                                <div className='it-fs34 mt-3 it-medium'>
                                    {this.state.selectedBalance} {this.state.selectedAsset}
                                </div>
                                <div className='it-fs18 it-half-opacity'>
                                    $ {this.state.selectedValueUSD}
                                </div>

                                {this.state.depositAddress}

                                <br></br>
                                <QRCode value={"bitcoin:"+this.state.depositAddress} size={160}/>
                            </div>
                            <div className="d-flex justify-content-center big_top_p it-pointer">
                                <div className='mr-4' onClick={() => this.onDeposit()}>
                                    <div className='oval-big'>
                                        <img src={depIcon}></img>
                                    </div>
                                    <div className='text-center it-fs18 mt-3'>Deposit</div>
                                </div>
                                <div className='mx-4' onClick={() => this.onWithdraw()}>
                                    <div className='oval-big'>
                                        <img src={witIcon}></img>
                                    </div>
                                    <div className='text-center it-fs18 mt-3'>Withdraw</div>
                                </div>
                                {/*<div className='ml-4'>*/}
                                {/*<div className='oval-big'>*/}
                                {/*<ReactSVG*/}
                                {/*path={require('../assets/icons/tran.svg')}*/}
                                {/*className='oval-big-svg'*/}
                                {/*/>*/}
                                {/*</div>*/}
                                {/*<div className='text-center it-fs18 mt-2'>Transfer</div>*/}
                                {/*</div>*/}
                            </div>
                            <div className='text-primary text-center big_top_p'>
                                See bitcoin transactions
                            </div>
                        </Col>
                    </Row>
                </div>

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
