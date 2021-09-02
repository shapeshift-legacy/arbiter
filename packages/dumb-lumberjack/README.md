
# Dumb Lumberjack

A simple logger for nodejs. Adds colorization, code location, and timestamps.
Configurable by module name using environment variables.

```
const log = require('@arbiter/dumb-lumberjack')()

log.debug('debug')
log.info('info')
log.verbose('verbose')
log.notice('notice')
log.warn('warn')
log.error('error')
log.crit('crit')
log.alert('alert')
log.emerg('emerg')
```

yields:

![basic usage](docs/img/logger.png?raw=true "Basic Usage")

Works the same way you'd expect console.log, pass in as many args as you want

```
log.info([1, 2, "three"], "string", { my: "object" })
```

![logging objects](docs/img/obj.png?raw=true "Logging objects")

## Log Levels

```
EMERG:   0
ALERT:   1
CRIT:    2
ERROR:   3
WARN:    4
NOTICE:  5
VERBOSE: 6
INFO:    6  // intentional, verbose and info are aliases of each other
DEBUG:   7
```

## Configuration

Logger user environment variables to determine the log levels. By default, the
log level is set to 'INFO'.

```
$ export LOG_LEVEL_MYMODULE=WARN
$ export DEFAULT_LOG_LEVEL=INFO
```

Environment variables are prefixed with LOG_LEVEL_ and then an uppercase and
underscored tag. So to set log level of DEBUG for ./any/path/my-module.js.asdfljk
(extensions are ignored), you would do:

```
$ export LOG_LEVEL_MY_MODULE=DEBUG
```
