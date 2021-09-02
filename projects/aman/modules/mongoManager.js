
const monk = require('monk')
const { hosts, db, options } = require('../config/dbConfig').mongo

function _buildConnectionString(hosts, db) {
  if (process.env.MONGO_URI) return process.env.MONGO_URI;

  if ( !hosts && hosts.length > 0 ) {
    throw new Error('No mongo hosts configured! See config/example_dbConfig.js')
  }
  
  let str = hosts.map(host => host.ip + ':' + host.port).join(',')
  str += '/' + ( db || "" )
  
  return str
}

const connectionString = _buildConnectionString(hosts, db)
 
const connection = monk(connectionString, options, err => {
  if (err) {
    console.error(`Error connecting to mongo!`, err)
    throw new Error(err)
  } else {
    console.log(`Successfully connected to mongo`)
  }
})
 
module.exports = exports = connection
