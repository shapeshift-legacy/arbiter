/*
 Common logic pulled into every mocha test
 */

'use strict';

const util = require('util')
const exec = require('child_process').exec
const os = require('os')
const mkdirp = require('mkdirp')

//global.redisTestPort = 6300
global.redisTestPort = 6379
global.redisTestDir = `${os.homedir()}/redis-test-data`
global.redisTestHost = '127.0.0.1'

global.chai = require('chai')
global.chai.should()

global.expect = global.chai.expect
global.sinon = require('sinon')

global.sinonChai = require('sinon-chai')
global.chai.use(global.sinonChai)
global.chai.use(require('chai-as-promised'))

// global.async = require('asyncawait/async')
// global.await = require('asyncawait/await')

process.env.IS_TEST = true

mkdirp(redisTestDir, function (err)
{
    if (err) throw new Error(err)

    global.redisServerChildProcess = exec(`redis-server --port ${redisTestPort} --dir ${redisTestDir}`, function (error, stdout, stderr) {
        if (error) return
        console.log(stdout)
    })
})