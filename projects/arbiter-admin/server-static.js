require('dotenv').config();


/*
    Liquidity agent API
 */
const TAG = " | LA API | "
//const config = require("./configs/env")
const log = require('@arbiter/dumb-lumberjack')()
const _ = require('koa-route')
const serve = require('koa-static');

const Koa = require('koa');
//const koaBody = require('koa-body');
const app = module.exports = new Koa();

//host reports
let path = __dirname + '/dist'
log.info(TAG,'report: path: ',path)
app.use(serve(path));

if (!module.parent) app.listen(8080);
log.info("started API on port: ",8080)
