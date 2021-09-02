import React, { Component } from 'react';
import { connect } from 'react-redux'
import { Row, Col, Progress, Card, CardBody, CardText } from 'reactstrap';
import FontAwesome from 'react-fontawesome'
import URLS from '../constants/urls'
import {push} from "react-router-redux";
import ReactSVG from 'react-svg';
import BaseLeftPage from '../elements/BaseLeftPage'
import {ClosePageAction} from '../actions/LeftPage'

import walletMapView from '../views/wallets.js'
//TODO get from server ^


let walletSummary = {
    cold:{
        id:"cold",
        long:"Hardware Cold storage",
        active:false,
    },
    trade:{
        id:"trade",
        active:true,
        long:"Custodial Account (Trading)",
    },
    joint:{
        id:"joint",
        long:"Joint Custody Wallet",
        active:true,
    },
}

let walletMap = Object.keys(walletSummary)

class Wallet extends Component{

    render() {

        const {push, theme, ClosePageAction} = this.props;

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
                                <div className="d-flex flex-column wallet-icon" onClick={() => push("wallet/"+walletSummary[walletName].id)}>
                                    <div className='text-center'>
                                        <img src={theme.wallet_1}/>
                                    </div>
                                    <p className='it-fs14 it_light_opacity'>{walletSummary[walletName].long}</p>
                                </div>
                            ))
                        }
                    </div>


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