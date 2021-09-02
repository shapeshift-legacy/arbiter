


/*
        Reporting module
 */


let TAG = '| reports |'
const util = require('@arbiter/arb-redis')
const redis = util.redis
const config = require("../configs/env")
const SlackUpload = require('node-slack-upload')
//const slackUp = new SlackUpload(config.SLACK_TOKEN)
//const json2csv = require('json2csv')
const json2csv = require('json2csv').Parser;
const when = require('when')
const fs = require('fs')
const mkdirp = require('mkdirp');
const getDirName = require('path').dirname;
const shortid = require('shortid')

const Redis = require('then-redis')
const publisher = util.publisher

// let {reportARB,match,balances,credits,debits,orders,users} = require('./mongo.js')

const mongo = require('@arbiter/arb-mongo')

// logging
const log = require('@arbiter/dumb-lumberjack')()
/********************************************
 // Modules
 //*******************************************/

module.exports = {
    users: function () {
        return build_users_report()
    },
    balances: function () {
        return build_balance_report()
    },
    transactions: function (account) {
        return build_transaction_report(account)
    },
    balanceSheet: function (account) {
        return build_balance_sheet(account)
    },
    arbiter: function () {
        return build_arbiter_report()
    },
    credits: function () {
        return build_credits_report()
    },
    debits: function () {
        return build_debits_report()
    },
    match: function () {
        return build_match_report()
    },
    all: function () {
        return build_all_reports()
    },
}


/********************************************
// Lib
//*******************************************/

let build_all_reports = async function () {
    let tag = TAG+" | raw_to_csv | "
    try {

        await build_arbiter_report()
        await build_users_report()
        await build_credits_report()
        await build_debits_report()
        await build_match_report()
        await build_balance_report()

        return true
    } catch (e) {
        log.error(tag,e)
    }
}

let build_transaction_report = async function (account) {
    let tag = TAG+" | build_balance_report | "
    try {
        //TODO config on setup accounting systems

        //get all arbiter report data
        let allOrders = await mongo[account+'-txs'].find()
        log.debug(tag,"allOrders: ",allOrders)

        let filename = account+"-txs"+new Date().getTime()
        let result = await raw_to_csv(allOrders,filename)


        let message = {
            id: shortid(),
            userId: 'BOT001',
            channelId: 'help',
            // content: '<img src="https://www.iconsdb.com/icons/preview/green/report-3-xxl.png" alt="' + filename + '">' +
            // '<br><a href="http://' + config.HOST_CORE + ':' + config.PORT_CORE + '/' + filename + '.csv">Download your report!</a>',
            content:'<a href="http://' + config.HOST_CORE + ':' + config.PORT_CORE + '/' + filename + '.csv">\n' +
            '  <img src="http://127.0.0.1:3010/report.png" alt="report" style="width:42px;height:42px;border:0;">\n' +
            '</a>report  '+filename+' generated!',
            dateAdded: new Date().getTime()
        }
        publisher.publish('publish', JSON.stringify(message))

        return result
    } catch (e) {
        log.error(tag,e)
    }
}

let build_balance_sheet = async function (account) {
    let tag = TAG+" | build_balance_report | "
    try {
        //TODO config on setup accounting systems

        //get all arbiter report data
        let allOrders = await mongo[account+'-balances'].find()
        log.debug(tag,"allOrders: ",allOrders)

        let filename = account+"-balancesheet-report"+new Date().getTime()
        let result = await raw_to_csv(allOrders,filename)


        let message = {
            id: shortid(),
            userId: 'BOT001',
            channelId: 'help',
            // content: '<img src="https://www.iconsdb.com/icons/preview/green/report-3-xxl.png" alt="' + filename + '">' +
            // '<br><a href="http://' + config.HOST_CORE + ':' + config.PORT_CORE + '/' + filename + '.csv">Download your report!</a>',
            content:'<a href="http://' + config.HOST_CORE + ':' + config.PORT_CORE + '/' + filename + '.csv">\n' +
            '  <img src="http://127.0.0.1:3010/report.png" alt="report" style="width:42px;height:42px;border:0;">\n' +
            '</a>Download your report!',
            dateAdded: new Date().getTime()
        }
        publisher.publish('publish', JSON.stringify(message))

        return result
    } catch (e) {
        log.error(tag,e)
        throw e
    }
}


