import React, { Component } from 'react';
import { Row, Col, Button, Input, FormGroup, Label} from 'reactstrap';
import FontAwesome from 'react-fontawesome'
import QRCode from 'qrcode.react'



const accountTab = () => {

    return (
        <Row>
            <Col className='col-9 account'>
                <strong className='it-fs28'>Account</strong>
                <div>
                    <br></br>Email: {this.state.email}
                    <br></br>Signing: {this.state.signingAddress}
                </div>
            </Col>
            <Col className='col-3 text-center avatar'>
                {/*<img src={account.icon} className='rounded-circle' height="60" width="60"/>*/}
                <QRCode value={"bitcoin:"+this.state.signingAddress} />
                <Button color='light' className='border it-fs14 mt-4' block>
                    <strong>Edit avatar</strong>
                </Button>
                <div className='mt-4 it-fs14 text-danger it-pointer'>
                    <FontAwesome name='ban' /> <span>Delete account</span>
                </div>
            </Col>
        </Row>
    )
};

export default accountTab