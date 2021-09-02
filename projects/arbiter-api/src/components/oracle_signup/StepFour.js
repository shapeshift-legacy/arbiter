'use strict'
import React from 'react'

export class StepFour extends React.Component {
  constructor () {
    super()
    this.state = { 
      checked: '' 
    }
    this.handleCheckedChanged = this.handleCheckedChanged.bind(this);
  }

  handleCheckedChanged (event) {
    this.setState({checked: event.target.checked})
  }

  render () {
    return (
      <div>
        <div className='row'>

          <h3>Methods of deployment</h3>
          <br></br>
          <br></br>
          <br></br>
          <br></br>
          <div>
          <oi>
            <li>npm: https://www.npmjs.com/package/oracle</li>
            <li>docker: https://hub.docker.com/_/redis/</li>
              <li>heroku:               <a href="https://heroku.com/deploy">
                  <img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy"></img>
            </a></li>
          </oi>
          </div>
        </div>
      </div>
    )
  }
}
