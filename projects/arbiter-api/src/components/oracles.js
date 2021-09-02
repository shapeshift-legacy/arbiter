import React, { Component } from 'react';
import { connect } from 'react-redux'
import { Row, Col, Card, CardBody, Badge } from 'reactstrap';
import FontAwesome from 'react-fontawesome'
import URLS from '../constants/urls'
import {push} from "react-router-redux";
import BaseLeftPage from '../elements/BaseLeftPage'
import {ClosePageAction} from '../actions/LeftPage'
import ReactSVG from 'react-svg';

let oracles = [
    {
        name:"Dogecoin bros",
        id:"addressbro",
        created:new Date().getTime(),
        bio:"Much wow, very oracle, trust doge",
        signatureBio:"",
        location:"The Dog house, russia",
        subscribers:[
            {user:"123sadsad213"},
            {user:"123sadsad214"},
            {user:"123sadsad215"}
        ],
        iconLocal:"",
        iconRemote:"",
        ordersTotal:132,
        success:128,
        rating:"",
        orders:[],
        completed:[],
        open:[],
        failureRate:"0.12",
        totalVolume:"100000000",
    }
    ,
    {
        name:"Dash Dudes",
        id:"addressbro1",
        created:new Date().getTime(),
        bio:"Yo dudes",
        ordersTotal:132,
        success:128,
        signatureBio:"",
        location:"Club dash",
        subscribers:[
            {user:"123sadsad213"},
        ],
        iconLocal:"",
        iconRemote:"",
        rating:"",
        orders:[],
        completed:[],
        open:[],
        failureRate:"0.12",
        totalVolume:"100000000",
    },
    {
        name:"Ripple peeps",
        id:"addressbro2",
        signing:"",
        bio:"I pooped",
        signatureBio:"",
        location:"Toilet behind barnies",
        subscribers:[
        ],
        iconLocal:"",
        iconRemote:"",
        ordersTotal:132,
        success:128,
        rating:"",
        orders:[],
        completed:[],
        open:[],
        failureRate:"0.12",
        totalVolume:"100000000",
    }
]


class Traders extends Component{
    render() {

        const {push, ClosePageAction, theme} = this.props;

        return (
            <BaseLeftPage
                BasePageProps={{
                    active: [false, false, false],
                    traders_active: true
                }}
            >
                <div className='it-traders'>
                    <Row className='justify-content-between'>
                        <Col className='mt-3'>
                            <p className='it_page_title'>Oracles</p>
                            Become An Oracle:
                            <div className='plus_icon mt-3' onClick={() => push(URLS.OracleSignup)}>
                                <img src={theme['plus']} />
                            </div>
                        </Col>
                        <Col className='mt-3'>
                            <div className="input-group search">
                                <input type="text" className="form-control border-right-0" placeholder='Search'/>
                                <div className="input-group-append">
                                    <span className="input-group-text border-left-0">
                                        <FontAwesome name='search' />
                                    </span>
                                </div>
                            </div>
                        </Col>
                        <Col className='mt-3'>
                            <div className='it_cycle_times' onClick={() => ClosePageAction(URLS.Trading)}>
                                <ReactSVG
                                    path={require('../assets/icons/close_bg.svg')}
                                />
                            </div>
                        </Col>
                    </Row>
                    <Row className='traders-cards'>
                        {
                            oracles.map(oracle => (
                                <Col key="oracle" className='col-3 it-pointer' sm={4} md={4} lg={3} xl={3}>
                                    <Card onClick={() => push("oracle/"+oracle.id)}>
                                        <CardBody>
                                            <div className='top-100'>
                                                <Badge color='warning' pill>
                                                    <span>top 100</span>
                                                </Badge>
                                            </div>
                                            <div className='d-flex justify-content-between'>
                                                <div className='d-flex flex-row align-items-center'>
                                                    <img src='http://via.placeholder.com/70x70' className='rounded-circle'/>
                                                    <div className='it-ml-10'>
                                                        <div className='d-flex flex-column'>
                                                            <div><strong className='it-fs18'>{oracle.name}</strong></div>
                                                            <div className='it-fs12 it-medium it-half-opacity'>
                                                                <FontAwesome name='map-marker'/> {oracle.location}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className='plus_icon mt-3' onClick={() => push(URLS.Trading)}>
                                                        <img src={theme['plus']} />
                                                    </div>
                                                </div>
                                            </div>
                                            <Row className='mt-4'>
                                                <Col sm={4} md={4}>
                                                    <div className='d-flex flex-column text-center'>
                                                        <div><span className='it-medium text-success it-fs22'>{oracle.ordersTotal}</span></div>
                                                        <div><span className='it-fs12 it-half-opacity'>orders</span></div>
                                                    </div>
                                                </Col>
                                                <Col sm={4} md={4}>
                                                    <div className='d-flex flex-column text-center'>
                                                        <div className='it-medium text-success it-fs22 text-truncate'>
                                                            {oracle.created}
                                                        </div>
                                                        <div><span className='it-fs12 it-half-opacity'>created</span></div>
                                                    </div>
                                                </Col>
                                                <Col sm={4} md={4}>
                                                    <div className='d-flex flex-column text-center'>
                                                        <div><span className='it-medium text-success it-fs22'>{oracle.ordersTotal}</span></div>
                                                        <div><span className='it-fs12 it-half-opacity'>subscribers </span></div>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </CardBody>
                                        <div className='risk it-fs14 text-center'>
                                            <span className='it_light_opacity mr-2'>failureRate</span>
                                            <span className='it-medium'>{oracle.failureRate}</span>
                                        </div>
                                    </Card>
                                </Col>
                            ))
                        }
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

export default connect(mapStateToProps, mapDispatchToProps)(Traders);