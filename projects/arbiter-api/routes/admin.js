// const TAG = " | API | "
// const config = require("../configs/env")
// const log = require('@arbiter/dumb-lumberjack')()
// //console.log(config)
//
// const util = require('../modules/redis')
// const subscriber = util.subscriber
// const publisher = util.publisher
// const redis = util.redis
//
// const admin = require("../modules/public.js")
//
// const describe = require("../modules/describe.js")
// const signing = require("../modules/signing.js")
// //map
// // let map = {}
// // map.get = describe.map()
// // map.post = describe.map()
//
// const api = Object.assign(private, public)
// let paths = Object.keys(api)
// log.debug("api: ",api)
// log.debug("paths: ",paths)
//
// let routes = {}
//
// for (let i = 0; i < paths.length; i++) {
//     let endpoint = paths[i]
//     log.debug(TAG,"endpoint",endpoint)
//
//     if(public[endpoint]){
//         let pathInfo = map.get[endpoint]
//         if(pathInfo.length === 0){
//             //no params
//             routes[endpoint] = async (ctx) => {
//                 ctx.body = await api[endpoint]()
//             }
//         }else{
//             //1 params
//             routes[endpoint] = async (ctx,param1,param2) => {
//                 log.debug("param1: ",param1)
//                 log.debug("param2: ",param2)
//                 let params = []
//                 if(param1)  params.push(param1)
//                 if(param2)  params.push(param2)
//                 let payload = await api[endpoint].apply(this, params)
//                 let signature = await signing.sign(config.ARBITER_SIGNING,payload)
//                 let account = config.ARBITER_SIGNING
//                 let output = {account,payload,signature}
//                 log.debug("output: ",output)
//                 ctx.body = JSON.stringify(output)
//             }
//         }
//
//     }else{
//
//
//     }
//
// }
//
// module.exports = {routes,map}
