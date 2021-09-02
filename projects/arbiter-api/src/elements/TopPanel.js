import React, { Component } from 'react';
import FontAwesome from 'react-fontawesome'
import { Row, Col, Badge, Button } from 'reactstrap';
import {connect} from "react-redux";
import {push} from "react-router-redux";
import URLS from '../constants/urls'
import {set_theme} from '../actions/theme'
import {set_top_panel, switch_notification} from "../actions/menu";
import {switchSingUPModal, switchSingINModal} from '../actions/modals'
import {baseWrapper} from '../actions/eventWrapper'
import ReactSVG from 'react-svg';
import {subscribeToLastPrice, subscribeToOrderUpdates} from "../api";

//icons
import cogIcon from '../assets/icons/cog.svg'
import cogIconWhite from '../assets/icons/white_cog.svg'
import bellIcon from '../assets/icons/bell.svg'
import bellIconWhite from '../assets/icons/white_bell.svg'
import signoutIcon from '../assets/icons/signout.svg'
import signoutIconWhite from '../assets/icons/white_bg-signout.svg'



let marketsJSON = {
    "LTC_BTC":{
        market:"LTC_BTC",
        base:"LTC",
        quote:"BTC",
        lastPrice:0.00848,
        volume24h:1336.30,
        pctChange24h:-0.51,
        pctChange1h:0.01,
        lowBid:0.00848,
        highAsk:0.00818,
        high24:0.0086348,
        low24:0.008438
    },
    "ETH_BTC":{
        market:"ETH_BTC",
        base:"ETH",
        quote:"BTC",
        lastPrice:0.00848,
        volume24h:1336.30,
        pctChange24h:-0.51,
        pctChange1h:0.01,
        lowBid:0.00848,
        highAsk:0.00818,
        high24:0.0086348,
        low24:0.008438
    },
    "GNT_BTC":{
        market:"GNT_BTC",
        base:"GNT",
        quote:"BTC",
        lastPrice:0.00848,
        volume24h:1336.30,
        pctChange24h:-0.51,
        pctChange1h:0.01,
        lowBid:0.00848,
        highAsk:0.00818,
        high24:0.0086348,
        low24:0.008438
    },
}

let markets = [
    {
        market:"LTC_BTC",
        base:"LTC",
        quote:"BTC",
        lastPrice:0.00848,
        volume24h:1336.30,
        pctChange24h:-0.51,
        pctChange1h:0.01,
        lowBid:0.00848,
        highAsk:0.00818,
        high24:0.0086348,
        low24:0.008438
    },
    {
        market:"ETH_BTC",
        base:"ETH",
        quote:"BTC",
        lastPrice:0.00848,
        volume24h:1336.30,
        pctChange24h:-0.51,
        pctChange1h:0.01,
        lowBid:0.00848,
        highAsk:0.00818,
        high24:0.0086348,
        low24:0.008438
    },
    {
        market:"GNT_BTC",
        base:"GNT",
        quote:"BTC",
        lastPrice:0.00848,
        volume24h:1336.30,
        pctChange24h:-0.51,
        pctChange1h:0.01,
        lowBid:0.00848,
        highAsk:0.00818,
        high24:0.0086348,
        low24:0.008438
    }
]

let marketView = []
for(let i = 0;i < markets.length; i++){
    let market = markets[i]
    let marketInfo = []
    marketInfo.push(market.market)
    if(market.pctChange24h > 0){
        marketInfo.push('success')
    } else {
        marketInfo.push('danger')
    }
    marketInfo.push(market.pctChange24h)
    marketInfo.push(market.lastPrice)

    marketView.push(marketInfo)
}
console.log(marketView)
//marketView.push(['add market'])

class TopPanel extends Component {
    constructor(props) {
        super(props);

        this.state = {
            tile: false
        }
    }

    open_item(path) {
        const {push, set_top_panel} = this.props;
        
        let marketSelected = this.state.marketSelected
        console.log("*************** marketSelected: ",marketSelected)
        if(!marketSelected){
            path = "../market/"+path
        }
        
        console.log("********************** :  ",this.state.marketSelected)
        push(path);
        set_top_panel(path)
    }

    componentDidMount(){
        let market = this.state.marketSelected
        console.log("####  ********* market: ",market)

        set_top_panel(0)
    }

    componentWillUnmount() {
        //turn off sockets
        //stop polling
        //clearInterval(this.interval);
    }

