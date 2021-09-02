/*
       CLI tools
 */


const TAG = " | RPC | "

const wallet = require('./modules/eth-wallet.js')
const describe = require('./modules/describe.js')
const vorpal = require('vorpal')();


//globals
let prompt = "ethereumd: "
var locked = true
var USER = null

//map module
const map = describe.map(wallet)
console.log("methods known: ",map)

let help = {
    getCoinbase:"getCoinbase: list account[0] set as parity coinbase"
}



Object.keys(map).forEach(function(key) {
    let tag = TAG + " | "+key+" | "
    let debug = false
    if(debug) console.log(tag,"key: ",key)
    let expectedParams = map[key]

    if(debug) console.log(tag,"expectedParams: ",expectedParams)

    let helpString
    if(key === "getNewAddress") helpString = " This is a more helpfull message"
        else if(help[key]) helpString = help[key]
    if(!helpString) helpString = key+": expected params: "+expectedParams

    vorpal.command(key, helpString)
        .action(function (args, cb) {
            let self = this;
            let params = []

            if(expectedParams.length > 0){
                for(let i = 0; i < expectedParams.length; i++){
                    let param = {
                        type: 'input',
                        name: expectedParams[i],
                        message: "input "+expectedParams[i]+": "
                    }
                    params.push(param)
                }
            }



            let promise = this.prompt(params, function (answers) {
                // You can use callbacks...

            });

            promise.then(async function(answers) {
                if(debug) console.log(tag,"answers: ",answers)

                let parameters = []
                Object.keys(answers).forEach(function(answer) {
                    parameters.push(answers[answer])
                })
                console.log(tag,"parameters: ",parameters)
                const result = await wallet[key].apply(this, parameters)
                console.log("result: ",result)

                cb();
            });
        });


})




vorpal
    .delimiter(prompt)
    //.action(app.tick())
.show();
