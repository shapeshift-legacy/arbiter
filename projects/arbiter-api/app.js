const TAG = " | arbiter-api (app.js) | "
require('dotenv').config();
const config = require("./configs/env")
const _ = require('koa-route')
const koaBody = require('koa-body')
const jwt     = require('koa-jwt')
const hbs     = require('koa-hbs-renderer')
const cors = require('@koa/cors');
const log = require('@arbiter/dumb-lumberjack')()
const router = require('./routes/router')
const accountInfo = require('./routes/accountInfo')
const serve = require('koa-static');
const send = require('koa-send');
const axios = require('axios')
const fs = require('fs');
const _path = require('path');
const https = require('https');
const http = require('http');
const filterObject = require('./modules/filter-object');
const util = require('@arbiter/arb-redis')
const redis = util.redis
const subscriber = util.subscriber
const IO = require('koa-socket-2');

//custody
const apiCustody = require("./modules/liquidity.js")
const describe = require("./modules/describe.js")
const signing = require("@arbiter/arb-signing")
log.debug("apiCustody: ",apiCustody)
const mapCustody = describe.map(apiCustody)
log.debug("describe: ",mapCustody)

//eventing routing
let socketRouter = require("./modules/sockets")

let admin  = require("./routes/admin.js")
let mapAdmin = admin.map
admin = admin.routes
log.debug("admin: ",admin)
log.debug("mapAdmin: ",mapAdmin)


let api  = require("./routes/api.js")
let map = api.map
api = api.routes
log.debug("api: ",api)
log.debug("map: ",map)

let auth = require("./routes/auth.js")

const Koa = require('koa');
const app = new Koa();
const io = new IO();


// middleware for template rendering via handlebars
// app.use(hbs({
//   paths: {
//     views: _path.join(__dirname, '/build')
//   }
// }))




app.use(koaBody({
    jsonLimit: '100kb'
}));

app.use(cors());
// const port = config.PORT

//debug

//public api
let pathsGET = Object.keys(map.get)
for (let i = 0; i < pathsGET.length; i++) {
    let path = pathsGET[i]
    log.debug("pathGET: ",path)
    let pathInfo = map.get[path]
    log.debug("pathInfo: ",pathInfo)
    if(pathInfo.length === 0){
        app.use( _.get('/api/v1/'+path, api[path]));
    }else{
        let routString = '/api/v1/'+path
        for (let j = 0; j < pathInfo.length; j++) {
            routString = routString +'/:'+pathInfo[j]
        }
        log.debug("routString: ",routString)
        app.use( _.get(routString, api[path]));
    }
}
//protected customers
let pathsPOST = Object.keys(map.post)
for (let i = 0; i < pathsPOST.length; i++) {
    let path = pathsPOST[i]
    log.debug("pathPOST: ",path)
    app.use( _.post('/api/v1/'+path, api[path]));
}

//custodial api
// co-body accepts application/json
// and application/x-www-form-urlencoded
let paths = Object.keys(mapCustody)
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
        log.debug("account: ",account)
        log.debug("signature: ",signature)
        log.debug("payload: ",payload)
        let isValid = await signing.validate(account,signature,payload)
        log.debug("isValid: ",isValid)
        if(!isValid) throw Error("101: invalid AUTH signature! signature does not validate!")

        let params = mapCustody[path]
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
            let payload = await apiCustody[path].apply(this, inputs)
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


// OAuth endpoints
/*
    Read access to all account info
    (account info)


    (custodial stuffs)
    getBalance
 */
app.use( _.get("/api/v1/user", async function(ctx) {
    let tag = TAG+ " | userInfo | "
    try{
        let authToken = ctx.body.headers.authorization
        if(!authToken) throw Error("101 Authorized endpoint! token not found.")
        authToken = authToken.replace("Bearer ","")
        log.debug(tag,"authToken: ",authToken)

        let tokenInfo = await redis.hgetall(authToken)
        if(!tokenInfo) throw Error("102: Bearer token expired! please sign in again!")

        //get userInfo
        let userInfo = await mongo['users'].find({})
        log.debug(TAG,"ctx: ",ctx)
        ctx.body = 'Hello World';
    }catch(e){
        ctx.body = 'error';
    }

}))

// app.use(async function(ctx, next) {
//     try {
//         await next();
//     } catch (err) {
//         if (err.status === 401) {
//             ctx.status = 401;
//             ctx.set('WWW-Authenticate', 'Basic');
//             ctx.body = 'cant haz that';
//         } else {
//             throw err;
//         }
//     }
// });

//app.use( _.get("api/v1/history", accountInfo.orderHistory));


//

// other combined routes
app.use(router)

//login
app.use(_.post('/users', auth.users));
app.use(_.post('/sessions/create', auth.createSession));


// Custom 401 handling if you don't want to expose koa-jwt errors to users
app.use(function(ctx, next){
    return next().catch((err) => {
        log.debug(`err`, err)
        if (401 === err.status) {
            ctx.status = 401;
            ctx.body = 'Protected resource, use Authorization header to get access\n';
        } else {
            throw err;
        }
    });
});

const CLIENT_CONFIG = filterObject(config, [
  'OAUTH_ROOT',
  'OAUTH_CLIENT_ID'
])

app.use(serve(_path.join(__dirname, '/build')))

