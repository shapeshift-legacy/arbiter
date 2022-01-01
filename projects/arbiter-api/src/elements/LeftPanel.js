import React, { Component } from 'react';
import FontAwesome from 'react-fontawesome'
import { Badge } from 'reactstrap';
import {connect} from "react-redux";
import {push} from "react-router-redux";
import URLS from '../constants/urls'
import {MyOrdersContainer} from './index'
import {set_top_panel, set_my_orders} from '../actions/menu'
import {baseWrapper} from "../actions/eventWrapper";
import ReactSVG from 'react-svg';

import cogIcon from '../assets/icons/cog.svg'
import security from '../assets/icons/security.svg'
import securityWhite from '../assets/icons/white_security.svg'
import wallet from '../assets/icons/wallet.svg'
import whiteWallet from '../assets/icons/white_wallet.svg'
import cogIconWhite from '../assets/icons/white_cog.svg'

class LeftPanel extends Component{

    constructor(props) {
        super(props);

        this.state = {}
    }

    orders_active() {
        const {set_top_panel, set_my_orders} = this.props;

        set_my_orders(1);
    }

    _open_left_item(url) {
        const {push, set_top_panel, set_my_orders} = this.props;

        push(url);
        set_top_panel(-1);
        set_my_orders(0);
    }

    render() {

        const {
            my_orders_badge = 3, push, wallet_active,orders_active,
            analytics_active, traders_active,
            message_active, theme, my_orders, baseWrapper
        } = this.props;

        return (
            <div>
                <div className='it-left-panel'>
                    <div className='text-center mt-2' onClick={() => push("/")}>
                        <img
                            className='logo'
                            src={require('../assets/logo.png')}
                            alt='logo'
                        />
                    </div>
                </div>
                <div className='it-left-panel-nav'>

                    {/*<div*/}
                        {/*key="Oracles"*/}
                        {/*className={`item ${traders_active && !my_orders && 'active'}`}*/}
                        {/*onClick={() => baseWrapper(() => {*/}
                            {/*this._open_left_item(0)*/}
                        {/*})}*/}
                    {/*>*/}
                        {/*<img src={!theme.theme_night ? security : securityWhite}></img>*/}
                        {/*<p>Oracles</p>*/}
                    {/*</div>*/}

                    {/*<div*/}
                        {/*key="Wallets"*/}
                        {/*className={`item ${wallet_active && !my_orders && 'active'}`}*/}
                        {/*onClick={() => baseWrapper(() => {*/}
                            {/*this._open_left_item(1)*/}
                        {/*})}*/}
                    {/*>*/}
                        {/*<img src={!theme.theme_night ? wallet : whiteWallet}></img>*/}
                        {/*<p>Oracles</p>*/}
                    {/*</div>*/}

                    {
                        [
                            [traders_active, URLS.Oracles,!theme.theme_night ? security : securityWhite , 'Oracles'],
                            [wallet_active, URLS.Wallets, require('../assets/icons/nav_wallet.svg'), 'Wallets'],
                        ].map((item, index) => (
                            <div
                                key={index}
                                className={`item ${item[0] && !my_orders && 'active'}`}
                                onClick={() => baseWrapper(() => {
                                    this._open_left_item(item[1])
                                })}
                            >
                                <img src={item[2]}></img>
                                <p>{item[3]}</p>
                            </div>
                        ))
                    }

                    <div
                        className={`item ${my_orders ? 'active' : ''}`}
                        onClick={() => baseWrapper(() => {
                            this._open_left_item(URLS.Orders)
                        })}
                    >
                        <div className="d-flex flex-column">
                            {/*<div className='it-badge bg-primary text-white'>*/}
                                {/*<span>{my_orders_badge}</span>*/}
                            {/*</div>*/}
                            <div>
                                <img src={theme.my_orders_icon} className='img_icon_c' />
                                <p>My orders</p>
                            </div>
                        </div>
                    </div>

                    <div className='footer text-center'>
                        <div className='it-fs12'>
                            15:48
                        </div>
                        <select className='it-timezone'>
                            <option>+3</option>
                            <option>+4</option>
                            <option>+5</option>
                            <option>+6</option>
                            <option>+7</option>
                            <option>+8</option>
                        </select>
                        <div className='it-fs12 it-half-opacity'>
                            UTC +3 <FontAwesome name='caret-down ' />
                        </div>
                    </div>
                </div>
                <MyOrdersContainer />
            </div>
        )
    }
}

const mapStateToProps = state => {
    return {
        theme: state.theme,
        my_orders: state.menu.my_orders
    }
};

const mapDispatchToProps = dispatch => {
    return {
        push: url => dispatch(push(url)),
        set_top_panel: number => dispatch(set_top_panel(number)),
        set_my_orders: number => dispatch(set_my_orders(number)),
        baseWrapper: event => dispatch(baseWrapper(event))
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(LeftPanel);