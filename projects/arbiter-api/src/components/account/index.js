import React, { Component } from 'react';
import { connect } from 'react-redux'
import {BasePage} from '../../elements'
import { Row, Col, Progress, Card, CardBody, CardText, Badge, Button, ListGroup, ListGroupItem, Input, FormGroup, Label,
    Table } from 'reactstrap';
import {push} from "react-router-redux";
import CircularProgressbar from 'react-circular-progressbar';
import {set_top_panel} from "../../actions/menu";
import ReactSVG from 'react-svg';
import AccountTab from './accountTab'
import SecurityTab from './securityTab'
import NotificationTab from './notificationTab'
import QRCode from 'qrcode.react'
import cookie from 'react-cookies'

import FontAwesome from 'react-fontawesome'


let accountInfo = {
    signingAddress:"1LUEqRQv9NJZsfwEM2qqGrW4TVw5QeJd5r",
    email:"doge@doghouse.io",
    icon:"https://i.redd.it/ab6tedes7ba01.jpg",
    logins:[
        {
            userAgent:"",
            ip:"127.0.0.1",
            location:"Zug, switzerland",
            time:new Date().getTime(),
            payload:{
                token:"",
                expireTime:"",
                nonce:0
            },
            signature:"be8be1b7029313f246472dd6e1a738580e90770aba0e399797f9866c81f29648"
        },
        {
            userAgent:"",
            ip:"127.0.0.1",
            location:"Zug, switzerland",
            time:new Date().getTime(),
            payload:{
                token:"",
                expireTime:"",
                nonce:1
            },
            signature:"be8be1b7029313f246472dd6e1a738580e90770aba0e399797f9866c81f29648"
        },
        {
            userAgent:"",
            ip:"127.0.0.1",
            location:"Zug, switzerland",
            time:new Date().getTime(),
            payload:{
                token:"",
                expireTime:"",
                nonce:2
            },
            signature:"be8be1b7029313f246472dd6e1a738580e90770aba0e399797f9866c81f29648"
        }
    ],
    activeSession:[
        {
            userAgent:"",
            ip:"127.0.0.1",
            location:"Zug, switzerland",
            time:new Date().getTime(),
            payload:{
                token:"",
                expireTime:"",
                nonce:0
            },
            signature:"be8be1b7029313f246472dd6e1a738580e90770aba0e399797f9866c81f29648"
        }
    ],
    oracle:{
        oracleInfo:{
            signingAddress:"",
            bio:"",
            signature:""
        }
    },
    apiKeys:{
        id:"",
        permissions:[
            "read","trade"
        ]
    },
    reports:[
        {
            name:"Trade report Aug. 20",
            location:"https://localhost:3000/report1231231.csv"
        },
        {
            name:"Trade report Aug. 20",
            location:"https://localhost:3000/report1231231.csv"
        }
    ],
    notificationSettings:[
        'sms','email','browser'
    ]
}


class Account extends Component{

    constructor(props) {
        super(props);

        this.state = {
            userEmail:"",
            userid:"",
            authProvider:"",
            authLevel:"",
            accountCreated:"",
            ethAddress:"",
            xpub:"",
            xpriv:"",
            seed:"",
            signingAddress:"",
            signingPriv:"",
            account: true,
            security: false,
            notification: false,
        }
    }

    componentDidMount() {
        const {set_top_panel} = this.props;

        set_top_panel(-1)

        let fox_user = cookie.load('fox_user')
        console.log('fox_user: ',fox_user)
        console.log('fox_user: ',fox_user.email)

        //get wallet info from local storage

        let userSeed = localStorage.getItem('jointCustodySeed')
        let xpub = localStorage.getItem('JCxpub')
        let xpriv = localStorage.getItem('JSxpriv')
        let signingAddress = localStorage.getItem('signingAddress')
        let signingPriv = localStorage.getItem('signingPriv')
        let ethAddress = localStorage.getItem('ethAddress')
        console.log()

        this.setState({
            userEmail:fox_user.email,
            userid:fox_user.id,
            authProvider:fox_user.authProvider,
            authLevel:fox_user.authProvider,
            accountCreated:fox_user.createdAt,
            signingAddress:signingAddress,
            ethAddress:ethAddress,
            xpub:xpub,
        })

    }

    changeLeftNav(item) {
        this.setState({
            account: false,
            security: false,
            notification: false,
            [item]: true
        })
    }

