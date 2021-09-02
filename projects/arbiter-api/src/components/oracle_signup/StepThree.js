'use strict'
import React from 'react'
import QRCode from 'qrcode.react'
import URLS from "../../constants/urls";

export class StepThree extends React.Component {
  constructor () {
    super()
    this.state = { 
      password: '', 
      passwordConfirm: '' 
    }
    this.handlePasswordChanged = this.handlePasswordChanged.bind(this);
    this.handlePasswordConfirmChanged = this.handlePasswordConfirmChanged.bind(this);
  }

  handlePasswordChanged (event) {
    this.setState({password: event.target.value})
  }

  handlePasswordConfirmChanged (event) {
    this.setState({passwordConfirm: event.target.value})
  }

  render () {
    return (
      <div>

          <QRCode value="bitcoin:12A1MyfXbW6RhdRAZEqofac5jCQQjwEPBu?amount=1.2" />

          Address: (bitcoin) 12A1MyfXbW6RhdRAZEqofac5jCQQjwEPBu
          amount = 0.2 (200 USD)
          <br></br>
          <div className='row'>
          <div className='six columns'>
            <label>Password</label>
            <input
              className='u-full-width required'
              placeholder='Password'
              type='password'
              onChange={this.handlePasswordChanged}
              value={this.state.password}
              autoFocus
            />
          </div>
        </div>
        <div className='row'>
          <div className='six columns'>
            <label>Confirm password</label>
            <input
              className='u-full-width'
              placeholder='Confirm Password'
              type='password'
              onChange={this.handlePasswordConfirmChanged}
              value={this.state.passwordConfirm}
            />
          </div>
        </div>
      </div>
    )
  }
}
