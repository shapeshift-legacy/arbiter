require('dotenv').config();


/*
    Liquidity agent API
 */
const TAG = " | LA API | "
const config = require("./configs/env")
const log = require('@arbiter/dumb-lumberjack')()
const _ = require('koa-route')
const serve = require('koa-static');
const cors = require('@koa/cors');

const api = require("./modules/liquidity.js")
const describe = require("./modules/describe.js")
const signing = require("./modules/signing.js")
log.debug("api: ",api)
const map = describe.map(api)
log.debug("describe: ",map)

const Koa = require('koa');
const koaBody = require('koa-body');
const app = module.exports = new Koa();

//host reports
let path = __dirname + '/reports'
log.info(TAG,'report: path: ',path)
app.use(serve(path));

app.use(cors());

app.use(koaBody({
    jsonLimit: '1000kb'
}));

app.use(async (ctx, next) => {
    log.debug(`Body: `, ctx.request.body)
    log.debug(`URL: `, ctx.url)
    log.debug(`method: `, ctx.method)
    return next()
})


// co-body accepts application/json
// and application/x-www-form-urlencoded
let paths = Object.keys(map)
for (let i = 0; i < paths.length; i++) {
    let path = paths[i]
    log.debug("path: ",path)
    app.use(_.post('/'+path, async function(ctx) {
        log.debug(TAG,"incoming POST body: ",ctx.request.body)
        let account = ctx.request.body.account
        let payload = ctx.request.body.payload
        let signature = ctx.request.body.signature

        //validate Auth
        if(!account || !payload || !signature)
            throw Error("100: invalid AUTH protocol! malformed POST body.")

        //validate sig
        let isValid = await signing.validate(account,signature,payload)
        if(!isValid) throw Error("101: invalid AUTH signature! signature does not validate!")

        let params = map[path]
        log.debug("params: ",params)
        let inputs = []
        inputs.push(account)
        for (let j = 0; j < params.length; j++) {
            if(params[j] != "account"){
                if (!ctx.request.body.payload[params[j]]) ctx.throw(400, params[j]+' required');
                inputs.push(ctx.request.body.payload[params[j]])
            }
        }
        log.debug("inputs: ",inputs)
        try{
            let payload = await api[path].apply(this, inputs)
            let signature = await signing.sign(config.ARBITER_SIGNING,payload)
            let account = config.ARBITER_SIGNING
            let output = {account,payload,signature}
            log.debug("output: ",output)
            ctx.body = JSON.stringify(output)
        }catch(e){
            console.error("e: ",e)
            let output = {success:false, error:e.toString()}
            ctx.body = output
        }
    }));
}



if (!module.parent) app.listen(config.PORT_CORE);
log.info("started API on port: ",config.PORT_CORE)
