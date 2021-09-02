'use strict'
import React from 'react'
import QRCode from 'qrcode.react'
import { connect } from 'react-redux'
import {ClosePageAction} from '../../actions/LeftPage'
import {push} from "react-router-redux";
import ReactSVG from 'react-svg';
import walletIcon from '../../assets/icons/wallet.svg'

import {
    Card, CardBody, Row, Col, Button,
    FormGroup, Label, Input, Table,
    Dropdown, DropdownToggle, DropdownMenu, DropdownItem
} from 'reactstrap';


let assetNames = {
    BTC:"bitcoin",
    LTC:"litecoin",
    ETH:"ethereum",
    GNT:"golum",
}

export class StepThree extends React.Component {
    constructor () {
        super()
        this.state = {
            email: '',
            emailConfirm: ''
        }
        this.handleEmailChanged = this.handleEmailChanged.bind(this);
        this.handleEmailConfirmChanged = this.handleEmailConfirmChanged.bind(this);
    }

    async componentDidMount(){

        console.log("STEP 3: props: ",this.props)

        console.log("STEP 3: props: depositAddress: ",this.props.depositAddress)
        console.log("STEP 3: props: coinIn: ",this.props.coinIn)
        console.log("STEP 3: props: depositAmount: ",this.props.depositAmount)

    }

    handleEmailChanged (event) {
        this.setState({email: event.target.value})
    }

    handleEmailConfirmChanged (event) {
        this.setState({emailConfirm: event.target.value})
    }

    handleJoinCustortClick (event) {
        this.setState({emailConfirm: event.target.value})
    }


    render () {
        const {push, theme, ClosePageAction} = this.props;

        return (
            <div>

                <div class="container">
                    <div class="row">
                        <div class="col-xs-6">

                            <div className='it_wallet'>
                                <Row className='justify-content-between'>
                                    <Col className='mt-3'>
                                        <p className='it_page_title'>My wallets</p>
                                    </Col>
                                </Row>
                                Funding Options

                                <div className="d-flex flex-row wallet-icon-gr it-pointer">
                                    {
                                        this.props.walletMap.map(walletName => (
                                            <div className="d-flex flex-column wallet-icon" onClick={() => this.handleJoinCustortClick()}>
                                                <div className='text-center'>
                                                    <img src={walletIcon}/>
                                                </div>
                                                <p className='it-fs14 it_light_opacity'>{this.props.walletSummary[walletName].long}</p>
                                            </div>
                                        ))
                                    }
                                </div>


                            </div>

                        </div>
                        <div class="col-xs-6">


                            <h3>Fund order:</h3> {this.props.orderId}
                            <p></p>
                            <QRCode value={"bitcoin:?"+this.props.depositAddress+"amount="+this.props.depositAmount} />
                            <p></p>
                            Send: {this.props.depositAmount} ({this.props.coinIn}) <img src={"https://static.coincap.io/assets/icons/"+this.props.coinIn.toLowerCase()+"@2x.png"}/> <p></p>Address: {this.props.depositAddress}

                        </div>
                        <p></p>

                    </div>
                </div>

                <p></p>

            </div>
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

export default connect(mapStateToProps, mapDispatchToProps)(StepThree);