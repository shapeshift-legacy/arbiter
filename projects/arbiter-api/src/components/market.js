import React, { Component } from 'react';
import { connect } from 'react-redux'
import {
    Card, CardBody, Row, Col, Button,
    FormGroup, Label, Input, Table,
    Dropdown, DropdownToggle, DropdownMenu, DropdownItem
} from 'reactstrap';
import {push} from "react-router-redux";
import ReactSVG from 'react-svg';
import {set_order_close_modal} from "../actions/menu";
import {baseWrapper} from "../actions/eventWrapper";
import FontAwesome from 'react-fontawesome'
import arbClient from '@arbiter/arb-api-client'
import Switch from "react-switch";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import orderbookTool from '../modules/orderbook'
//import orderBook from './data/orderbook.json'
import BasePage from '../elements/BasePage'
//TODO per market (only sub to correct context)
import {
    subscribeToAccount,
    subscribeToLastPrice,
    subscribeToOrderUpdates,
    //subscribeToVolume24h,
    subscribeToPctChange24h,
    subscribeToPctChange1h,
    subscribeToLowBid,
    subscribeToHighAsk,
    subscribeToHigh24,
    subscribeToLow24} from '../api';

class Trading extends Component{

    constructor(props) {
        super(props);

        this.toggle = this.toggle.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state = {
            formPrice:"",
            formAmount:"",
            formType:"",
            balanceBase:"",
            assetBase:"",
            active_index: -1,
            tradeHistory: [],
            formOracle:false,
            formError:null,
            userOrders:[],
            active_index_1: -1,
            marketSelected:null,
            orderBook:{bids:[],offers:[]},
            globals:{},
            order_book: 2,
            formError: null,
            dropdownOpen: false,
            timestamp: 'no timestamp yet',
            lastPrice: 'no price yet',
            volume24h:0,
            pctChange24h:0,
            pctChange1h:0,
            lowBid:0,
            highAsk:0,
            high24:0,
            low24:0
        }
    }

