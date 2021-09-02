let TAG = " | mongo | "
const monk = require('monk')
const config = require("./env")
const log = require('@arbiter/dumb-lumberjack')()


const hosts =  config.MONGO.HOSTS
const db = config.MONGO.DB
const options = config.MONGO.OPTIONS

const schema = require('./schema.js')

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

let output = {}

let collections = schema.COLLECTIONS
for(let i = 0; i < collections.length;i++){
    let collection = collections[i]
    output[collection] = connection.get(collection)
}

//build indexs
let indexes = schema.INDEXES
let indexList = Object.keys(indexes)
for(let i = 0; i < indexList.length;i++){
    let collection = indexList[i]
    output[collection].createIndex({[indexes[collection]]: 1}, {unique: true})
}

module.exports = exports = output
