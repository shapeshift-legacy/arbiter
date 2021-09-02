import {SIGNIN, SIGNOUT} from '../constants/actions'


export const signIN = () => {
    return (distpath, getState) => {
        distpath({type: SIGNIN})
    }
};

export const signOUT = () => {
    return (dispatch, getState) => {
        dispatch({type: SIGNOUT})
    }
};