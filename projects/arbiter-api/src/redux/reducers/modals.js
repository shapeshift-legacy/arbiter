import {
    SET_ORDER_CLOSE_MODAL, SWITCH_SIGNIN_MODAL, SWITCH_SINGUP_MODAL, SWITCH_RESET_PASSWORD_MODAL
} from '../../constants/actions'

const initialState = {
    order_close: false,
    singin: false,
    singup: true,
    reset_password: false
};


const state = (state=initialState, action) => {
    switch (action.type) {
        case SET_ORDER_CLOSE_MODAL:
            return {
                ...state,
                order_close: action.modal,
                price:action.price,
                amount:action.amount,
                orderType:action.orderType,
                market:action.market
            };
        case SWITCH_SIGNIN_MODAL:
            return {
                ...state,
                singin: action.singin
            };
        case SWITCH_SINGUP_MODAL:
            return {
                ...state,
                singup: action.singup
            };
        case SWITCH_RESET_PASSWORD_MODAL:
            return {
                ...state,
                reset_password: action.reset_password
            };
        default:
            return state
    }
};

export default state