    render() {

        const {push, theme} = this.props,
            {account, security, notification} = this.state;

        return (
            <BasePage
                active={[false, false, false]}
            >
                <div className='it-page'>
                    <div className='it-account'>
                        <Row>
                            <Col className='left-nav' sm={5} md={5} lg={3} xl={3}>
                                <ListGroup className='it-pointer'>
                                    <ListGroupItem>
                                        <Row>
                                            <Col className='col-5'>
                                                {/*<img src={accountInfo.icon} className='rounded-circle' height="60" width="60"/>*/}
                                                <QRCode value={"bitcoin:"+this.state.signingAddress} size={60}/>
                                            </Col>
                                            <Col className='col-9 text-left name'>
                                                <strong className='it-fs18 pl-2'>{this.state.userEmail}</strong>
                                                <p className='it-fs12 it_light_opacity pl-2'>
                                                    <br></br>Signing Address:
                                                    <br></br>{this.state.signingAddress}
                                                    Last login: {accountInfo.logins[2].time}
                                                    <br></br>ip: {accountInfo.logins[2].ip}
                                                    <br></br>location: {accountInfo.logins[2].location}
                                                    </p>

                                            </Col>
                                        </Row>
                                    </ListGroupItem>
                                    {/*<ListGroupItem className='text_with_icon'>*/}
                                        {/*<div className='active_line' />*/}
                                        {/*<div className='d-flex flex-row'>*/}
                                            {/*<ReactSVG path={require('../../assets/icons/home.svg')}/> <span className='it-fs14 it_light_opacity text align-middle'>Overview</span>*/}
                                        {/*</div>*/}
                                    {/*</ListGroupItem>*/}
                                    <ListGroupItem className={`text_with_icon ${account ? 'active_tab': ''}`} onClick={() => this.changeLeftNav('account')}>
                                        <div className='active_line' />
                                        <img src={theme.account} /> <span className='it-fs14 it_light_opacity text align-middle'>Account</span>
                                    </ListGroupItem>
                                    <ListGroupItem className={`text_with_icon ${security ? 'active_tab': ''}`}  onClick={() => this.changeLeftNav('security')}>
                                        <div className='active_line' />
                                        <img src={theme.security} />  <span className='it-fs14 it_light_opacity text align-middle'>Security</span>
                                    </ListGroupItem>
                                    {/*<ListGroupItem className='text_with_icon'>*/}
                                        {/*<div className='active_line' />*/}
                                        {/*<img src={theme.api}/>  <span className='it-fs14 it_light_opacity text align-middle'>API</span>*/}
                                    {/*</ListGroupItem>*/}
                                    {/*<ListGroupItem className='text_with_icon'>*/}
                                        {/*<div className='active_line' />*/}
                                        {/*<img src={theme.reports} />  <span className='it-fs14 it_light_opacity text align-middle'>Reports</span>*/}
                                    {/*</ListGroupItem>*/}
                                    <ListGroupItem className={`text_with_icon ${notification ? 'active_tab': ''}`} onClick={() => this.changeLeftNav('notification')}>
                                        <div className='active_line' />
                                        <div className='d-flex flex-row'>
                                            <ReactSVG path={require('../../assets/icons/bell.svg')}/>
                                            <span className='it-fs14 it_light_opacity text align-middle'>Notifications</span>
                                        </div>
                                    </ListGroupItem>
                                </ListGroup>
                                <div className='mt-4 pl-4 it-pointer d-flex flex-row'>
                                    <ReactSVG path={require('../../assets/icons/signout.svg')}/> <span className='it-fs14 ml-2'>Logout</span>
                                </div>
                            </Col>
                            <Col sm={8} md={8} lg={9} xl={9}>
                                {account ?  <Row>
                                    <Col className='col-9 account'>
                                        <strong className='it-fs28'>Account</strong>
                                        <div>
                                            <strong>
                                            <br></br>Email: {this.state.userEmail}
                                            <br></br>Signing: {this.state.signingAddress}
                                            <br></br>shapeshift userid: {this.state.userid}
                                            <br></br>authProvider: {this.state.authProvider}
                                            <br></br>accountCreated: {this.state.accountCreated}
                                            <br></br>ethAddress: {this.state.ethAddress}
                                            <br></br>xpub: {this.state.xpub}
                                            </strong>
                                        </div>
                                    </Col>
                                    <Col className='col-3 text-center avatar'>
                                        {/*<img src={account.icon} className='rounded-circle' height="60" width="60"/>*/}
                                        <QRCode value={"bitcoin:"+this.state.signingAddress} />
                                        <Button color='light' className='border it-fs14 mt-4' block>
                                            <strong>Edit avatar</strong>
                                        </Button>
                                        <div className='mt-4 it-fs14 text-danger it-pointer'>
                                            <FontAwesome name='ban' /> <span>Delete account</span>
                                        </div>
                                    </Col>
                                </Row> : null}
                                {security ? <SecurityTab/> : null}
                                {notification ?  <NotificationTab/> : null}
                            </Col>
                        </Row>
                    </div>
                </div>
            </BasePage>
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
        set_top_panel: number => dispatch(set_top_panel(number))
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(Account);