let build_balance_report = async function () {
    let tag = TAG+" | build_balance_report | "
    try {
        // let fields = Object.keys(data[0])

        //get all arbiter report data
        let allOrders = await balances.find()
        log.debug(tag,"allOrders: ",allOrders)


        let result = await raw_to_csv(allOrders,"arbiterbalance-report:")

        return result
    } catch (e) {
        log.error(tag,e)
    }
}

let build_match_report = async function () {
    let tag = TAG+" | raw_to_csv | "
    try {
        // let fields = Object.keys(data[0])

        //get all arbiter report data
        let allOrders = await match.find()
        log.debug(tag,"allOrders: ",allOrders)


        let result = await raw_to_csv(allOrders,"arbitermatch-report:")

        return result
    } catch (e) {
        log.error(tag,e)
    }
}


let build_arbiter_report = async function () {
    let tag = TAG+" | raw_to_csv | "
    try {
        // let fields = Object.keys(data[0])

        //get all arbiter report data
        let allOrders = await reportARB.find()
        log.debug(tag,"allOrders: ",allOrders)


        let result = await raw_to_csv(allOrders,"arbiterreport:")

        return result
    } catch (e) {
        log.error(tag,e)
    }
}

let build_users_report = async function () {
    let tag = TAG+" | raw_to_csv | "
    try {
        // let fields = Object.keys(data[0])

        //get all arbiter report data
        let allOrders = await users.find()
        log.debug(tag,"allOrders: ",allOrders)


        let result = await raw_to_csv(allOrders,"arbiterusers-report:")

        return result
    } catch (e) {
        log.error(tag,e)
    }
}


let build_credits_report = async function () {
    let tag = TAG+" | raw_to_csv | "
    try {
        // let fields = Object.keys(data[0])

        //get all arbiter report data
        let allOrders = await credits.find()
        log.debug(tag,"allOrders: ",allOrders)


        let result = await raw_to_csv(allOrders,"arbitercredits-report:")

        return result
    } catch (e) {
        log.error(tag,e)
    }
}

let build_debits_report = async function () {
    let tag = TAG+" | raw_to_csv | "
    try {
        // let fields = Object.keys(data[0])

        //get all arbiter report data
        let allOrders = await debits.find()
        log.debug(tag,"allOrders: ",allOrders)

        let result = await raw_to_csv(allOrders,"arbiterdebits-report:")

        return result
    } catch (e) {
        log.error(tag,e)
    }
}



let raw_to_csv = async function (data, title) {
    let tag = TAG+" | raw_to_csv | "
    try {
        // let fields = Object.keys(data[0])
        let fields = []

        // iterate over entire dataset
        // get all keys
        for (let i = 0; i < data.length; i++) {
            let entryFields = Object.keys(data[i])
            for (let j = 0; j < entryFields.length; j++) {
                fields.push(entryFields[j])
            }
        }

        fields = fields.filter(function (elem, pos) {
            return fields.indexOf(elem) == pos
        })

        //const result = new json2csv({ data: data, fields: fields })
        const json2csvParser = new json2csv({fields})
        const result = json2csvParser.parse(data);
        log.info(tag,"result: ",result)

        // write to file
        if(config.NODE_ENV === "dev"){
            const filename = './projects/arbiter-core/reports/'+title + '.csv'
            await write_file(filename, result)
        }else{
            const filename = '../reports/'+title + '.csv'
            await write_file(filename, result)
        }


        // upload to slack
        //await upload_to_slack(filename, config.SLACK_CHANNEL_NAME)
        //await upload_to_slack(filename, config.SLACK_CHANNEL_NAME_REPORTS)

        return { success: true }
    } catch (e) {
        log.error(tag,e)
        throw e
    }
}

//write to reports dir even if dir doesnt exist
// const write_file = function (path, contents, cb) {
//     mkdirp(getDirName(path), function (err) {
//         if (err) return cb(err);
//
//         fs.writeFile(path, contents, cb);
//     });
// }


const write_file = function (filename, data) {
    const d = when.defer()

    fs.writeFile(filename, data, function (err) {
        if (err) throw err

        d.resolve(true)
    })
    return d.promise
}

const upload_to_slack = function (filename, channel) {
    const d = when.defer()
    let tag = ' | upload_to_slack | '

    slackUp.uploadFile({
        file: fs.createReadStream(filename),
        filetype: 'csv',
        title: filename,
        initialComment: filename,
        channels: channel
    }, function (err, data) {
        if (err) {
            console.error(tag, err)
            d.resolve(false)
        } else {
            console.log('Uploaded file details: ', data)
            d.resolve(true)
        }
    })

    return d.promise
}
