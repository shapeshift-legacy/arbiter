import React, {Component} from 'react';
import { Provider } from 'react-redux'
import { ConnectedRouter } from 'react-router-redux'
import { Route } from 'react-router'
import { store, history } from '../redux/store'
import URLS from '../constants/urls'
//Views
import Balances from './balances'
import Wallet from './wallet'
import Wallets from './wallets'
import AddCurrency from './add_currency'
import Analytics from './analytics'
import Traders from './traders'
import Oracles from './oracles'
import Markets from './markets'
import Market from './market'
import Orders from './orders'
import Order from './order'
import OracleSignup from './oracle_signup'
import Oracle from './oracle'
import Trader from './trader'
import Post from './post'
import Messages from './messages'
import MarketsList from './marketsList/index'
import Account from './account/index'
import SingIn from './sign/singIn'
import SignUp from './sign/signUp'
import ResetPassword from './sign/resetPassword'


class Root extends Component {

    render() {

        return(
            <Provider store={store()}>
                <ConnectedRouter history={history}>
                    <div>
                        <Route exact path={URLS.Trading} component={MarketsList} />
                        <Route path={URLS.Markets} component={Markets} />
                        <Route path={URLS.Market} component={Market} />
                        <Route path={URLS.Wallet} component={Wallet} />
                        <Route path={URLS.Wallets} component={Wallets} />
                        <Route path={URLS.AddCurrency} component={AddCurrency} />
                        <Route path={URLS.Balances} component={Balances} />
                        <Route path={URLS.Traders} component={Traders} />
                        <Route path={URLS.Trader} component={Trader} />
                        <Route path={URLS.Oracle} component={Oracle} />
                        <Route path={URLS.Oracles} component={Oracles} />
                        <Route path={URLS.Order} component={Order} />
                        <Route path={URLS.Orders} component={Orders} />
                        <Route path={URLS.OracleSignup} component={OracleSignup} />
                        <Route path={URLS.Account} component={Account} />
                        <Route path={URLS.SIGNIN} component={SingIn} />
                        <Route path={URLS.SIGNUP} component={SignUp} />
                        <Route path={URLS.RESETPASSWORD} component={ResetPassword} />
                    </div>
                </ConnectedRouter>
            </Provider>
        )
    }
}

export default Root
