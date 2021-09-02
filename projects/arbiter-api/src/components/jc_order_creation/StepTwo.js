'use strict'
import React from 'react'
import QRCode from 'qrcode.react'
import {
    Card, CardBody, Row, Col, Button,
    FormGroup, Label, Input, Table,
    Dropdown, DropdownToggle, DropdownMenu, DropdownItem, Container
} from 'reactstrap';
import checkmark from '../../assets/icons/checkmark.png'

// let arbiterResponse =   {
//     account:"1EbE7NHdEae1NQu2vQ9i6U43CaudQVfFQz",
//     payload: {
//         orderId: '6e8cac4b-1b53-4344-8f1e-4fc0f0c5c16d',
//         pubkeyCustomer: '022a43067e12da19441f70ad95660629e0c9d14d25d8e902f46a9ad0a73c710afd',
//         pubkeyArbiter: '03c731859ecb360d2d372ba133fb5e58df393705e1ee332c7de5bc42abfe467fda',
//         pubkeyOracle: '03c7ba329580905263713071f3d61c1bbf1d313c75f1327b8d09708e60642460ed',
//         depositAddress: 'MPwkRk2KHEqkXmW1HnnYmmVrUHXkHr88oX',
//         returnAddress: 'LLe4PciAJgMMJSAtQQ5nkC13t6SSMmERJ3',
//         withdrawalAddress: '1LUEqRQv9NJZsfwEM2qqGrW4TVw5QeJd5r',
//         maxDeposit: 'Not set',
//         minDeposit: 'Not set',
//         coinIn: 'LTC',
//         coinOut: 'BTC',
//         amountIn: '.12',
//         rate: '0.01746006',
//         pair: 'LTC_BTC'
//     },
//     signature:"IGIlvixWbLKGN7HVMJUOhcvaMWdkfPPizp+V5jOLMDK3R/NL+CkBG+7P3A6u+2X4Jo2SU47JI7Hym2L304DGNEo="
// }
// let orderParamsArb = Object.keys(arbiterResponse.payload)
//
// let oracleResponse =  {
//     account:"1LUEqRQv9NJZsfwEM2qqGrW4TVw5QeJd5r",
//     payload: {
//         "orderId": "6e8cac4b-1b53-4344-8f1e-4fc0f0c5c16d",
//         "coin": "2.1",
//         "arbiterPubKey": "03c731859ecb360d2d372ba133fb5e58df393705e1ee332c7de5bc42abfe467fda",
//         "pubkeyOracle": "03c7ba329580905263713071f3d61c1bbf1d313c75f1327b8d09708e60642460ed",
//         "userkey": "022a43067e12da19441f70ad95660629e0c9d14d25d8e902f46a9ad0a73c710afd",
//         "depositAddress": "MPwkRk2KHEqkXmW1HnnYmmVrUHXkHr88oX",
//         coinIn: 'LTC',
//         coinOut: 'BTC',
//         amountIn: '.12',
//         rate: '0.01746006',
//         pair: 'LTC_BTC'
//     },
//     signature:"H25K+bSx04TgpLfWg2FOYJ5eQTEKTh1k2Bv/Bz5zCJR2arJVzjTqOhN27F0hQNXd5dqyM3Uqfn9eSkE+HHt+G0k="
// }
// let orderParamsOra = Object.keys(oracleResponse.payload)
//
// let balancesCold = {
//     BTC:0.001,
//     LTC: 1.01
// }
//
// let balancesCustody = {
//     BTC:0.002,
//     LTC: 2.01
// }



export class StepTwo extends React.Component {
  constructor () {
    super()
    this.state = {
      email: '',
      emailConfirm: ''
    }
    this.handleEmailChanged = this.handleEmailChanged.bind(this);
    this.handleEmailConfirmChanged = this.handleEmailConfirmChanged.bind(this);
  }

    async componentDidMount(){

      console.log("STEP 2: props: ",this.props)

    }

  handleEmailChanged (event) {
    this.setState({email: event.target.value})
  }

  handleEmailConfirmChanged (event) {
    this.setState({emailConfirm: event.target.value})
  }

  render () {
    return (

            <div class="container">
                <div class="row">
                    <div class="col-xs-6">
                        <p>Arbiter</p>
                        <Table className='border-bottom table-night'>
                            <thead>

                            </thead>
                            <tbody>
                            {

                                this.props.orderParamsArb.map(param => (
                                    <tr>
                                        <td>
                                            <span className='it-fs12  it-medium'>{param}:   { this.props.arbiterResponse.payload[param]} </span>
                                        </td>


                                    </tr>
                                ))
                            }
                            </tbody>
                        </Table>
                    </div>
                    <div class="col-xs-6">
                        <p>Oracle</p>
                        <Table className='border-bottom table-night'>
                            <thead>

                            </thead>
                            <tbody>
                            {

                                this.props.orderParamsOra.map(param => (
                                    <tr>
                                        <td>
                                            <span className='it-fs12  it-medium'>{param}:   {this.props.oracleResponse.payload[param]} </span>
                                        </td>


                                    </tr>
                                ))
                            }
                            </tbody>
                        </Table>



                    </div>
                    <p></p>
                    <p>Signatures</p>
                    <Table className='border-bottom table-night'>
                        <thead>

                        </thead>
                        <tbody>



                        <tr>
                            <td>
                                <span className='it-fs12  it-medium'><img src={checkmark} width="30" height="30" ></img> Arbiter:  {this.props.oracleResponse.signature} </span>
                            </td>


                        </tr>

                        <tr>
                            <td>
                                <span className='it-fs12  it-medium'><img src={checkmark} width="30" height="30" ></img> Oracle:  {this.props.arbiterResponse.signature} </span>
                            </td>


                        </tr>

                        </tbody>
                    </Table>
                </div>
            </div>

    )
  }
}
