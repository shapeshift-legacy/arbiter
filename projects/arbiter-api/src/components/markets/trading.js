import React, { Component } from 'react';
import { connect } from 'react-redux'
import {
    Card, CardBody, Row, Col, Button,
    FormGroup, Label, Input, Table,
    Dropdown, DropdownToggle, DropdownMenu, DropdownItem
} from 'reactstrap';
import { API_HOST } from '../../config'
import {push} from "react-router-redux";
import ReactSVG from 'react-svg';
import {set_order_close_modal} from "../../actions/menu";
import {baseWrapper} from "../../actions/eventWrapper";
import FontAwesome from 'react-fontawesome'
// import update from 'react-addons-update';
import update from 'immutability-helper';


//Sockets
//TODO per market (only sub to correct context)
import {
    //subscribeToTimer,
    subscribeToLastPrice,
    subscribeToOrderUpdates,
    //subscribeToVolume24h,
    subscribeToPctChange24h,
    subscribeToPctChange1h,
    subscribeToLowBid,
    subscribeToHighAsk,
    subscribeToHigh24,
    subscribeToLow24} from '../../api';

//import orderBook from './data/orderbook.json'




// Functions
let find_order = function(orderTier,orderId){
    let tag = " | find_order | "
    try{
        console.log(tag,"orderTier:  ",orderTier)
        let position = -1
        for(var i = 0; i < orderTier.length; i++) {
            let orders = orderTier[i].orders
            console.log(tag,"orders: ",orders)


            for(let j = 0; j < orders.length; j++){
                let order = orders[j]
                console.log(tag,"order: ",order)
                console.log(tag,"order: ",order.id)

                if (order.id == orderId) {
                    position = i
                }
            }
        }
        return position
    }catch(e){
        console.error(e)
        throw e
    }
}


let update_element = function(element,order){
    let tag = " | update_element | "
    try{
        let elementNew = {}
        let orderId = order.id

        console.log(tag,"element:  ",element)

        //splice out element
        console.log(tag,"oldArr: ",element.orders)

        for(let i = 0; i < element.orders.length; i++){
            let orderOld = element.orders[i]
            console.log(tag,"order: ",orderOld)
            console.log(tag,"order: ",orderOld.id)

            if (orderOld.orderId == orderId) {
                console.log(tag,"WINNING")
                //splice out
                if(order.qty > 0){
                    element.orders.splice(i, 1, order)
                } else {
                    element.orders.splice(i, 1)
                }
            }

        }
        console.log(tag,"newArr: ",element.orders)

        //calculate new quantity
        let newQuantity = 0
        for(let i = 0; i < element.orders.length; i++){
            let order = element.orders[i]
            newQuantity = order.qty + order.qty
        }
        elementNew.price = element.price
        elementNew.quantity = newQuantity
        elementNew.orders = element.orders
        //


        return elementNew
    }catch(e){
        console.error(e)
        throw e
    }
}


let create_element = function(order){
    let tag = " | create_element | "
    try{
        if(!order.orderId) console.error("101: invalid event! ",order)
        if(!order.qty) console.error("102: invalid event! ",order)
        if(!order.orderId) console.error("103: invalid event! ",order)

        let elementNew = {}
        let orderId = order.orderId

        elementNew.quantity = order.qty
        elementNew.price = order.price
        elementNew.orders = []
        elementNew.orders.push({id:orderId,qty:order.qty})
        return elementNew
    }catch(e){
        console.error(e)
        throw e
    }
}


