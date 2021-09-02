

const TAG = " | views | "

const log = require('@arbiter/dumb-lumberjack')()
let table = require('markdown-table')
const shortid = require('shortid')

module.exports = {
    smartView: function (input) {
        return smart_view_creation(input)
    },
}




let smart_view_creation = async function(input){
    let tag = TAG+" | smart_view_creation | "
    try{
        let id = shortid()
        let output = {}
        //formats

        //if admin formated already do nothing
        if(input.id && input.userId && input.channelId && input.content){
            log.debug(tag,' already formated ')
            return input
        }

        //if slack
        if(input.view && input.msg && input.channel){
            log.debug(tag,' slack formated ')
            //translate to admin
            output.id = id
            //output.channelId = input.channel
            output.channelId = 'arbiter'
            //TODO stop fucking doing this
            output.userId = 'BOT001'
            output.content = input.msg
            output.dateAdded = new Date().getTime()
            return output
        }

        //smart
        output.id = id
        //output.channelId = input.channel
        output.channelId = 'arbiter'
        output.userId = 'BOT001'
        output.content = JSON.stringify(input)
        output.dateAdded = new Date().getTime()
        return output

        //generic JSON

        //generic ARRAY

        //convert to MD

        //convert to HTML


        //return '<br>here is your report <a href=\"http://127.0.0.1:3010/arbiterreport:.csv\">Arbiter-report.csv</a>'
    }catch(e){
        log.error(tag,e)
        throw e
    }
}


/******************************************************
// LIB
//*****************************************************/

// const json_to_markdown = function(json){
//     let tag = TAG+" | json_to_markdown | "
//     try{
//         let output = ""
//         if(typeof(json) !== 'object') throw Error("101: must be JSON!")
//         /*
//               JSON to MD table
//           */
//         let output = table([
//             ['Branch', 'Commit'],
//             ['master', '0123456789abcdef'],
//             ['staging', 'fedcba9876543210']
//         ])
//
//         return output
//     }catch(e){
//         console.error(tag,e)
//         throw e
//     }
// }
