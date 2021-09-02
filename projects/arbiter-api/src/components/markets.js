import React, { Component } from 'react';
import { connect } from 'react-redux'
import {BasePage} from '../elements'
import {
    Row, Col, Progress, Card, CardBody, CardText, Badge, Button,
    ListGroup, ListGroupItem, Input, FormGroup, Label, Table
} from 'reactstrap';
import FontAwesome from 'react-fontawesome'
import URLS from '../constants/urls'
import {push} from "react-router-redux";
import {set_top_panel} from "../actions/menu";
import {baseWrapper} from "../actions/eventWrapper";
import ReactSVG from 'react-svg';
import Tile from './tile'
//import Table from './table'


let markets = [
    {
        market:"LTC_BTC",
        icon:"https://static.coincap.io/assets/icons/ltc@2x.png",
        base:"LTC",
        baseLong:"Litecoin",
        quote:"BTC",
        quoteLong:"Bitcoin",
        lastPrice:0.00848,
        volume24h:1336.30,
        pctChange7d:-1.51,
        pctChange24h:-0.51,
        pctChange1h:0.01,
        lowBid:0.00848,
        highAsk:0.00818,
        high24:0.0086348,
        low24:0.008438
    },
    {
        market:"ETH_BTC",
        icon:"https://static.coincap.io/assets/icons/eth@2x.png",
        base:"ETH",
        baseLong:"Ethereum",
        quote:"BTC",
        quoteLong:"Bitcoin",
        lastPrice:0.00848,
        volume24h:1336.30,
        pctChange7d:-1.51,
        pctChange24h:-0.51,
        pctChange1h:0.01,
        lowBid:0.00848,
        highAsk:0.00818,
        high24:0.0086348,
        low24:0.008438
    },
    {
        market:"GNT_BTC",
        icon:"https://static.coincap.io/assets/icons/gnt@2x.png",
        base:"GNT",
        baseLong:"Golem",
        quote:"BTC",
        quoteLong:"Bitcoin",
        lastPrice:0.00848,
        volume24h:1336.30,
        pctChange7d:-1.51,
        pctChange24h:-0.51,
        pctChange1h:0.01,
        lowBid:0.00848,
        highAsk:0.00818,
        high24:0.0086348,
        low24:0.008438
    }
]



class MarketList extends Component{

    constructor(props) {
        super(props);

        this.state = {
            marketSelected:null,
            tile: false
        }
    }

    componentDidMount() {
        const {set_top_panel} = this.props;


    }

    changeView() {
        this.setState({tile: !this.state.tile})
    }

    _set_top_panel(market) {
        const {push, set_top_panel, set_my_orders} = this.props;
        console.log("setting top panel to: ")
        set_top_panel(market);
    }

    render() {

        const {push, theme} = this.props,
            {tile} = this.state;


        return (
            <BasePage
                active={[false, false, false]}
            >
                <div className='it-page'>
                    <div className='it-market-list'>
                        <Row className='justify-content-between'>
                            <Col className='mt-3'>
                                <p className='it_page_title'>Markets</p>
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
                                <th><span className='it-dashed'>Coin</span></th>
                                <th>Pair</th>
                                <th><span className='it-dashed'>Last price</span></th>
                                <th><span className='it-dashed'>High</span></th>
                                <th><span className='it-dashed'>Low</span></th>
                                <th><span className='it-dashed text-primary border-primary'>Volume</span> <FontAwesome
                                    name='sort-desc caret'/></th>
                                <th><span className='it-dashed'>% 1h</span></th>
                                <th><span className='it-dashed'>% 1d</span></th>
                                <th><span className='it-dashed'>% 1w</span></th>
                            </tr>
                            </thead>
                            <tbody>
                            {

                                markets.map(market => (
                                    <tr key={market} onClick={() => push("market/" + market.market)}>
                                        <td className='with_img'>
                                            <img src={market.icon}/>
                                            <span className='it-fs16 ml-3 it-medium'>{market.baseLong} </span>
                                        </td>
                                        <td>
                                            <span className='it-fs16 text-primary it-medium'> {market.market} </span>
                                        </td>
                                        <td>
                                <span className='text-success it-fs16 it-medium'><FontAwesome
                                    name='sort-asc'/> {market.lastPrice}</span>
                                        </td>
                                        <td>
                                            <span className='it-fs16'>{market.high24}</span>
                                        </td>
                                        <td>
                                            <span className='it-fs16'>{market.low24}</span>
                                        </td>
                                        <td>
                                            <span className='it-fs16'>{market.volume24h}</span>
                                        </td>
                                        <td>
                                            <span className='text-success it-fs16 it-medium'>{market.pctChange1h}</span>
                                        </td>
                                        <td>
                                            <span className='text-success it-fs16 it-medium'>{market.pctChange24h}</span>
                                        </td>
                                        <td>
                                            <span className='text-danger it-fs16 it-medium'>{market.pctChange7d}</span>
                                        </td>
                                    </tr>
                                ))
                            }
                            </tbody>
                        </Table>

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

export default connect(mapStateToProps, mapDispatchToProps)(MarketList);