let update_function = function(orderbook,events){
    let tag = " | update_function | "
    try{
        let newOrderBook = orderbook
        console.log("event: ",events)

        for(let i = 0; i < events.length; i ++){
            let event = events[i]
            console.log("event: ",event)
            let orderId = event.orderId
            console.log("orderId: ",orderId)
            //for each state change

            //find location in array
            console.log("orders: ",orderbook.offers)
            //console.log("orders: ",orderbook.offers.orders)

            let locationBid = find_order(orderbook.bids,orderId)
            let locationAsk = find_order(orderbook.offers,orderId)
            console.log(tag,"locationBids",locationBid)
            console.log(tag,"locationAsks",locationAsk)

            //get element
            let elementOld

            //if bid
            if(locationBid >= 0){
                elementOld = orderbook.bids[locationBid]
                //
                console.log(tag,"elementOld: ",elementOld)

                //calculate new element
                let elementNew = update_element(elementOld, event)
                console.log(tag,"elementNew: ",elementNew)

                if(elementNew.order > 0){
                    newOrderBook.bids.splice(locationBid,0,elementNew)
                } else {
                    //delete whole element
                    newOrderBook.bids.splice(locationBid,1)
                }
            }

            //if ask
            if(locationAsk >= 0){
                elementOld = orderbook.offers[locationAsk]
                //
                console.log(tag,"elementOld: ",elementOld)

                //calculate new element
                let elementNew = update_element(elementOld, event)
                console.log(tag,"elementNew: ",elementNew)
                if(elementNew.order > 0){
                    newOrderBook.offers.splice(locationAsk,0,elementNew)
                } else {
                    //delete whole element
                    newOrderBook.offers.splice(locationAsk,1)
                }
            }

            if(locationAsk < 0 && locationBid < 0){
                console.log(tag,"detect submit")
                console.log(tag,"submit: ",event)

                //if amount is positive
                if (event.qty > 0){
                    //push to bids
                    let elementNew = create_element(event)
                    newOrderBook.bids.push(elementNew)
                    //sort bids by price
                } else {
                    //push to offers
                    let elementNew = create_element(event)
                    newOrderBook.offers.push(elementNew)
                }
            }



        }

        return newOrderBook
    }catch(e){
        console.error(e)
        throw e
    }
}


class Trading extends Component{

    constructor(props) {
        super(props);

        this.toggle = this.toggle.bind(this);
        this.state = {
            active_index: -1,
            tradeHistory: [],
            active_index_1: -1,
            orderBook:{bids:[],offers:[]},
            globals:{},
            order_book: 2,
            dropdownOpen: false,
            timestamp: 'no timestamp yet',
            lastPrice: 'no price yet',
            volume24h:1337.31,
            pctChange24h:-0.51,
            pctChange1h:0.01,
            lowBid:0.00848,
            highAsk:0.00818,
            high24:0.0086348,
            low24:0.008438
        }
    }

    componentDidMount(){
        //LAZY hack to get books
        // subscribeToTimer((err, timestamp) => this.setState({
        //     timestamp
        // }));

        subscribeToLastPrice((err, lastPrice) => this.setState({
            lastPrice
        }));

        //TODO orderbook
        // subscribeToOrderUpdates(function(err,event){
        //     console.log("***********88 orderUpdate event: ",event)
        //     console.log("***********88 orderUpdate err: ",err)
        //     //for each
        //     //let oldState = this.getState()
        //     //console.log("***********88 oldBook: ",oldState.orderbook)
        //
        //     //for each newOrderState
        //
        //     //if 0 splice
        //
        //     //update state
        //
        //     //lazy hack
        //
        //
        // });

        // subscribeToOrderUpdates((err,events) => this.setState({
        //     lastPrice:22222
        // }));

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
                let newOrderbook = update_function(orderbook,event.newOrderStates)
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


        // subscribeToVolume24h(async (err, volume24h) => {
        //     try{
        //
        //
        //         this.setState({
        //             volume24h
        //         })
        //     }catch(e){
        //
        //     }
        // });
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

        // subscribeToHighBid((err, lastPrice) => this.setState({
        //     lastPrice
        // }));

        // subscribeToOrderUpdates((err, events) =>
        //
        //     //apply events
        //     console.log("events: ",events)
        //
        //     //update orderbook state
        //
        //     //this.setState({lastPrice})
        // );

        // let url = 'http:127.0.0.1:5000/orderbook';
        // fetch('http:127.0.0.1:5000/orderbook')
        //     .then(function(response) {
        //         if (response.status >= 400) {
        //             throw new Error("Bad response from server");
        //         }
        //         console.log("************** () ",response.text());
        //         return response.text();
        //     })
        //     .then(function(data) {
        //         console.log("************** () ",data);
        //     });


        let url = API_HOST + '/api/v1/orderbook/LTC_BTC'
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


            let url2 = API_HOST + '/api/v1/history/LTC_BTC';
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

            //


        //},30000)



        // let url = 'https://api.github.com/users/bithighlander/repos';
        // fetch(url)
        //     .then(response => response.json()).then((repos) => {
        //         console.log(repos);
        //         console.log(repos.length);
        //         // this.setState({
        //         //     repos: repos
        //         // });
        //     });


        // fetch('http:127.0.0.1:5000/orderbook')
        //     .then(function(resp){
        //         console.log("******  ",resp.json())
        //
        //         //this.setState({orderBook:resp});
        //     })
        //     //.then(data => this.setState({ data }));
        //     .catch(function(e){
        //         console.error(e)
        //     })

        // setInterval(() => {
        //     fetch('http:127.0.0.1:5000/orderbook')
        //         .then(function(resp){
        //             console.log(resp)
        //
        //             this.setState({orderBook:resp});
        //         })
        //         //.then(data => this.setState({ data }));
        //         .catch(function(e){
        //             console.error(e)
        //         })
        // }, 2000)


        // setInterval(() => {
        //     this.setState({
        //         active_index: Math.floor(Math.random() * 9),
        //         active_index_1: Math.floor(Math.random() * 9)
        //     });
        //     setTimeout(() => {
        //         this.setState({
        //             active_index: -1,
        //             active_index_1: -1
        //         });
        //     }, 300)
        // }, 1000)
    }

