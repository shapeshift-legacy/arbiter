'use strict'
import React from 'react'

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

  handleEmailChanged (event) {
    this.setState({email: event.target.value})
  }

  handleEmailConfirmChanged (event) {
    this.setState({emailConfirm: event.target.value})
  }

  render () {
    return (
      <div>
        <div className='row'>



            <div className='six columns'>
                <label>Oracle domain name: </label>
                <input
                    className='u-full-width'
                    placeholder='https://myOracle.com'
                    type='text'
                    onChange={this.handleServerNameChanged}
                    value={this.state.serverName}
                    autoFocus
                />
            </div>
        </div>
        <div className='row'>
            <div className='six columns'>
                <label>Short Description</label>
                <input
                    className='u-full-width'
                    placeholder='This oracle will be run by X foundation, and maintained by x people...'
                    type='text'
                    onChange={this.handleLastNameChanged}
                    value={this.state.serverBio}
                />
            </div>
        </div>

        <div className='row'>
          <div className='six columns'>
            <label>Your email</label>
            <input
              className='u-full-width required'
              placeholder='test@mailbox.com'
              type='email'
              onChange={this.handleEmailChanged}
              value={this.state.email}
              autoFocus
            />
          </div>
        </div>
        <div className='row'>
          <div className='six columns'>
            <label>Confirm email</label>
            <input
              className='u-full-width'
              placeholder='Confirm email'
              type='email'
              onChange={this.handleEmailConfirmChanged}
              value={this.state.emailConfirm}
            />
          </div>
        </div>
      </div>
    )
  }
}
