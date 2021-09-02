'use strict'
import React from 'react'
import {
    Card, CardBody, Row, Col, Button,
    FormGroup, Label, Input, Table,
    Dropdown, DropdownToggle, DropdownMenu, DropdownItem
} from 'reactstrap';
import walletIcon from '../../assets/icons/wallet.svg'
import FontAwesome from 'react-fontawesome'
import { connect } from 'react-redux'
import {ClosePageAction} from '../../actions/LeftPage'
import {push} from "react-router-redux";

// import 'react-select/dist/react-select.css';
// import 'react-virtualized/styles.css'
// import 'react-virtualized-select/styles.css'
// import createFilterOptions from "react-select-fast-filter-options";
// import Select from "react-virtualized-select";

export class StepOne extends React.Component {
  constructor () {
    super()

    this.state = {
      orderParams:  [],
      orderInfo:{},
      coinOut:"",
      coinIn:"",
      withdrawalAddress:"",
      returnAddress:""
    }
    this.handleColdWithdrawalPressed = this.handleColdWithdrawalPressed.bind(this);
    this.handleColdReturnPressed = this.handleColdReturnPressed.bind(this);


  }

  async componentDidMount(){
      // localStorage.setItem('coldBTC',"mrPtLrXqhYX9Len1xjcDrUDRhCUfVa9dTb")
      // localStorage.setItem('coldLTC',"QdZp27Tkaxds3hKT7u4TgGyER45Fu6YAkV")
      // localStorage.setItem('coldETH',"0x33b35c665496bA8E71B22373843376740401F106")
      // localStorage.setItem('coldGNT',"0x33b35c665496bA8E71B22373843376740401F106")

      console.log("props: ",this.props)
      console.log("*********** props: ",this.props.orderPrice)


      let coinIn
      let coinOut
      let orderType = this.props.orderType
      console.log("orderType: ",orderType)
      let market = this.props.market
      console.log("market: ",market)
      let coins = market.split("_")
      console.log("coins: ",coins)
      if(orderType === 'ask'){
          coinIn = coins[0]
          coinOut = coins[1]
      }else if(orderType === 'bid'){
          coinIn = coins[1]
          coinOut = coins[0]
      }
      console.log("coinIn: ",coinIn)
      console.log("coinOut: ",coinOut)

      let withdrawalAddress = localStorage.getItem('cold'+coinOut)
      let returnAddress = localStorage.getItem('cold'+coinIn)
      console.log("withdrawalAddress: ",withdrawalAddress)
      console.log("returnAddress: ",returnAddress)



      // let event
      // event = {
      //     target:localStorage.getItem('cold'+coinOut)
      // }
      // this.props.withdrawalAddressUpdate(event)
      //
      // event = {
      //     target:localStorage.getItem('cold'+coinIn)
      // }
      // this.props.returnAddressUpdate(event)

      let orderInfo = {
          price:this.props.orderPrice,
          amount:this.props.orderAmount,
          orderType:this.props.orderType,
          market:this.props.market
      }
      console.log("orderInfo: ",orderInfo)
      this.setState({
          orderParams:  Object.keys(orderInfo),
          orderInfo,
          coinIn,
          coinOut,
          withdrawalAddress,
          returnAddress
      })

  }

    handleColdWithdrawalPressed () {
      console.log("handleColdWithdrawalPressed: **********",this.state)
        console.log("handleColdReturnPressed: **********: ",this.state.withdrawalAddress)
        let event = {
          target:{
              value:this.state.withdrawalAddress
          }
      }

        this.props.withdrawalAddressUpdate(event)
    }
    handleColdReturnPressed () {
        console.log("handleColdReturnPressed: **********",this.state)
        console.log("handleColdReturnPressed: **********: ",this.state.returnAddress)
        let event = {
            target:{
                value:this.state.returnAddress
            }
        }

        this.props.returnAddressUpdate(event)
    }
  onSubmit(){

  }

  render () {
      console.log("this.props:***** ", this.props )
      const {
              theme, set_order_close_modal,
              baseWrapper
          } = this.props,
          {
              active_index, active_index_1, order_book
          } = this.state;

    return (





                    <div class="row center">
                        <div class="col-xs-6 center">

                            <h3> Order Details </h3>

                            <p></p>
                            <Table className='border-bottom table-night'>
                                <thead>
                                <tr>
                                    {/*<th><span className='it-dashed'>orderId</span></th>*/}
                                    {/*<th>market</th>*/}
                                    {/*<th><span className='it-dashed'>price</span></th>*/}
                                    {/*<th><span className='it-dashed'>quantity</span></th>*/}
                                    {/*<th><span className='it-dashed'>type</span></th>*/}
                                </tr>
                                </thead>
                                <tbody>
                                {

                                    this.state.orderParams.map(param => (
                                        <tr>
                                            <td>
                                                <span className='it-fs16 ml-3 it-medium'>{param}:   {this.state.orderInfo[param]} </span>
                                            </td>


                                        </tr>
                                    ))
                                }
                                </tbody>
                            </Table>


                            <p></p>


                            <div class="col-xs-6 center">



                                <form>

                                    <h4>Withdrawl address</h4>
                                    <input
                                        placeholder="Withdrawal Address"
                                        value={this.props.withdrawalAddress}
                                        onChange={this.props.withdrawalAddressUpdate}
                                    />
                                    <img src={walletIcon} width='40' height='40' onClick={this.handleColdWithdrawalPressed}/> (Send to cold)
                                    <p></p>
                                    <h4>Return address</h4>
                                    <input
                                        placeholder="Return Address"
                                        value={this.props.returnAddress}
                                        onChange={this.props.returnAddressUpdate}
                                    />
                                    <img src={walletIcon} width='40' height='40' onClick={this.handleColdReturnPressed}/> (return to cold)
                                </form>

                            </div>
                            <p></p>

                        </div>



                    </div>
    )
  }
}

