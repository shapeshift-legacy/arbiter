/*

    Tools:

        * Get balance object
        * Get addresses
        * Send/Withdrawal moniez


 */
require('dotenv').config();
let app = require("./modules/admin.js")

const vorpal = require('vorpal')();
const TAG = " | cli - 2 | "
const prompt = "liquidity-cli:"
const cliCommands = map_module(app)

let help = {
    coinsBalances: {
        text: "get balances of all coins: (no params)"
    },
    orders: {
        text: "get orders of an account: (account)"
    },
    users: {
        text: "get all users: (no params)",
    }
}

