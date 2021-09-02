/*
    API module

    build top level map
    (handle key conflicts)

    build parameter maps

    TODO: auto export api docs
 */
const TAG = " | API | "
const config = require("../configs/env")
const log = require('@arbiter/dumb-lumberjack')()
//console.log(config)

const util = require('../modules/redis')
const subscriber = util.subscriber
const publisher = util.publisher
const redis = util.redis

const public = require("../modules/public.js")
const private = require("../modules/private.js")
const describe = require("../modules/describe.js")
const signing = require("../modules/signing.js")
//map
let map = {}
map.get = describe.map(public)
map.post = describe.map(private)

const api = Object.assign(private, public)
let paths = Object.keys(api)
log.debug("api: ",api)
log.debug("paths: ",paths)
log.debug("map: ",map)

let routes = {}

for (let i = 0; i < paths.length; i++) {
    let endpoint = paths[i]
    log.debug(TAG,"endpoint",endpoint)

    if(public[endpoint]){
        let pathInfo = map.get[endpoint]
        if(pathInfo.length === 0){
            //no params
            routes[endpoint] = async (ctx) => {
              try {
                ctx.body = await api[endpoint]()
              } catch (ex) {
                log.error(ex)
                ctx.throw(500,"internal server error")
              }
            }
        }else{
            //1 params
            routes[endpoint] = async (ctx,param1,param2) => {
                log.debug("param1: ",param1)
                log.debug("param2: ",param2)
                let params = []
                if(param1)  params.push(param1)
                if(param2)  params.push(param2)
                try {
                  let payload = await api[endpoint].apply(this, params)
                  let signature = await signing.sign(config.ARBITER_SIGNING,payload)
                  let account = config.ARBITER_SIGNING
                  let output = {account,payload,signature}
                  log.debug("output: ",output)
                  ctx.body = output // should NOT be JSON.stringify cuz it changes Content-Type header
                } catch (ex) {
                  log.error(ex)
                  ctx.throw(500,"internal server error")
                }
            }
        }

    }else{
        let pathInfo = map.post[endpoint]
        routes[endpoint] = async (ctx) => {
            log.info(TAG,"incoming POST body: ",ctx.request.body)
            let account = ctx.request.body.account
            let payload = ctx.request.body.payload
            let signature = ctx.request.body.signature

            //validate Auth
            if(!account || !payload || !signature)
                throw Error("100: invalid AUTH protocol! malformed POST body.")

            //validate sig
            let isValid = await signing.validate(account,signature,payload)
            if(!isValid) throw Error("101: invalid AUTH signature! signature does not validate!")

            let params = []
            for (let i = 0; i < pathInfo.length; i++) {
                if(pathInfo[i] === 'account'){
                    params.push(ctx.request.body.account)
                }else if(pathInfo[i] === 'body'){
                    params.push(ctx.request.body)
                }else{
                    params.push(ctx.request.body.payload[pathInfo[i]])
                }
            }
            log.info(TAG,"params: ",params)
            try{
                let payload = await api[endpoint].apply(this, params)
                let signature = await signing.sign(config.ARBITER_SIGNING,payload)
                let account = config.ARBITER_SIGNING
                let output = {account,payload,signature}
                log.debug("output: ",output)
                ctx.body = output // should NOT be JSON.stringify cuz it changes Content-Type header
            }catch(e){
                log.error(e)
                if ( process.env.NODE_ENV !== "production" ) {
                  ctx.throw(500, e.message || e.toString())
                } else {
                  ctx.throw(500,"internal server error")
                }
            }
        }

    }

}

module.exports = {routes,map}
