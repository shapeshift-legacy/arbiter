import React, {Component} from 'react';
import {push} from "react-router-redux";
import {
    Row, Col, Progress, Card, CardBody, CardText, Badge,
    Button, ListGroup, ListGroupItem, Input, FormGroup, Label,
    Table
} from 'reactstrap';
import FontAwesome from 'react-fontawesome'
import {connect} from "react-redux";
import {set_top_panel} from "../actions/menu";
import URLS from "../constants/urls";

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

class table extends Component {
    constructor(props) {
        super(props);

        this.state = {
            tile: false,
            marketSelected:null,
        }
    }

    componentDidMount() {
        const {set_top_panel} = this.props;


    }

    render() {

        const {push, theme} = this.props,
            {tile} = this.state;

        let set_state_market = function(market){
            this.setState({marketSelected:market})
        }

        return (
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
                        <tr key={market} onClick={
                            function(){
                                set_top_panel(market.market)
                                push("market/"+market.market)
                            }
                        }>
                            <td className='with_img'>
                                <img src={market.icon}/>
                                <span className='it-fs16 ml-3 it-medium'>{market.baseLong} </span>
                            </td>
                            <td onClick={() => push("market/" + market.market)}>
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
        )
    }
};

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

//export default table
export default connect(mapStateToProps, mapDispatchToProps)(table);