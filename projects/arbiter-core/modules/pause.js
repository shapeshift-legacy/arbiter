const log = require('@arbiter/dumb-lumberjack')()

const pause = function(seconds) {
    //log.debug(`pausing ${seconds} seconds`)
    return new Promise((resolve, reject) => {
        setTimeout(resolve, seconds*1000)
    })
}

module.exports = pause
