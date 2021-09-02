/*
        Export:

        notes:
           Expected to be required in mutltiple places!
           but on initialized in ONE!

        concerns, there are not global throttling on requests made. meaning rate limits are NOT enfoced


        Goals:

            Get rates and exchange info to all services that need it

 */


//TODO validate API key's
// throw if bad permissions

let app = require("./modules/liquidity.js")


module.exports = app