    render() {


        const {
            active, push, theme, set_theme, menu,
            set_top_panel, switch_notification,
            account, switchSingUPModal, switchSingINModal,
            baseWrapper
        } = this.props;

        //let markets =
        // console.log("********* set_theme: ",this.props.set_theme)
        // console.log("********* set_top_panel: ",this.props.set_top_panel)
        // console.log("********* account: ",this.props.account)
        console.log("********* menu: ",menu)

        return(

            <div className='it-top-panel'>
                <Row>
                    <Col>
                        <div className="d-flex flex-row">

                            {
                                marketView.map((item) => (
                                    <div className={`nav-item ${menu === item[0] ? 'active' : ''}`} onClick={() => this.open_item(item[0])}>
                                        <div className="d-flex flex-row">
                                            <img src={require('../assets/icons/close.svg')} className='closed'/>
                                            <div className="d-flex flex-column ml-2">
                                                <strong className='it-fs16 it_light_opacity title'>{item[0]}</strong>
                                                <div className='d-flex flex-row nav-desc'>
                                                    <p>
                                                        <Badge color={item[1]} pill>
                                                            <span>{item[2]}</span>
                                                        </Badge>
                                                    </p>
                                                    <p className='it-fs12'>{item[3]}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            }


                            <div className={`nav-item it-fs12 text-center add `}
                                 onClick={() => baseWrapper(() => {
                                     push(URLS.MarketsList);
                                     set_top_panel(-1)
                                 })}
                            >
                                <div className="d-flex flex-column">
                                    <img src={require('../assets/icons/blue_plus.svg')}  className='mb-1'/>
                                    <p>add market</p>
                                </div>
                            </div>

                            {/*{*/}
                            {/*marketView.map((item, i, array) => array.length-1 === i ? (*/}
                            {/*<div className={`nav-item it-fs12 text-center add `}*/}
                            {/*onClick={() => baseWrapper(() => {*/}
                            {/*push(URLS.MarketsList);*/}
                            {/*set_top_panel(-1)*/}
                            {/*})}*/}
                            {/*>*/}
                            {/*<div className="d-flex flex-column">*/}
                            {/*<img src={require('../assets/icons/blue_plus.svg')}  className='mb-1'/>*/}
                            {/*<p>{item[0]}</p>*/}
                            {/*</div>*/}
                            {/*</div>*/}
                            {/*) : (*/}
                            {/*<div className={`nav-item ${menu === 1 ? 'active' : ''}`} key={i} onClick={() => push("market/"+item[0])}>*/}
                            {/*<div className="d-flex flex-row">*/}
                            {/*<img src={require('../assets/icons/close.svg')} className='closed'/>*/}
                            {/*<div className="d-flex flex-column ml-2">*/}
                            {/*<strong className='it-fs16 it_light_opacity title'>{item[0]}</strong>*/}
                            {/*<div className='d-flex flex-row nav-desc'>*/}
                            {/*<p>*/}
                            {/*<Badge color={item[1]} pill>*/}
                            {/*<span>{item[2]}</span>*/}
                            {/*</Badge>*/}
                            {/*</p>*/}
                            {/*<p className='it-fs12'>{item[3]}</p>*/}
                            {/*</div>*/}
                            {/*</div>*/}
                            {/*</div>*/}
                            {/*</div>*/}
                            {/*))*/}
                            {/*}*/}
                        </div>
                    </Col>
                    <Col>
                        <div className='d-flex flex-row-reverse mr-2'>
                            {
                                account ? [
                                    ['signout',signoutIcon,signoutIconWhite],
                                    ['cog',cogIcon,cogIconWhite],
                                    ['bell',bellIcon,bellIconWhite]
                                ].map((item, i) => (
                                    <div onClick={() => item[0] === 'cog' ? push(URLS.Account) :
                                        item === 'bell' ? switch_notification() : null} key={i} className='left-icon'>
                                        <div className='icon'>
                                            <img src={!theme.theme_night ? item[1] : item[2]}></img>
                                        </div>
                                    </div>
                                )) : (
                                    <div className='no-account'>
                                        <strong className='it-fs14 singin' onClick={() => switchSingUPModal(true)}>
                                            Sign In
                                        </strong>
                                        <Button className='bnt-light singup' color="link" onClick={() => switchSingUPModal(true)}>
                                            Sign Up
                                        </Button>
                                    </div>
                                )
                            }
                            <div className={`theme-switch d-flex flex-row ${theme.theme_night ? 'reverse': ''}`} onClick={() => set_theme()}>
                                <div className={`${theme.theme_night ? 'non_active' : 'active'}`}>
                                    <img src={theme.sun_icon} className='non_active'/>
                                </div>
                                <div className={`${!theme.theme_night ? 'non_active' : 'active'}`}>
                                    <img src={theme.moon_icon}/>
                                </div>
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>
        )
    }
}

const mapStateToProps = state => {
    return {
        theme: state.theme,
        menu: state.menu.top_panel,
        account: state.account
    }
};

const mapDispatchToProps = dispatch => {
    return {
        push: url => dispatch(push(url)),
        set_theme: index => dispatch(set_theme(index)),
        set_top_panel: number => dispatch(set_top_panel(number)),
        switch_notification: () => dispatch(switch_notification()),
        switchSingUPModal: state => dispatch(switchSingUPModal(state)),
        switchSingINModal: state => dispatch(switchSingINModal(state)),
        baseWrapper: event => dispatch(baseWrapper(event))
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(TopPanel);
