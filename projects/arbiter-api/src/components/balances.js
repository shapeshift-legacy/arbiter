import React, {Component} from 'react';
import {Provider} from 'react-redux'
import {ConnectedRouter} from 'react-router-redux'
import {Route} from 'react-router'
import {store, history} from '../redux/store'
import URLS from '../constants/urls'

import axios from 'axios'

class Balances extends Component {
  constructor(props) {
    super(props)

    this.state = { balances: {} }
  }

  componentWillMount() {
    console.log(`balances will mount`)
    axios.get('/api/v1/balances').then(res => {
      console.log(`res.data`, res.data)
      this.setState({ balances: res.data })
    }).catch(ex => { console.error(ex) })
  }

  render() {
    console.log(`balances render`)
    return <div>
      <h2>Balances</h2>
      <pre>
        {JSON.stringify(this.state.balances, false, ' ')}
      </pre>
    </div>
  }
}

export default Balances
