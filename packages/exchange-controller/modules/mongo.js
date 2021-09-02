let TAG = " | mongo | "
const monk = require('monk')
const config = require("../configs/env")
const log = require('@arbiter/dumb-lumberjack')()


const hosts =  config.MONGO.HOSTS
const db = config.MONGO.DB
const options = config.MONGO.OPTIONS

function _buildConnectionString(hosts, db) {
    if (process.env.MONGO_URI) return process.env.MONGO_URI;

    if ( !hosts && hosts.length > 0 ) {
        throw new Error('No mongo hosts configured! See configs/example_dbConfig.js')
    }

    let str = hosts.map(host => host.ip + ':' + host.port).join(',')
    str += '/' + ( db || "" )

    return str
}

const connectionString = _buildConnectionString(hosts, db)

const connection = monk(connectionString, options, err => {
    if (err) {
        console.error(TAG,`Error connecting to mongo!`, err)
        throw new Error(err)
    } else {
        log.info(TAG,`Successfully connected to mongo`)
    }
})

//collections
let trades = connection.get('trade-history')
let transfers = connection.get('transfers')
let balances = connection.get('balances')
let credits = connection.get('credits')
let debits = connection.get('debits')
let txs = connection.get('txs')
let reportLA = connection.get('LA-report')



module.exports = exports = {reportLA,credits,debits,trades,transfers,txs,balances}
