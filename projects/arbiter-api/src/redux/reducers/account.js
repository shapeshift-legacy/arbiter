import {SIGNIN, SIGNOUT} from '../../constants/actions'


let initState = null;

if (process.env.NODE_ENV === 'development') {
    initState = {};
}

const state = (state = initState, action) => {
    switch (action.type) {
        case SIGNIN:
            return {};
        case SIGNOUT:
            return null;
        default:
            return state
    }
};

export default state