/**
 * Serves as a global startup run before entire mocha test suite
 */
before(function ()
{
    const Redis = require('promise-redis')()
    global.redis = Redis.createClient({
        host: redisTestHost,
        port: redisTestPort,
        retry_strategy: function retry(options)
        {
            if (options.error.code === 'ECONNREFUSED')
            {
                //console.log('connection refused');
            }
            if (options.total_retry_time > 1000 * 60 * 60)
            {
                return new Error('Retry time exhausted');
            }

            return Math.max(options.attempt * 100, 15000);
        }
    })
})

/**
 * Serves as a global teardown run after entire mocha test suite
 */
after(function ()
{
    redisServerChildProcess.kill()
})