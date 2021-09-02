

/*
 Since there are different user types, configs requires an order of precedence
 1st: setupConfig,
 2nd: environment,
 3rd: hard-coded URLs
*/

let config = {

    MONGO: {
        HOSTS: [{
            ip: process.env['MONGO_IP'] || '127.0.0.1',
            port: process.env['MONGO_PORT'] || 27017
            // }, {
            //     ip: '127.0.0.1',
            //     port: 27017
        }],
        DB: process.env['MONGO_DB_NAME'] || 'arbiter-mongo',
        OPTIONS: {
            // abc: 123,
            // replicaSet: 'rs01'
        }
    },

}

module.exports = config
