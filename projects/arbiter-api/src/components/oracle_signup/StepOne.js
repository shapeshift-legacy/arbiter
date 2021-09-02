'use strict'
import React from 'react'

export class StepOne extends React.Component {
  constructor () {
    super()
    this.state = { 
      firstName: '', 
      lastName: '',
      serverName:'',
      serverBio:'',
    }
    this.handleServerNameChanged = this.handleServerNameChanged.bind(this);
    this.handleFirstNameChanged = this.handleFirstNameChanged.bind(this);
    this.handleLastNameChanged = this.handleLastNameChanged.bind(this);
  }

  handleServerNameChanged (event) {
      this.setState({serverName: event.target.value})
  }

    handleServerBioChanged (event) {
        this.setState({serverName: event.target.value})
    }

  handleFirstNameChanged (event) {
    this.setState({firstName: event.target.value})
  }

  handleLastNameChanged (event) {
    this.setState({lastName: event.target.value})
  }

  render () {
    return (
        <div>
            <div className='row'>

                <h3>an “Oracle” is some one who will</h3>
                <ol>
                    <li>run a full node (in every coin they support!)</li>
                    <li>lock funds in “escrow”</li>
                    <li>Arbitrate settlement of order fullfillment</li>
                    <li>get paid a small percentage of all executed orders.</li>
                </ol>

                <div className='ten columns terms'>
                    <span>By clicking "Accept" I agree that:</span>
                    <ul className='docs-terms'>
                        <li>
                            I have read and accepted the <a href='#'>User Agreement</a>
                        </li>
                        <li>
                            I have read and accepted the <a href='#'>Privacy Policy</a>
                        </li>
                        <li>I am at least 18 years old</li>
                    </ul>
                    <label>
                        <input
                            type='checkbox'
                            //   defaultChecked={this.state.checked}
                            checked={this.state.checked}
                            onChange={this.handleCheckedChanged}
                            autoFocus
                        />
                        <span> Accept </span>{' '}
                    </label>
                    <br></br>
                </div>
            </div>
        </div>
    )
  }
}
