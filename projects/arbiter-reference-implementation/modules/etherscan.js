/**
 * Created by highlander on 12/28/16.
 */

const when = require('when')
const request = require('request');









var post_request = function(url,body){
    var d = when.defer();
    var tag = " | buy_asset | "
    var options = { method: 'POST',
        url: url,
        headers:
        { 'content-type': 'application/x-www-form-urlencoded' },
        form:body
    };



    request(options, function (error, response, body) {
        if (error) {
            d.reject(error)
        };
        //console.log(body);
        d.resolve(body)
    });
    return d.promise
}