    async componentDidMount(){
        let market = this.props.match.params.market
        console.log('******** market: ',market)
        this.setState({
            marketSelected:market
        })
        console.log(this.state.marketSelected)

        //
        let assets = market.split("_")
        console.log("Assets: ",assets)
        console.log("Assets quote: ",assets[0])
        console.log("Assets base: ",assets[1])

        let accountSigning = localStorage.getItem('signingAddress')
        let accountPriv = localStorage.getItem('signingPriv')
        arbClient.init(process.env.REACT_APP_API_HOST,accountSigning,accountPriv)

        //get balances
        let accountInfo = await arbClient.getInfo()
        console.log("accountInfo: ",accountInfo)
        ///accountInfo = accountInfo.payload
        let userOrders = await arbClient.orders()

        console.log("userOrders: ",userOrders)
        //userOrders = userOrders.payload
        console.log("userOrders: ",userOrders)

        let balanceQuote = accountInfo.balances[assets[1]]/100000000
        if(!balanceQuote) balanceQuote = 0
        let balanceBase = accountInfo.balances[assets[0]]/100000000
        if(!balanceBase) balanceBase = 0
        //display balances
        this.setState({
            balanceBase:balanceBase,
            assetBase:assets[0],
            balanceQuote:balanceQuote,
            assetQuote:assets[1],
            userOrders:userOrders
        })

        //

        subscribeToLastPrice((err, lastPrice) => this.setState({
            lastPrice
        }));

        subscribeToAccount((err, accountEvent) => {
            try{

                console.log("*********** balanceEvent event: ",accountEvent)

                console.log("accountEvent: ",accountEvent)
                this.notify(accountEvent.eventSummary)


                if(accountEvent.newBalance){
                    console.log(" New balance detected!" )
                    let assetBalanceChange = accountEvent.asset
                    console.log(" assetBalanceChange! ",assetBalanceChange )

                    if(assetBalanceChange === assets[0]){
                        this.setState({
                            balanceBase:(accountEvent.newBalance/100000000)
                        })
                    } else if(assetBalanceChange === assets[1]) {
                        this.setState({
                            balanceQuote:(accountEvent.newBalance/100000000)
                        })
                    }
                }

                if(accountEvent.type === "submit"){
                    console.log("WINNING*****************")

                    //push to orders
                    let accountOrders = this.state.userOrders
                    accountOrders.push(accountEvent)

                    this.setState({
                        userOrders:accountOrders
                    })
                }
                //if asset is base or quote

                //update state

                //push event alert

                //if event is order created
                //push to my orders!

            }catch(e){
                console.error(e)
            }
        });


        subscribeToOrderUpdates((err, event) => {
            try{
                console.log("***********88 orderUpdate event: ",event)
                let state = this.state
                let orderbook = state.orderBook
                console.log("***********88 state: ",state)
                console.log("***********88 orderbook: ",state.orderBook)
                console.log("***********88 orderbook: ",typeof(orderbook))
                //iterate over events

                //update state on each event
                let newOrderbook = orderbookTool.update_function(orderbook,event.newOrderStates)
                console.log("***********88 newOrderbook: ",newOrderbook)
                this.setState({
                    orderBook:newOrderbook
                })


                // const newData = update(this.state, {
                //     orderBook: {bids: {$push: [objectBid]}}
                // });
                //
                // this.setState(newData)

                // this.setState({
                //     orderbook.bids[0]:
                // })
            }catch(e){
                console.error(e)
            }
        });



        subscribeToPctChange24h((err, pctChange24h) => this.setState({
            pctChange24h
        }));
        subscribeToPctChange1h((err, pctChange1h) => this.setState({
            pctChange1h
        }));
        subscribeToLowBid((err, lowBid) => this.setState({
            lowBid
        }));
        subscribeToHighAsk((err, highAsk) => this.setState({
            highAsk
        }));
        subscribeToHigh24((err, high24) => this.setState({
            high24
        }));
        subscribeToLow24((err, low24) => this.setState({
            low24
        }));




        let url = process.env.REACT_APP_API_HOST + '/api/v1/orderbook/'+market
        //setInterval(() => {
        fetch(url)
            .then(response => response.json()).then((response) => {
            console.log(url);
            console.log("***********8 () orderbook: ", response);
            response = response.payload
            //console.log(repos.length);
            this.setState({
                active_index: -1,
                active_index_1: -1,
                orderBook: response,
                order_book: 2,
                dropdownOpen: false
            });
        }).catch(ex => {
            console.error(`error fetching order book`, ex)
        });


        let url2 = process.env.REACT_APP_API_HOST + '/api/v1/history/'+market;
        fetch(url2)
            .then(response => response.json()).then((history) => {
            console.log(url);
            console.log("***********8 () history:  ", history);
            //console.log(repos.length);
            this.setState({
                tradeHistory: history.payload,
            });
        }).catch(ex => {
            console.error(`error fetching url`, ex)
        });

    }

    componentWillUnmount() {
        //turn off sockets
        //stop polling
        //clearInterval(this.interval);

        //TODO
        //Unsub to from one market
        //start new socket
        //clear all state

        // this.setState({
        //     active_index: -1,
        //     tradeHistory: [],
        //     active_index_1: -1,
        //     marketSelected:null,
        //     orderBook:{bids:[],offers:[]},
        //     globals:{},
        //     order_book: 2,
        //     dropdownOpen: false,
        //     timestamp: 'no timestamp yet',
        //     lastPrice: 'no price yet',
        //     volume24h:0,
        //     pctChange24h:0,
        //     pctChange1h:0,
        //     lowBid:0,
        //     highAsk:0,
        //     high24:0,
        //     low24:0
        // })

    }

    toggle() {
        this.setState({
            dropdownOpen: !this.state.dropdownOpen
        });
    }

    handleChange(checked) {
        this.setState({ formOracle:checked });
    }

