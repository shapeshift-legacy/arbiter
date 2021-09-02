require('dotenv').config();


/*
    Oracle API
 */
require('dotenv').config();
const TAG = " | LA API | "
const config = require("./configs/env")
const log = require('@arbiter/dumb-lumberjack')()
const _ = require('koa-route')
const serve = require('koa-static');
const IO = require('koa-socket-2');
const api = require("./routes/oracle.js")
const public = require("./routes/public.js")
const describe = require("@arbiter/arb-describe")
const signing = require("./modules/signing.js")
const util = require('@arbiter/arb-redis')
const redis = util.redis
const subscriber = util.subscriber
log.debug("api: ",api)
const map = describe.map(api)
log.debug("describe: ",map)
const fs = require('fs');
const Koa = require('koa');
const koaBody = require('koa-body');
const app = module.exports = new Koa();
const cors = require('@koa/cors');
const io = new IO();

//
//host reports
// let path = __dirname + '/reports'
// log.info(TAG,'report: path: ',path)
// app.use(serve(path));

app.use(cors());

app.use(koaBody({
    jsonLimit: '1000kb'
}));

//API TODO versioning
//let base = "/api/v1/"

//public api calls (all GET)
app.use( _.get('/api/v1/status/:orderId', async (ctx, orderId) => {
    try{
        //log.debug(ctx)
        log.debug(orderId)
        //log.debug(ctx.params)
        let payload = await public.status(orderId);
        //ctx.body = "foo"

        let signature = await signing.sign(config.ORACLE_SIGNING,payload)
        let account = config.ORACLE_SIGNING
        let output = {account,payload,signature}
        log.debug("output: ",output)
        ctx.body = output

    }catch(e){
        log.error(e)
        ctx.throw(500,"internal server error")
    }
}))



// koa-body accepts application/json
// and application/x-www-form-urlencoded
let paths = Object.keys(map)
for (let i = 0; i < paths.length; i++) {
    let path = paths[i]
    log.debug("path: ",path)

    app.use(_.post('/api/v1/'+path, async function(ctx) {
        log.debug(TAG,"incoming POST ctx: ",ctx)
        //log.debug(TAG,"incoming POST body: ",ctx.request)
        log.debug(TAG,"incoming POST body: ",ctx.request.body)
        let account = ctx.request.body.account
        let payload = ctx.request.body.payload
        let signature = ctx.request.body.signature

        //validate Auth
        if(!account || !payload || !signature){
            log.error(TAG,"path: ",path)
            throw Error("100: invalid AUTH protocol! malformed POST body.")
        }


        //validate sig
        //let isValid = await signing.validate(account,signature,payload)
        //TODO for the love of god come back and fix (testnet signing module bullshit :rabble:)
        let isValid = true
        if(!isValid) throw Error("101: invalid AUTH signature! signature does not validate!")

        let params = map[path]
        log.debug("params: ",params)
        let inputs = []
        inputs.push(account)
        for (let j = 0; j < params.length; j++) {
            if(params[j] != "account"){
                // if (!ctx.request.body.payload[params[j]]) ctx.throw(400, params[j]+' required');
                inputs.push(ctx.request.body.payload[params[j]])
            }
        }
        log.debug("inputs: ",inputs)
        try{
            let payload = await api[path].apply(this, inputs)
            let signature = await signing.sign(config.ORACLE_SIGNING,payload)
            //let signature = "fakesigbro" // TODO verify we checking this everywhere, then fix
            let account = config.ORACLE_SIGNING
            let output = {account,payload,signature}
            log.debug("output: ",output)
            ctx.body = output
            //ctx.body = JSON.stringify(output)
        }catch(e){
            console.error("e: ",e)
            let output = {success:false, error:e.toString()}
            ctx.body = output
        }
    }));
}


app.on('error', function(err, ctx) {
    log.error("error:", config.NODE_ENV, ctx.status, err)

    if (config.NODE_ENV !== 'production') {
      ctx.body = { error: err.message }
    }
})


//Socket.io ready
io.attach(app, true, {
    key: fs.readFileSync(config.LOCAL_SSL_KEY_PATH),
    cert: fs.readFileSync(config.LOCAL_SSL_CERT_PATH),
    //ca: fs.readFileSync(...)
});
console.log('Server: HTTPS/TLS Enabled.');


io.on('message', (ctx, data) => {
    console.log('client sent data to message endpoint', data);
});

io.on('connection', (client) => {
});

// io.on('submit', (ctx, data) => {
//     let tag = TAG + '|submit|'
//     log.info(`${tag}, ctx: ${ctx}, data: ${data}`)
// })


subscriber.subscribe('publishToFrontOracle')
// subscriber.subscribe('tradeAgent')

subscriber.on('message', async function (channel, payloadS) {
    let tag = TAG + ' | publishToFront | '
    try {
        let payload = JSON.parse(payloadS)
        log.debug(tag,"payload: ",payload)
        let event = payload.event
        log.debug(tag,"event: ",event)
        if(!event) throw Error("103: invalid event!!!")

        //types of events
        switch (event) {
            case 'accountUpdate':
                io.broadcast(payload.account, payload);
                break;

        }
    }catch(e){
        log.error(tag,e)
        throw e
    }
})


app.listen(config.ORACLE_PORT || 5555);
log.info("started API on port: ",config.ORACLE_PORT)


// if (!module.parent) app.listen(config.ORACLE_PORT);
// log.info("started API on port: ",config.ORACLE_PORT)
