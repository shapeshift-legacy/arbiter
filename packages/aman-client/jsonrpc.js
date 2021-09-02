const http = require('http')
const https = require('https')

let TAG = ' | @arbiter/aman-client | '

const Client = function (opts) {
    this.opts = opts || {}
    this.http = this.opts.ssl ? https : http
}

/*
    OMG this code is so ugly
      please for the love of god some one rewrite this
                     - highlander
                        (no I did not write this)...all
 */

Client.prototype.call = function (method, params, callback, errback, path) {
    let tag = TAG + ' | jsonrpc | '
    let debug = false
    const time = Date.now()
    let requestJSON

    if (Array.isArray(method)) {
    // multiple rpc batch call
        requestJSON = []
        method.forEach(function (batchCall, i) {
            requestJSON.push({
                id: time + '-' + i,
                method: batchCall.method,
                params: batchCall.params
            })
        })
    } else {
    // single rpc call
        requestJSON = {
            id: time,
            method: method,
            params: params
        }
    }

    // First we encode the request into JSON
    requestJSON = JSON.stringify(requestJSON)

    // prepare request options
    const requestOptions = {
        host: this.opts.host || 'localhost',
        port: this.opts.port || 8332,
        method: 'POST',
        path: path || '/',
        headers: {
            'Host': this.opts.host || 'localhost',
            'Content-Length': requestJSON.length
        },
        agent: false,
        rejectUnauthorized: this.opts.ssl && this.opts.sslStrict !== false
    }

    if (this.opts.ssl && this.opts.sslCa) {
        requestOptions.ca = this.opts.sslCa
    }

    // use HTTP auth if user and password set
    if (this.opts.user && this.opts.pass) {
        requestOptions.auth = this.opts.user + ':' + this.opts.pass
    }

    // Now we'll make a request to the server
    let cbCalled = false
    const request = this.http.request(requestOptions)

    // start request timeout timer
    const reqTimeout = setTimeout(function () {
        if (cbCalled) return
        cbCalled = true
        request.abort()
        const err = new Error('ETIMEDOUT')
        err.code = 'ETIMEDOUT'
        errback(err)
    }, this.opts.timeout || 3000000)

    // set additional timeout on socket in case of remote freeze after sending headers
    request.setTimeout(this.opts.timeout || 3000000, function () {
        if (cbCalled) return
        cbCalled = true
        request.abort()
        const err = new Error('ESOCKETTIMEDOUT')
        err.code = 'ESOCKETTIMEDOUT'
        errback(err)
    })

    request.on('error', function (err) {
        if (cbCalled) return
        cbCalled = true
        clearTimeout(reqTimeout)
        errback(err)
    })

    request.on('response', function (response) {
        clearTimeout(reqTimeout)
        // console.log(tag,response)
        // We need to buffer the response chunks in a nonblocking way.
        let buffer = ''
        response.on('data', function (chunk) {
            buffer = buffer + chunk
        })
        // When all the responses are finished, we decode the JSON and
        // depending on whether it's got a result or an error, we call
        // emitSuccess or emitError on the promise.
        response.on('end', function () {
            let err

            if (cbCalled) return
            cbCalled = true

            let decoded
            try {
                decoded = JSON.parse(buffer)
            } catch (e) {
                if(debug) console.error(tag, 'Error, non JSON response! headers: ', response.headers)
                if(debug) console.error(tag, 'Error, non JSON response! statusMessage:', response.statusMessage)
                if (response.statusCode !== 200) {
                    err = new Error('Invalid params, response status code: ' + response.statusCode)
                    err.code = -32602
                    errback(err)
                } else {
                    err = new Error('Problem parsing JSON response from server')
                    err.code = -32603
                    errback(err)
                }
                return
            }
            if (debug) console.log(tag, 'decoded: ', decoded)

            if (!Array.isArray(decoded)) {
                decoded = [decoded]
            }

            // iterate over each response, normally there will be just one
            // unless a batch rpc call response is being processed

            // omg wtf is this crap
            decoded.forEach(function (decodedResponse, i) {
                if (decodedResponse.hasOwnProperty('error') && decodedResponse.error != null) {
                    /*
              -26 is error (insuffiecient stack size) is NORMAL for a partial multisig sign
                  - Yes you read that right, bitcoin core does NOT support multi-sig without throwing superfluous error
          */
                    if (errback && decodedResponse && decodedResponse.error && decodedResponse.error.code !== -26) {
                        if (debug) console.log(tag, '*********** ', decodedResponse.error.code)
                        if (debug) console.log(tag, '*********** ', typeof (decodedResponse.error.code))

                        // handle aman
                        if (decodedResponse.error.code) {
                            err = new Error(decodedResponse.error.message || '')
                            if (decodedResponse.error.code) {
                                err.code = decodedResponse.error.code
                            }
                            if (err.code != 16) errback(err)
                        } else {
                            err = decodedResponse.error || ' no error passed '
                            if (err.code != 16) errback(err)
                        }
                        // handle bitcoin
                    }
                } else if (decodedResponse.hasOwnProperty('result')) {
                    if(debug) console.error(tag, ' decodedResponse: ', decodedResponse)
                    if (callback) {
                        callback(decodedResponse.result, decodedResponse.error)
                    }
                } else {
                    if (errback) {
                        if(debug) console.error(tag, ' decodedResponse: ', decodedResponse)
                        err = new Error(decodedResponse.error.message || '')
                        if (decodedResponse.error.code) {
                            err.code = decodedResponse.error.code
                        }
                        errback(err)
                    }
                }
            })
        })
    })
    request.end(requestJSON)
}

module.exports.Client = Client
