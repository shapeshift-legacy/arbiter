import React, { Component } from 'react';


export default class BaseSing extends Component {

    render() {

        const {children} = this.props;

        return (
            <div className='it-container'>
                <div className='it-sign'>
                    <div className='text-center'>
                        <img src={require('../../assets/logo.png')}/>
                        <div className='text-primary it-fs24'>
                            NOT A UI
                        </div>
                        <div className='block'>
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}