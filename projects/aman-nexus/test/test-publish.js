
const config = require("../configs/env")
const util = require('@arbiter/arb-redis')
const redis = util.redis
let publisher = util.publisher
let subscriber = util.subscriber


let body = '<@U60ECRP1V> I cant let you do that leon :robot_face: '

let output = {view:{icon_emoji: ':rocket:'},msg:body,channel:"gaming"}
//log.debug(tag,"output: ",output)
//publisher.publish("publishToSlack",JSON.stringify(output))
publisher.publish("publish",JSON.stringify(output))
