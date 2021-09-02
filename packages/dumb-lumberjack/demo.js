
const log = new require('./index')()

log.debug('debug')
log.info('info')
log.verbose('verbose')
log.notice('notice')
log.warn('warn')
log.error('error')
log.crit('crit')
log.alert('alert')
log.emerg('emerg')


log.info([1, 2, "three"], "string", { my: "object" })