// const functions = {
//     Client: jest.fn(),
//     getBalance: jest.fn().mockImplementation(() => 10)
// }
//
// module.exports = {
//     Client: functions
//
// }

// export const getbalance = jest.fn();
// const mock = jest.fn().mockImplementation(() => {
//     return {getbalance: getbalance};
// });
//
// export default mock;


class Client {
    constructor () { jest.fn() }
    getBalance () { jest.fn().mockImplementationOnce(() => 10) }
}

module.exports = Client