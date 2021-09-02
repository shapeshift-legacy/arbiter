

/*
 Since there are different user types, config requires an order of precedence
 1st: setupConfig,
 2nd: environment,
 3rd: hard-coded URLs
*/



let config = {
    //api settings
    ORACLE_IP        : process.env['ORACLE_IP']         || '127.0.0.1',
    ORACLE_PORT      : process.env['ORACLE_PORT']       || 5555,
    ORACLE_MASTER_ETH: process.env['ORACLE_MASTER_ETH'] || "",
    ORACLE_SIGNING   : process.env['ORACLE_SIGNING']    || "",

    //arbiter
    ARBITER_SIGNING   : process.env['ARBITER_SIGNING']    || "",
}

module.exports = config
