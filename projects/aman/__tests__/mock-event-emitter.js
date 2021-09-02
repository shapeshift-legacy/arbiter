const log = require('@arbiter/dumb-lumberjack')()

module.exports = class EventEmitter {
  constructor() {
    this.events = {}
  }

  on(ev, cb) {
    log.debug(`registering`, ev)
    this.events[ev] = cb
    return this
  }

  emit() {
    log.debug(`emitting`, arguments)
    let args = Array.prototype.slice.call(arguments)
    let ev = args.splice(0, 1)
    this.events[ev].apply(null, args)
  }

  catch() {}
}
