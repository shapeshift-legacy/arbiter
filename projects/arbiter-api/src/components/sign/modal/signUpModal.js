import React, { Component } from 'react';
import { FormGroup, Input, Label, Button } from 'reactstrap';
import {connect} from "react-redux";
import {push} from "react-router-redux";
import URLS from '../../../constants/urls'
import BaseSingModal from './baseSingModel'
import {switchSingUPModal, switchSingINModal} from '../../../actions/modals'
import {signIN} from '../../../actions/index'
import querystring from "query-string";
import cookies from 'js-cookie';
import TransportU2F from "@ledgerhq/hw-transport-u2f";
import Btc from "@ledgerhq/hw-app-btc";
import bip39 from 'bip39'
import {CopyToClipboard} from 'react-copy-to-clipboard';
import HDKey from 'hdkey'
import CoinKey from 'coinkey'
import ethUtils from 'ethereumjs-util'
import bitcoinMessage from 'bitcoinjs-message'
import bitcoin from 'bitcoinjs-lib'
import arbClient from '@arbiter/arb-api-client'

//import { API_HOST } from '../../../config'
import axios from 'axios'
import coininfo from 'coininfo'
//images
import ledgerConnect from '../../../assets/ledgerConnect.png'
//modules
import walletFactory from '../../../modules/wallet'
console.log("**************** walletFactory: ",walletFactory)

const networks = bitcoin.networks
//if(IS_TESTNET === 'false') IS_TESTNET = false

class SingUpModal extends Component {
    constructor() {
        super();
        this.state = {
            ledgerStatus:"not set",
            account: "not connected",
            baererFound: "",
            balanceBTC: "",
            token: "",
            loggedIn: "",
            value: '',
            copied: false,
        };
    }

    _loginWithShapeshift() {
        let params = {
            client_id: process.env.REACT_APP_OAUTH_CLIENT_ID,
            redirect_uri: window.location.origin+"/oauth",
            scope: "users:read",
            response_type: "code"
        }

        let qs = querystring.stringify(params)
        let url = process.env.REACT_APP_OAUTH_ROOT+"/oauth/authorize?"+qs

        window.location = url
    }

    async componentDidMount(){

        let user = cookies.get('fox_user')

        if ( user ) {
            //TODO get addys from ledger/keepkey!!
            localStorage.setItem('coldBTC',"mrPtLrXqhYX9Len1xjcDrUDRhCUfVa9dTb")
            localStorage.setItem('coldLTC',"QdZp27Tkaxds3hKT7u4TgGyER45Fu6YAkV")
            localStorage.setItem('coldETH',"0x33b35c665496bA8E71B22373843376740401F106")
            localStorage.setItem('coldGNT',"0x33b35c665496bA8E71B22373843376740401F106")

            let isSetup = localStorage.getItem('jointCustodySeed')
            console.log('isSetup: ',isSetup)

            if(isSetup){
                console.log("isSetup is found~! seed found!")
                console.log("CONFIG: ",process.env.REACT_APP_API_HOST)

                //TODO signin/signup

                let accountSigning = localStorage.getItem('signingAddress')
                let accountPriv = localStorage.getItem('signingPriv')
                let ethAddress = localStorage.getItem('ethAddress')

                // arbClient.init(process.env.REACT_APP_API_HOSTHOST,accountSigning,accountPriv)
                // let signUpSuccess2 = await onSignUpWithArbiter(accountSigning,ethAddress,localStorage.getItem('signingPriv'))
                // console.log('signUpSuccess: ',signUpSuccess2)

                //get balance

                arbClient.init(process.env.REACT_APP_API_HOST,accountSigning,accountPriv)

                try{
                    let accountInfo = await arbClient.getInfo()
                    accountInfo = accountInfo.payload
                    //display balances
                    this.setState({
                        balanceBTC:accountInfo.balances.BTC
                    })

                    console.log("********** accountInfo: ",accountInfo)
                }catch(e){
                    console.error("ERRROR:    ",e)
                    console.error("ERRROR:    ",e.message)
                }



            } else {
                //signIN()
                console.log("No ledger found building wallet")
                console.log("CONFIG: ",process.env.REACT_APP_API_HOST)

                // let wallet = await onBuildWallet()
                // console.log("Built wallet",wallet)

                let seed = await walletFactory.onGetNewSeed()
                console.log("Built seed",seed)

                let wallet = await walletFactory.onBuildWallet(seed.seed)
                console.log("Built wallet",wallet)

                if(wallet && wallet.seed){
                    arbClient.init(process.env.REACT_APP_API_HOST,wallet.account,wallet.signingPriv)
                    let signUpSuccess = await arbClient.signUp(wallet.pubkeyEth)
                    console.log("signUpSuccess",signUpSuccess)

                    this.setState({
                        value:seed.seed
                    })

                    localStorage.setItem('jointCustodySeed',wallet.seed)
                    localStorage.setItem('JCxpub',wallet.xpub)
                    localStorage.setItem('JCxpriv',wallet.privkey)
                    localStorage.setItem('signingAddress',wallet.signingPub)
                    localStorage.setItem('signingPriv',wallet.signingPriv)
                    localStorage.setItem('ethAddress',wallet.pubkeyEth)

                } else {
                    console.error("FAILED TO BUIDL WALLET! infoz: ")
                    console.error("seedz: ",seed)
                    console.error("seedz: ",seed.seed)
                    console.error("wallet: ",wallet)
                }




            }



            //if(accountAddress && accountAddress.bitcoinAddress)this.setState({account:accountAddress.bitcoinAddress})

            //POST getinfo
            //if info found, loggedin
            //if no info (not approved beta access)
            //if app not found signing with shapeshift
            //on success close window!
        } else {
            console.log("FAILED TO GET USER INFO")
        }

    }

