import React, { Component } from 'react';
import { connect } from 'react-redux'
import {BasePage} from '../elements'
import {
    Row, Col, Progress, Card, CardBody,
    CardText, Badge, Button, Input, Tooltip as TooltipEl
} from 'reactstrap';
import URLS from '../constants/urls'
import {push} from "react-router-redux";
import { AreaChart, Area, Cell, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, ResponsiveContainer } from 'recharts';
import ReactSVG from 'react-svg';
import {FacebookIcon, TwitterIcon, TelegramIcon} from 'react-share';
import MultiStep from './oracle_signup/multiStep'
import { steps } from './oracle_signup/index'


class Trader1 extends Component{

    constructor(props) {
        super(props);

        this.state = {
            tooltipShare: false
        };
    }

    componentDidMount() {
        setTimeout(() => this.setState({tooltipShare: true}), 500)
    }


    render() {

        const {push, theme} = this.props,
            data = [
                {name: '26.11', uv: 4000, pv: 2400, amt: 2400},
                {name: '26.11', uv: 3000, pv: 1398, amt: 2210},
                {name: '26.11', uv: 2000, pv: 9800, amt: 2290},
                {name: '26.11', uv: 2780, pv: 3908, amt: 2000},
                {name: '26.11', uv: 1890, pv: 4800, amt: 2181},
                {name: '26.11', uv: 2390, pv: 3800, amt: 2500},
                {name: '26.11', uv: 3490, pv: 4300, amt: 2100},
            ],
            {tooltipShare} = this.state;

        return (
            <BasePage
                active={[false, false, false]}
                traders_active={true}
            >



                <div className='it-page'>
                    <div className="container">
                        <h1> Oracle signup: Join the swarm! </h1>
                        <div>
                            <MultiStep steps={steps}/>
                        </div>
                        <div className="container app-footer">
                            <h6>Press 'Enter' or click on progress bar for next step.</h6>
                        </div>
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
        push: url => dispatch(push(url))
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(Trader1);
