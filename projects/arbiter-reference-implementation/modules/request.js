const request = require('request')
const log = require('@arbiter/dumb-lumberjack')()


process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var get_request = function(url){
  return new Promise((resolve, reject) => {
    request(url, function (error, response, body) {
        log.debug(`url`, error, body)
        if (error) {
            reject(error)
        } else {
          if ( typeof body === "string" ) {
            try {
              body = JSON.parse(body)
            } catch (ex) {}
          }
          resolve(body)
        }
    })
  })
}

var post_request = function(url, body, method) {
  return new Promise((resolve, reject) => {
    var options = {
        method: method || 'POST',
        url: url,
        headers:
        { 'content-type': 'application/json' },
        body: JSON.stringify(body)
    };

    request(options, function (error, response, body) {
      log.debug(`post_request`, error, body)
      if (error || ( response && response.statusCode !== 200 )) {
        reject(error || body)
      } else {
        if ( typeof body === "string" ) {
          try {
            body = JSON.parse(body)
          } catch (ex) {}
        }

        resolve(body)
      }
    })
  })
}

module.exports = { post_request, get_request }