    render() {

        const {push, singup, switchSingUPModal, switchSingINModal, singin,signIN} = this.props;

        let user = cookies.get('fox_user')
        let isSetup = localStorage.getItem('jointCustodySeed')

        if ( user ) {
            //set state loggedin

            // prompt do you have a ledger?
            if (isSetup){
                //onSignUpWithArbiter(isSetup)


                return(
                    <BaseSingModal
                        isOpen={singup}
                        toggle={() => switchSingUPModal(false)}
                    >
                    <div className='text-center'>
                        <h2> Welcome back! </h2>
                        {/*Balances:*/}
                            {/*BTC: {this.state.balanceBTC}*/}
                        <Button color="primary" size="lg" block className='mt-4' onClick={() => {
                            switchSingUPModal(false);
                            signIN()
                        }}>
                            Continue to site
                        </Button>

                    </div>
                    </BaseSingModal>
                )

            }else{
                return(
                    <BaseSingModal
                        isOpen={singup}
                        toggle={() => switchSingUPModal(false)}
                    >
                        <h2>Welcome to <br></br>NOT-A-UI</h2>

                        {/*If you have a ledger please connect it now!*/}

                        {/*<img src={ledgerConnect} alt="connect ledger" width="50" height="50"></img>*/}

                        {/*If you do not have a ledger you can use this generated seed*/}

                        {/*<br></br>*/}
                        {/*<br></br>*/}
                        {/*<h3> Your Arbiter Wallet </h3>*/}
                        {/*<br></br>*/}
                        {/*<div>*/}
                        {/*<textarea value={this.state.value}*/}
                                  {/*onChange={({target: {value}}) => this.setState({value, copied: false})} rows="5" cols="30"/>*/}

                            {/*<CopyToClipboard text={this.state.value}*/}
                                             {/*onCopy={() => this.setState({copied: true})}>*/}
                                {/*<span></span>*/}
                            {/*</CopyToClipboard>*/}

                            {/*<CopyToClipboard text={this.state.value}*/}
                                             {/*onCopy={() => this.setState({copied: true})}>*/}
                                {/*<button>Copy to clipboard!</button>*/}
                            {/*</CopyToClipboard>*/}

                            {/*{this.state.copied ? <span style={{color: 'red'}}>Copied.</span> : null}*/}
                        {/*</div>*/}
                        {/*<br></br>*/}
                        {/*<br></br>*/}
                        {/*Please save this backup seed for account recovery*/}

                        Your Account has been created.

                        <p></p>

                        <div className='text-center'>

                            <Button color="primary" size="lg" block className='mt-4' onClick={() => {
                                switchSingUPModal(false);
                                signIN()
                            }}>
                                Continue to site
                            </Button>

                        </div>
                    </BaseSingModal>
                )
            }





            //detect ledger
            // return (
            //     <BaseSingModal
            //         isOpen={singup}
            //         toggle={() => switchSingUPModal(false)}
            //     >
            //         <div className='text-center'>
            //             <strong className='it-fs24 it-fw6'>
            //                 Pair your Ledger device!
            //             </strong>
            //
            //             status:{this.state.ledgerStatus}
            //             account:{this.state.account}
            //         </div>
            //     </BaseSingModal>
            // )

        }else{
            return (
                <BaseSingModal
                    isOpen={singup}
                    toggle={() => switchSingUPModal(false)}
                >
                    <div className='text-center'>
                        <strong className='it-fs24 it-fw6'>
                            Create an account
                        </strong>

                        <div className="login">
                            <a href="#"
                               onClick={this._loginWithShapeshift.bind(this)}>
                                <img className="fox-img" src="https://auth.shapeshift.io/public/images/sign-in-with-shapeshift-blue@1x.png" alt="" />
                            </a>
                        </div>
                    </div>
                </BaseSingModal>
            )
        }


    }
}

const mapStateToProps = state => {
    return {
        singup: state.modals.singup
    }
};

const mapDispatchToProps = dispatch => {
    return {
        push: url => dispatch(push(url)),
        switchSingUPModal: state => dispatch(switchSingUPModal(state)),
        switchSingINModal: state => dispatch(switchSingINModal(state)),
        signIN: () => dispatch(signIN())
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(SingUpModal);
