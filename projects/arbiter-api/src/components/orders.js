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
import arbClient from '@arbiter/arb-api-client'
import { API_HOST } from '../config'
import CheckBox from './checkBox'
import {set_my_orders, set_top_panel} from "../actions/menu";
import {Motion, spring} from 'react-motion';
import {
    Button, Input, Form,Table,
    Dropdown, DropdownToggle, DropdownMenu, DropdownItem
} from 'reactstrap';
// let walletSummary = {
//     cold:{
//         id:"cold",
//         long:"Hardware Cold storage",
//         active:false,
//     },
//     trade:{
//         id:"trade",
//         active:true,
//         long:"Custodial Account (Trading)",
//     },
//     joint:{
//         id:"joint",
//         long:"Joint Custody Wallet",
//         active:true,
//     },
// }
//
// let walletMap = Object.keys(walletSummary)

let ordersAll = []

class Orders extends Component{
    constructor(props) {
        super(props);

        this.state = {
            ordersAll:[],
            depositAddress:"",
            dropdownOpen1: false,
            dropdownOpen2: false,
            dropdownOpen3: false,
            dropdownOpen4: false,
            dropdownOpen5: false,
        }
    }

    async componentDidMount(){
        console.log("componentDidMount ********************|")
        let accountSigning = localStorage.getItem('signingAddress')
        let accountPriv = localStorage.getItem('signingPriv')
        arbClient.init(API_HOST,accountSigning,accountPriv)

        //get balances
        let accountInfo = await arbClient.getInfo()
        console.log("accountInfo: ",accountInfo)


        //get ALL orders
        ordersAll = await arbClient.orders()
        ordersAll = ordersAll
        console.log("ordersAll: ",ordersAll)


        this.setState({
            ordersAll:ordersAll
        })
    }

    render() {

        const {push, theme, ClosePageAction,set_my_orders, set_top_panel,my_orders} = this.props;


        const ExportBtn = props => (
            <Button color='light' className={`border ml-4 ${props.extraClass} it-fs14`}>
                <span>
                    <FontAwesome name='file' className='mr-2 it-fs12'/> <span className='it_light_opacity'>Export order list</span>
                </span>
            </Button>
        );


        return (
            <BaseLeftPage
                BasePageProps={{
                    active: [false, false, false],
                    wallet_active: true
                }}
            >


                        <Row className='justify-content-between'>
                            <Col className='mt-3'>
                                <p className='it_page_title'>My Orders</p>
                            </Col>
                            <Col className='mt-3'>
                                <div className='it_cycle_times' onClick={function(){
                                    push(URLS.Trading)
                                }}>
                                    <ReactSVG
                                        path={require('../assets/icons/close_bg.svg')}
                                    />
                                </div>
                            </Col>
                        </Row>




                        {/*{tile ? <Tile />: <Table />}*/}

                        <Table className='border-bottom table-night'>
                            <thead>
                            <tr>
                                <th><span className='it-dashed'>orderId</span></th>
                                <th>market</th>
                                <th><span className='it-dashed'>price</span></th>
                                <th><span className='it-dashed'>quantity</span></th>
                                <th><span className='it-dashed'>type</span></th>

                            </tr>
                            </thead>
                            <tbody>
                        {
                            ordersAll.map(order => (
                                <tr key={order} onClick={() => push("order/" + order.orderId)}>
                                    <td className='with_img'>
                                        <img src={"https://static.coincap.io/assets/icons/"+order.coinFunding.toLowerCase()+"@2x.png"}/>
                                        <span className='it-fs16 ml-3 it-medium'>{order.orderId} </span>
                                    </td>
                                    <td>
                                        <span className='it-fs16 text-primary it-medium'> {order.market} </span>
                                    </td>
                                    <td>
                                        <span className='text-success it-fs16 it-medium'>{order.quantity}</span>
                                    </td>
                                    <td>
                                        <span className='it-fs16'>{order.type}</span>
                                    </td>

                                </tr>
                            ))
                        }
                            </tbody>
                        </Table>



            </BaseLeftPage>
        )


        // return (
        //     <BaseLeftPage
        //         BasePageProps={{
        //             active: [false, false, false],
        //             wallet_active: true
        //         }}
        //     >
        //         <div className='it_wallet'>
        //             <Row className='justify-content-between'>
        //                 <Col className='mt-3'>
        //                     <p className='it_page_title'>My Orders</p>
        //                 </Col>
        //                 <Col className='mt-3'>
        //                     <div className='it_cycle_times' onClick={() => ClosePageAction(URLS.Trading)}>
        //                         <ReactSVG
        //                             path={require('../assets/icons/close_bg.svg')}
        //                         />
        //                     </div>
        //                 </Col>
        //             </Row>
        //             <div className="d-flex flex-row wallet-icon-gr it-pointer">
        //                 {
        //                     ordersAll.map(order => (
        //                         <div className="d-flex flex-column wallet-icon" onClick={() => push("order/"+order.orderId)}>
        //                             <div className='text-center'>
        //                                 <img src={theme.wallet_1}/>
        //                             </div>
        //                             <p className='it-fs14 it_light_opacity'>{order.orderId}</p>
        //                         </div>
        //                     ))
        //                 }
        //             </div>
        //
        //
        //         </div>
        //
        //     </BaseLeftPage>
        // )
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
        ClosePageAction: url => dispatch(ClosePageAction(url)),
        set_top_panel: number => dispatch(set_top_panel(number)),
        set_my_orders: number => dispatch(set_my_orders(number))
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(Orders);