    async onSubmit(){
        //if joint custody
        let isJC = this.state.formOracle
        console.log("isJC: ",isJC)

        //popup
        if(isJC){
            console.log("joint custory detected! ")
            //open order helper
            console.log(this.props)
            this.props.set_order_close_modal(true,this.state.formPrice,this.state.formAmount,this.state.formType,this.state.marketSelected)
        } else {
            //if custodial
            console.log("stateOnSubmit: ",this.state)
            let orderId = null
            let market = this.state.marketSelected
            let quantity = this.state.formAmount
            let rate = this.state.formPrice
            let type = this.state.formType

            console.log("Input: ",{orderId,market,quantity,rate,type})

            let result = await arbClient.limit(orderId,market,quantity,rate,type)
            console.log("result: ",result)

            //let payload = { orderId, market, quantity, rate, type }
        }



    }

    notify = (msg) => toast(msg);




    render() {

        const {
                theme, set_order_close_modal,
                baseWrapper
            } = this.props,
            {
                active_index, active_index_1, order_book
            } = this.state;

        let isAskActive = "primary"
        if(this.state.formType === 'ask'){
            isAskActive = 'success'
        }
        let isBidActive = "primary"
        if(this.state.formType === 'bid'){
            isBidActive = 'success'
        }


        return(


            <BasePage>
                <div className='it-page it-page-trading'>
                    <div className='it-trading'>
                        <div className='d-flex flex-row mb-2'>
                            <div>
                                <ToastContainer />
                            </div>
                            <div className='mt-4 buy-sell'>
                                <Card>
                                    <CardBody>

                                        <form>

                                            <div className='text-center wallet-count-block'>
                                            <img src={theme.nav_wallet} className='it-icon non_op'/>
                                            <span className='it-fs16 ml-2 align-middle it-medium wallet-count'>Balances: <br></br>{this.state.balanceBase} {this.state.assetBase}<br></br>{this.state.balanceQuote} {this.state.assetQuote}</span>

                                            <p className='it-fs12'>
                                            Total { parseFloat(this.state.balanceBase) * 4200 } USD
                                            <hr className="it-hr-text" data-content="DEMO"/>
                                            </p>
                                            </div>



                                            <div className='text-center mt-4 w-100 pt-1 mb-1'>
                                                <div className="btn-group d-flex btn-buy-sell" role="group">
                                                    <Button
                                                        className='border-0'
                                                        onClick={() => this.setState({formType:"bid"})}
                                                        color={isBidActive}
                                                    >
                                                        <img src={require('../assets/icons/raw_up.svg')} />
                                                        <span className='it-fw6'>Buy</span>
                                                    </Button>
                                                    <Button
                                                        className='bg-white text-dark border border-left-0'
                                                        onClick={() => this.setState({formType:"ask"})}
                                                        color={isAskActive}
                                                    >
                                                        <img src={require('../assets/icons/raw_up.svg')} />
                                                        <span className='it-fw6'>sell</span>
                                                    </Button>
                                                </div>
                                            </div>

                                            <input
                                                placeholder="Type"
                                                value={this.state.formType}
                                                //onChange={e => this.setState({formType : e.target.value})}
                                            />
                                            <input
                                                placeholder="Price"
                                                value={this.state.formPrice}
                                                onChange={e => this.setState({formPrice : e.target.value})}
                                            />
                                            <input
                                                placeholder="amount"
                                                value={this.state.formAmount}
                                                onChange={e => this.setState({formAmount : e.target.value})}
                                            />


                                            <p></p>
                                            <span>Enable Oracle Arbitration</span>
                                            <Switch
                                                onChange={this.handleChange}
                                                checked={this.state.formOracle}
                                                id="normal-switch"
                                            /><br></br>
                                            <small><a href="url">Whats this?</a></small>


                                            <Button
                                                className='bg-success mb-3 border-0 py-2 btn-buy'
                                                block
                                                onClick={this.onSubmit.bind(this)}
                                            >

                                            {/*<div class="p-3 mb-2 bg-danger text-white">{this.state.formError}</div>*/}

                                            <img src={require('../assets/icons/raw_up.svg')} style={{height: 17}} className='mb-1'/>
                                            <span className='ml-2 it-fw6'>Place Order</span>
                                            </Button>


                                            <p></p>
                                            { this.state.formError ? <h1><p><a href="#" class="text-danger">{this.state.formError}</a></p></h1> : null }

                                        </form>

                                    </CardBody>
                                </Card>
                            </div>

                            <br></br>
                            <div className='mt-5 main-view'>

                                <div className="d-flex flex-row">
                                    <div className='it-title'>
                                        {this.props.match.params.market} LAST: {this.state.lastPrice}
                                    </div>
                                    <Row className='info_row'>

                                        {
                                            // Object.keys(this.state.globals).forEach((element) => (
                                            //     // console.log(element)
                                            //     <Row className='justify-content-around'>
                                            //     <Col sm={12} md={12} lg={5} xl={5}>
                                            //     <Row>
                                            //     <Col sm={4} md={3} className='align-self-center'>Price</Col>
                                            //     <Col sm={8} md={9} className='align-self-center text-success'>0.023206</Col>
                                            //     </Row>
                                            //     </Col>
                                            //     <Col sm={12} md={12} lg={5} xl={5}>
                                            //     <Row>
                                            //     <Col sm={4} md={3} className='align-self-center'>Vol</Col>
                                            //     <Col sm={8} md={9} className='align-self-center'>8,48048</Col>
                                            //     </Row>
                                            //     </Col>
                                            //     </Row>
                                            // ))
                                        }

                                        <Col sm={3} md={3} lg={5} xl={5} className='align-self-center'>
                                            <Row className='justify-content-around'>
                                                <Col sm={12} md={12} lg={5} xl={5}>
                                                    <Row>
                                                        <Col sm={4} md={3} className='align-self-center'>Price</Col>
                                                        <Col sm={8} md={9} className='align-self-center text-success'>{this.state.lastPrice}</Col>
                                                    </Row>
                                                </Col>
                                                <Col sm={12} md={12} lg={5} xl={5}>
                                                    <Row>
                                                        <Col sm={4} md={3} className='align-self-center'>Vol</Col>
                                                        <Col sm={8} md={9} className='align-self-center'>{this.state.volume24h}</Col>
                                                    </Row>
                                                </Col>
                                            </Row>
                                        </Col>
                                        <Col sm={2} md={2} lg={2} xl={2} className='align-self-center'>
                                            <Row>
                                                <Col sm={12} md={12} lg={12} xl={12}>
                                                    <Row>
                                                        <Col sm={3} className='align-self-center'>24h</Col>
                                                        <Col sm={9} className='text-success align-self-center'>{this.state.pctChange24h}</Col>
                                                    </Row>
                                                </Col>
                                                <Col sm={12} md={12} lg={12} xl={12}>
                                                    <Row>
                                                        <Col sm={3} className='align-self-center'>1h</Col>
                                                        <Col sm={9} className='text-danger align-self-center'>{this.state.pctChange1h}</Col>
                                                    </Row>
                                                </Col>
                                            </Row>
                                        </Col>
                                        <Col sm={2} md={2} lg={2} xl={2} className='align-self-center'>
                                            <Row>
                                                <Col sm={12} md={12} lg={12} xl={12}>
                                                    <Row>
                                                        <Col sm={3} className='align-self-center'>Bid</Col>
                                                        <Col sm={9} className='text-success align-self-center'>{this.state.lowBid}</Col>
                                                    </Row>
                                                </Col>
                                                <Col sm={12} md={12} lg={12} xl={12}>
                                                    <Row>
                                                        <Col sm={3} className='align-self-center'>Ask</Col>
                                                        <Col sm={9} className='text-danger align-self-center'>{this.state.highAsk}</Col>
                                                    </Row>
                                                </Col>
                                            </Row>
                                        </Col>
                                        <Col sm={2} md={3} lg={3} xl={3} className='align-self-center'>
                                            <Row>
                                                <Col sm={12} md={12} lg={12} xl={12}>
                                                    <Row>
                                                        <Col sm={7} md={6} lg={5} className='align-self-center'>24H high</Col>
                                                        <Col sm={5} md={6} lg={7} className='align-self-center'>{this.state.high24}</Col>
                                                    </Row>
                                                </Col>
                                                <Col sm={12} md={12} lg={12} xl={12}>
                                                    <Row>
                                                        <Col sm={7} md={6} lg={5} className='align-self-center'>24H low</Col>
                                                        <Col sm={5} md={6} lg={7} className='align-self-center'>{this.state.low24}</Col>
                                                    </Row>
                                                </Col>
                                            </Row>
                                        </Col>
                                    </Row>
                                </div>
                                <Card className='mt-2 it-trading_view'>
                                    <CardBody>
                                    </CardBody>
                                </Card>
                            </div>


                        </div>
                        <Row className='button-cards'>
                            <Col className='col-12' md={12} lg={8} xl={8}>
                                <Card className='order-book-card'>
                                    <CardBody>
                                        <div className='d-flex justify-content-between mt-2'>
                                            <div>
                                                <div className="d-flex flex-row">
                                                    <strong className='it-fs18 mr-2'>Order Book</strong>
                                                </div>
                                            </div>
                                        </div>
                                        {/*<OrderBookTable active_index={active_index} active_index_1={active_index_1}/>*/}
                                        <Row className='mt-4 text-right it-order-book'>
                                            <Col className='tb-1' sm={6}>
                                                <Table className='order-book-table'>
                                                    <thead>
                                                    <tr>
                                                        <th>Sum BTC</th>
                                                        <th>Total LTC</th>
                                                        <th>Size BTC</th>
                                                        <th>Bid</th>
                                                        <th/>
                                                    </tr>
                                                    </thead>
                                                    <tbody>

                                                    {
                                                        this.state.orderBook.bids.map((item) => (
                                                            <tr key={item} className={`${1 === item ? 'active' : ''} it-pointer`} onClick={() => this.setState({formPrice:item.price})}>
                                                                <td>{item.sumBTC}</td>
                                                                <td>{item.quantity}</td>
                                                                <td>{item.quantity * item.price}</td>
                                                                <td className='text-success'>{item.price} </td>
                                                                <td className='icon'>
                                                                    <div className='bg-success'>
                                                                        <img src={require('../assets/icons/raw_up.svg')} />
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    }

                                                    {/*{*/}
                                                    {/*[1,2,3,4,5,6,7,8,9].map((item) => (*/}
                                                    {/*<tr key={item} className={`${active_index === item ? 'active' : ''} it-pointer`}>*/}
                                                    {/*<td>0.000999939</td>*/}
                                                    {/*<td>0.00088888</td>*/}
                                                    {/*<td>1.00017239</td>*/}
                                                    {/*<td className='text-success'>0.00017239</td>*/}
                                                    {/*<td className='icon'>*/}
                                                    {/*<div className='bg-success'>*/}
                                                    {/*<img src={require('../../assets/icons/raw_up.svg')} />*/}
                                                    {/*</div>*/}
                                                    {/*</td>*/}
                                                    {/*</tr>*/}
                                                    {/*))*/}
                                                    {/*}*/}
                                                    </tbody>
                                                </Table>
                                            </Col>
                                            <Col className='tb-2' sm={6}>
                                                <Table className='order-book-table reverse'>
                                                    <thead>
                                                    <tr>
                                                        <th/>
                                                        <th>Ask</th>
                                                        <th>Total BTC</th>
                                                        <th>Size LTC</th>
                                                        <th>Sum BTC</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {


                                                        this.state.orderBook.offers.map((item) => (
                                                            <tr key={item.price} className={`${active_index === item ? 'active' : ''} it-pointer`} onClick={() => this.setState({formPrice:item.price})}>
                                                                <td className='icon'>
                                                                    <div className='bg-danger'>
                                                                        <ReactSVG
                                                                            path={require('../assets/icons/raw_down.svg')}
                                                                        />
                                                                    </div>
                                                                </td>                                                            <td>{item.price}</td>
                                                                <td>{item.quantity}</td>
                                                                <td>{item.quantity * item.price}</td>
                                                                <td className='text-success'>{item.price} </td>

                                                            </tr>
                                                        ))


                                                        // [1,2,3,4,5,6,7,8,9].map((item) => (
                                                        //     <tr key={item} className={`${active_index_1 === item ? 'active' : ''} it-pointer`}>
                                                        //         <td className='icon'>
                                                        //             <div className='bg-danger'>
                                                        //                 <ReactSVG
                                                        //                     path={require('../../assets/icons/raw_down.svg')}
                                                        //                 />
                                                        //             </div>
                                                        //         </td>
                                                        //         <td className='text-danger'>0.00017239</td>
                                                        //         <td>0.00017239</td>
                                                        //         <td>0.00017239</td>
                                                        //         <td>0.00017239</td>
                                                        //     </tr>
                                                        // ))
                                                    }
                                                    </tbody>
                                                </Table>
                                            </Col>
                                        </Row>
                                        {/*{order_book ? (<OrderBookTable active_index={active_index} active_index_1={active_index_1}/>) : null}*/}
                                    </CardBody>
                                </Card>

                                <Card className='order-book-card'>
                                    <CardBody>
                                        <div className='d-flex justify-content-between mt-2'>
                                            <div>
                                                <div className="d-flex flex-row">
                                                    <strong className='it-fs18 mr-2'>My orders</strong>
                                                </div>
                                            </div>
                                        </div>
                                        {/*<OrderBookTable active_index={active_index} active_index_1={active_index_1}/>*/}
                                        <Row className='mt-4 text-right it-order-book'>
                                            <Col className='tb-1' sm={12}>
                                                <Table className='order-book-table'>
                                                    <thead>
                                                    <tr>
                                                        <th>OrderId</th>
                                                        <th>status</th>
                                                        <th>type</th>
                                                        <th>progress</th>
                                                        <th>actions</th>
                                                        <th/>
                                                    </tr>
                                                    </thead>
                                                    <tbody>

                                                    {
                                                        this.state.userOrders.map((item) => (
                                                            <tr key={item} className='it-pointer'>
                                                                <td onClick={() => push("order/" + item.orderId)}>{item.orderId}</td>
                                                                <td>{item.status}</td>
                                                                <td className='text-success'>{item.type}</td>
                                                                <td>{item.price}</td>
                                                                <td>{item.amount}</td>
                                                                <td>{item.amountQuote}</td>
                                                            </tr>
                                                        ))
                                                    }


                                                    </tbody>
                                                </Table>
                                            </Col>
                                        </Row>
                                        {/*{order_book ? (<OrderBookTable active_index={active_index} active_index_1={active_index_1}/>) : null}*/}
                                    </CardBody>
                                </Card>
                            </Col>
                            <Col md={12} lg={4} xl={4} className='col-12 market'>
                                <Card>
                                    <CardBody>
                                        <strong className='market-title it-fs18'>Market history</strong>
                                        <div>
                                            <Row className='it-market-history-row justify-content-center'>
                                                <Col className='it-fs12' sm={12} md={12} lg={12} xl={12}>
                                                    <Table className='market-history-table'>
                                                        <thead>
                                                        <tr>
                                                            <th>Time</th>
                                                            <th>Type</th>
                                                            <th>Price</th>
                                                            <th>Amount</th>
                                                            <th>Total cost</th>
                                                        </tr>
                                                        </thead>
                                                        <tbody>
                                                        {
                                                            this.state.tradeHistory.map((item) => (
                                                                <tr key={item} onClick={() => set_order_close_modal(true)} className='it-pointer'>
                                                                    <td>{item.time}</td>
                                                                    <td className='text-success'>Buy</td>
                                                                    <td>{item.price}</td>
                                                                    <td>{item.amount}</td>
                                                                    <td>{item.amountQuote}</td>
                                                                </tr>
                                                            ))
                                                        }

                                                        </tbody>
                                                    </Table>
                                                </Col>
                                            </Row>
                                        </div>
                                    </CardBody>
                                </Card>
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
        set_order_close_modal: (modal,price,amount,orderType,market) => dispatch(set_order_close_modal(modal,price,amount,orderType,market)),
        baseWrapper: event => dispatch(baseWrapper(event))
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(Trading);