    toggle() {
        this.setState({
            dropdownOpen: !this.state.dropdownOpen
        });
    }

    render() {

        const {
                theme, set_order_close_modal,
                baseWrapper
        } = this.props,
            {
                active_index, active_index_1, order_book
            } = this.state;

        return(
            <div className='it-page it-page-trading'>
                <div className='it-trading'>
                    <div className='d-flex flex-row mb-2'>
                        <div className='mt-3 main-view'>
                            <div className="d-flex flex-row">
                                <div className='it-title'>
                                    LTC/BTC LAST: {this.state.lastPrice}
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
                        <div className='mt-4 buy-sell'>
                            <Card>
                                <CardBody>
                                    <div className='text-center wallet-count-block'>
                                        <img src={theme.nav_wallet} className='it-icon non_op'/>
                                        <span className='it-fs16 ml-2 align-middle it-medium wallet-count'>40.00600209 LTC</span>
                                        <p className='it-fs12'>
                                            Total 1000.90 USD
                                            <hr className="it-hr-text" data-content="DEMO"/>
                                        </p>
                                    </div>
                                    <div className='text-center mt-4 w-100 pt-1 mb-1'>
                                        <div className="btn-group d-flex btn-buy-sell" role="group">
                                            <Button
                                                className='border-0'
                                                onClick={() => baseWrapper(() => null)}
                                                color='success'
                                            >
                                                <img src={require('../../assets/icons/raw_up.svg')} />
                                                <span className='it-fw6'>Buy</span>
                                            </Button>
                                            <Button
                                                className='bg-white text-dark border border-left-0'
                                                onClick={() => baseWrapper(() => null)}
                                            >
                                                <div className='d-flex justify-content-center'>
                                                    <ReactSVG
                                                        path={require('../../assets/icons/raw_down.svg')}
                                                        className='mr-1'
                                                        color='light'
                                                    />
                                                    <span className='it-half-opacity it-fw6'>Sell</span>
                                                </div>
                                            </Button>
                                        </div>
                                    </div>
                                    <Label className='mt-3'>Order type</Label>
                                    <Dropdown isOpen={this.state.dropdownOpen} toggle={this.toggle} className='mb-3'>
                                        <DropdownToggle color='light' className='w-100 order-dropdown'>
                                            <div className='d-flex justify-content-between'>
                                                <div>Order type</div>
                                                <FontAwesome name='caret-down'/>
                                            </div>
                                        </DropdownToggle>
                                        <DropdownMenu>
                                            <DropdownItem disabled>
                                                <FontAwesome name='check' className='dropdown-check'/> Action
                                            </DropdownItem>
                                            {
                                                [
                                                    'Limit',
                                                    'Market',
                                                    'Stop',
                                                    'Stop-Limit',
                                                    'Trailing stop',
                                                    'Fill or Kill'
                                                ].map((item, i) => (
                                                    <DropdownItem key={i}>
                                                        {item}
                                                    </DropdownItem>
                                                ))
                                            }
                                        </DropdownMenu>
                                    </Dropdown>
                                    <Label for="total" className='mt1'>Price</Label>
                                    <div className="input-group">
                                        <input type="text" className="form-control" value='0.023194'/>
                                        <div className="input-group-append">
                                            <span className="input-group-text">BTC</span>
                                        </div>
                                    </div>
                                    <div className="d-flex flex-row mt-1 it-pointer">
                                        <span className='text-primary mr-2'>Bid</span>
                                        <span className='text-primary mr-2'>Ask</span>
                                    </div>
                                    <Label for="total" className='label-amount'>Amount</Label>
                                    <div className="input-group mb-1">
                                        <input type="text" className="form-control" />
                                        <div className="input-group-append">
                                            <span className="input-group-text">LTC</span>
                                        </div>
                                    </div>
                                    <Label for="total" className='mt-3'>Total</Label>
                                    <div className="input-group">
                                        <input type="text" className="form-control" />
                                        <div className="input-group-append">
                                            <span className="input-group-text">BTC</span>
                                        </div>
                                    </div>
                                    <div className="d-flex flex-row mt-1 it-pointer">
                                        <span className='text-primary mr-2'>2%</span>
                                        <span className='text-primary mr-2'>5%</span>
                                        <span className='text-primary mr-2'>10%</span>
                                        <span className='text-secondary ml-4'>23%</span>
                                    </div>
                                    <Button
                                        className='bg-success mb-3 border-0 py-2 btn-buy'
                                        block
                                        onClick={() => baseWrapper(() => null)}
                                    >
                                        <img src={require('../../assets/icons/raw_up.svg')} style={{height: 17}} className='mb-1'/>
                                        <span className='ml-2 it-fw6'>Buy Monero</span>
                                    </Button>
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
                                                {/*<div className="d-flex flex-row it-btn-group ml-2 two mr-2">*/}
                                                    {/*/!*<div*!/*/}
                                                        {/*/!*className={`it-btn ${order_book === 1 ? 'active' : ''}`}*!/*/}
                                                        {/*/!*onClick={() => this.setState({order_book: 1})}*!/*/}
                                                    {/*/!*>*!/*/}
                                                        {/*/!*<span>Graph</span>*!/*/}
                                                    {/*/!*</div>*!/*/}
                                                    {/*/!*<div*!/*/}
                                                        {/*/!*className={`it-btn ${order_book === 2 ? 'active' : ''}`}*!/*/}
                                                        {/*/!*onClick={() => this.setState({order_book: 2})}*!/*/}
                                                    {/*/!*>*!/*/}
                                                        {/*/!*<span>Table</span>*!/*/}
                                                    {/*/!*</div>*!/*/}
                                                {/*</div>*/}
                                                {
                                                    // order_book === 1 ? [
                                                    //     <div className='price_range'>
                                                    //         <span className='ml-4 mr-1 it-fs12'>Price range</span>
                                                    //     </div>,
                                                    //     <div className="d-flex flex-row it-btn-group ml-2 four">
                                                    //         <div className='it-btn active'><span>25%</span></div>
                                                    //         <div className='it-btn'><span>50%</span></div>
                                                    //         <div className='it-btn'><span>75%</span></div>
                                                    //         <div className='it-btn'><span>100%</span></div>
                                                    //     </div>
                                                    // ] : null
                                                }
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
                                                        <tr key={item} className={`${1 === item ? 'active' : ''} it-pointer`}>
                                                            <td>{item.sumBTC}</td>
                                                            <td>{item.quantity}</td>
                                                            <td>{item.quantity * item.price}</td>
                                                            <td className='text-success'>{item.price} </td>
                                                            <td className='icon'>
                                                                <div className='bg-success'>
                                                                    <img src={require('../../assets/icons/raw_up.svg')} />
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
                                                {/*<img src={require('../../../assets/icons/raw_up.svg')} />*/}
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
                                                        <tr key={item.price} className={`${active_index === item ? 'active' : ''} it-pointer`}>
                                                             <td className='icon'>
                                                                 <div className='bg-danger'>
                                                                     <ReactSVG
                                                                         path={require('../../assets/icons/raw_down.svg')}
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
                                                    //                     path={require('../../../assets/icons/raw_down.svg')}
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
                        </Col>
                        <Col md={12} lg={4} xl={4} className='col-12 market'>
                            <Card>
                                <CardBody>
                                    <strong className='market-title it-fs18'>Market history</strong>
                                    <div>
                                        <Row className='it-market-history-row justify-content-center'>
                                            <Col className='it-fs12' sm={6} md={6} lg={12} xl={12}>
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

                                                    {/*{*/}
                                                        {/*[1,2,3,4,5,6,7,8,9].map((item) => (*/}
                                                            {/*<tr key={item} onClick={() => set_order_close_modal(true)} className='it-pointer'>*/}
                                                                {/*<td>15:19</td>*/}
                                                                {/*<td className='text-success'>Buy</td>*/}
                                                                {/*<td>0.02315000</td>*/}
                                                                {/*<td>1.05022332</td>*/}
                                                                {/*<td>1.05022332</td>*/}
                                                            {/*</tr>*/}
                                                        {/*))*/}
                                                    {/*}*/}
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
        set_order_close_modal: modal => dispatch(set_order_close_modal(modal)),
        baseWrapper: event => dispatch(baseWrapper(event))
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(Trading);