app.use(_.get('*', async ctx => {
  // WARNING: pretty much everything hits this, so we only want to serve the index
  // if we're sure nothing else has responded. Hence the check for ctx.body
  log.debug(`wildcard`, ctx.path)
  if (!ctx.body) {
    return await send(ctx, 'index.html', { root: __dirname + '/build' });
  }
}))


app.on('error', function(err, ctx) {
    log.error("error:", config.NODE_ENV, ctx.status, err)

    if (config.NODE_ENV !== 'production') {
      ctx.body = { error: err.message }
    }
})

//NERFED
// why? never http (breaks ledger)
// was nerfed during socket.io intergration
// let server
// if ( config.LOCAL_SSL_KEY_PATH === undefined ) {
//   server = http.createServer(app.callback())
//
//   server.listen(port, function() {
//     log.info('Server started: http://localhost:' + port + '/');
//   })
// } else {
//   // setup for local SSL
//   const httpsOptions = {
//     key: fs.readFileSync(config.LOCAL_SSL_KEY_PATH),
//     cert: fs.readFileSync(config.LOCAL_SSL_CERT_PATH)
//   }
//
//   server = https.createServer(httpsOptions, app.callback())
//
//   server.listen(port, () => {
//     console.log('server running at ' + port)
//   })
// }

// io.attach(app);


// TODO: deprecate with docker
if ( config.LOCAL_SSL_CERT_PATH ) {
  io.attach(app, true, {
      key: fs.readFileSync(config.LOCAL_SSL_KEY_PATH),
      cert: fs.readFileSync(config.LOCAL_SSL_CERT_PATH)
      //ca: fs.readFileSync(...)
  })

  console.log('Server: HTTPS/TLS Enabled.');
}

io.on('message', (ctx, data) => {
    console.log('client sent data to message endpoint', data);
});

io.on('connection', (ctx, data) => {
});

io.on('liquidityAgent', async (ctx, data) => {
    let tag = TAG + '| io.on liquidityAgent |'
    log.debug(tag, ' data***', data)
    log.debug(tag, 'ctx***', ctx)

    let account = data.account
    let payload = data.payload
    let signature = data.signature

    //validate Auth
    if(!account || !payload || !signature)
        throw Error("100: invalid AUTH protocol! malformed body.")

    //validate sig
    log.debug("account: ",account)
    log.debug("signature: ",signature)
    log.debug("payload: ",payload)
    let isValid = await signing.validate(account,signature,payload)
    log.debug("isValid: ",isValid)
    if(!isValid) throw Error("101: invalid AUTH signature! signature does not validate!")

    let {orderId, market, quantity, rate, type, nonce, event} = payload

    log.debug(tag, 'blaah!!!',  orderId, market, quantity, rate, type, nonce)

    try{
        switch (event) {
            case 'submit':
                payload = await apiCustody.limit(account, orderId, market, quantity, rate, type, nonce)
                break
            case 'cancel':
                payload = await apiCustody.cancel(account, nonce, orderId)
                break
            default:
                log.error(tag, 'error on event, event:', event)
                throw new Error('Unknown event')

        }

        let signature = await signing.sign(config.ARBITER_SIGNING,payload)
        let arbiterAccount = config.ARBITER_SIGNING
        let output = {arbiterAccount,payload,signature}
        log.debug("output: ",output)

        ctx.acknowledge('successful: ' + JSON.stringify(output) )
    }catch(e){
        console.error("e: ",e)
        ctx.acknowledge('Unsuccessful: ' + JSON.stringify(output))
    }

})

// io.on('submit', (ctx, data) => {
//     let tag = TAG + '|submit|'
//     log.info(`${tag}, ctx: ${ctx}, data: ${data}`)
// })


subscriber.subscribe('publishToFront')

subscriber.on('message', async function (channel, payloadS) {
    let tag = TAG + ' | publishToFront | '
    try {
        let payload = JSON.parse(payloadS)
        log.info(tag,"payload: ",payload)
        let event = payload.event
        log.debug(tag,"event: ",event)
        if(!event) throw Error("103: invalid event!!!")
        if(!payload.market) throw new Error("No market")


        let accountByMarket = payload.account + ':' + payload.market
        // let account = payload.account    

        log.info(tag, 'accountByMarket', accountByMarket)

        //types of events
        switch (event) {
            case 'accountUpdate':
                io.broadcast(accountByMarket, payload);
                break;
            case 'orderUpdate':
                io.broadcast(account, payload);
                break;
            case 'lastPrice':
                io.broadcast('lastPrice', payload.lastPrice);
                break;
            case 'volume24h':
                io.broadcast('volume24h', payload.volume24h);
                break;
            case 'pctChange24h':
                io.broadcast('pctChange24h', payload.pctChange24h);
                break;
            case 'pctChange1h':
                io.broadcast('pctChange1h', payload.pctChange1h);
                break;
            case 'lowBid':
                io.broadcast('lowBid', payload.lowBid);
                break;
            case 'highAsk':
                io.broadcast('highAsk', payload.highAsk);
                break;
            case 'high24':
                io.broadcast('high24', payload.high24);
                break;
            case 'low24':
                io.broadcast('low24', payload.low24);
                break;
        }
    }catch(e){
        log.error(tag,e)
        throw e
    }
})


app.listen(config.PORT || 3000);
