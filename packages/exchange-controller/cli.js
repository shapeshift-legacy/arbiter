/*

    Tools:

        * Get balance object
        * Get addresses
        * Send/Withdrawal moniez


 */
require('dotenv').config();
let app = require("./modules/liquidity.js")

const vorpal = require('vorpal')();
const TAG = " | cli - 2 | "
const prompt = "liquidity-cli:"
const cliCommands = map_module(app)

let help = {
    coinsBalances: {
        text: "get balances of all coins: (no params)"
    },
    orders: {
        text: "get orders of an account: (account)"
    },
    users: {
        text: "get all users: (no params)",
    }
}

//parse module and return map
function map_module (module){
    const tag = " | map_module | "
    const map = {}

    const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
    const ARGUMENT_NAMES = /([^\s,]+)/g;
    function getParamNames(func) {
        const fnStr = func.toString().replace(STRIP_COMMENTS, '');
        let result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
        if(result === null)
            result = [];
        return result;
    }

    Object.keys(module).forEach(function(key) {
        const val = module[key];
        const params = getParamNames(val)
        map[key] = params
    });
    return map
}

function addMainCommands() {
    let tag = TAG+" | addMainCommands | "

    console.log("\n type *help* for cli options \n")

    Object.keys(cliCommands).forEach(async function(key) {
        let tag = TAG + " | "+key+" | "
        let expectedParams = cliCommands[key]
        let helpString

        if (help[key]) {
            helpString = help[key].text
        }

        if (!helpString) helpString = key+": expected params: "+expectedParams

        // add all the commands from the wallet
        vorpal.command(key, helpString)
            .action(async function (args, cb) {
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

                let answers = await this.prompt(params)

                let parameters = []
                Object.keys(answers).forEach(function(answer) {
                    parameters.push(answers[answer])
                })

                const result = await app[key].apply(this, parameters)
                console.log(result)
                vorpal.delimiter(prompt).show();

                //return prompt
                cb();
            });
    })
}
addMainCommands()


vorpal.delimiter(prompt).show()
