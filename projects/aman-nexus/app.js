/*

        Aman-nexus


        Goals:
            * Full coin infrastructure test mock
            * Gateway between middle earth and aman RPC, mixing of coins
            * audibility
 */
require('dotenv').config();
const log = require('@arbiter/dumb-lumberjack')
const TAG = " | app | "


const nexus = require("./modules/nexus-wallet.js")
nexus.initialize()



