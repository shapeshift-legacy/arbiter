let TAG = " | mongo | "
const monk = require('monk')
const { hosts, db, options } = require('../configs/dbConfig').mongo

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
        console.log(TAG,`Successfully connected to mongo`)
    }
})

//collections
let match = connection.get('match-history')

module.exports = exports = {match}
