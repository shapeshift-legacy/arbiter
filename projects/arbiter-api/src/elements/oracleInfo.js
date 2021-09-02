import React, { Component } from 'react';
import { connect } from 'react-redux'
import { Badge, Button } from 'reactstrap';
import FontAwesome from 'react-fontawesome'
import {push} from "react-router-redux";
import ReactSVG from 'react-svg';
import dogeIcon from '../assets/logo.png'

let oracleInfo = {
    name:"Dogecoin bros",
    created:new Date().getTime(),
    address:"",
    bio:"Much wow, very oracle, trust doge",
    signatureBio:"",
    location:"The Dog house, russia",
    subscribers:[
        {user:"123sadsad213"},
        {user:"123sadsad214"},
        {user:"123sadsad215"}
    ],
    iconLocal:"",
    ordersTotal:132,
    success:128,
    iconRemote:"",
    rating:"",
    completed:[],
    open:[],
    failureRate:"0.12",
    totalVolume:"100000000",
}


class OracleInfo extends Component{


    // TODO fetch oracle info
    // /oracles/name*



    render() {

        const {theme, short = false} = this.props;

        return (
            <div className='it-trade_bio' >
                <div className={`${short ? 'text-primary text-center' : ''}`}>
                    <img src={dogeIcon} className='rounded-circle avatar'/>
                    <div>
                        <span className='it-fs24 it-fw6'>{oracleInfo.name}</span>
                    </div>
                </div>
                {
                    !short ? (
                        <div>
                            <Badge color='warning' pill className='mt-1 it-fixed-badge top-100'>
                                <span>top 10</span>
                            </Badge>
                            <div className='d-flex flex-column it-fs13 it-half-opacity mt-3'>
                                <div>
                                    <FontAwesome name='map-marker'/> {oracleInfo.location}
                                </div>
                                <div>
                                    Member since {oracleInfo.name}
                                </div>
                                <div>
                                    Subscribers: {oracleInfo.subscribers.length}
                                </div>
                            </div>
                        </div>
                    ) : null
                }
                <div className='d-flex justify-content-center mt-3'>
                    <div>
                        <Badge color='primary' pill className='badge-2 it-fixed-badge'>
                            <span>{oracleInfo.success}</span><span>/{oracleInfo.ordersTotal}</span>
                        </Badge>
                    </div>
                    <div className='profit'>
                        <div className='d-flex flex-row'>
                            <div>
                                <img src={require('../assets/icons/profit/profit.png')} />
                            </div>
                            <div className='text-left text top-profit'>
                                <div><span className='text-success it-fs16 it-fw6'>{oracleInfo.failureRate}%</span></div>
                                <div><span className='it-fs12 it-half-opacity'>failure rate</span></div>
                            </div>
                        </div>
                    </div>
                </div>
                {
                    !short ? (
                        <div>
                            <div className='mt-4 mb-4'>
                                <Button color='light' className='border it-fs14 copy_trader' block>
                                    <img src={theme['plus']} /> Select as preferred oracle
                                </Button>
                            </div>
                            <div className='it-fs14 mt-4 text-left'>
                                {oracleInfo.bio}
                            </div>
                        </div>
                    ) : null
                }
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
        push: url => dispatch(push(url))
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(OracleInfo);