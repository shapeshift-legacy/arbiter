
const info = require('./coin-info')

let tokens = [
"1ST",
"ANT",
"BAT",
"BNT",
"CVC",
"DGD",
"DNT",
"EDG",
"EOS",
"FUN",
"GNO",
"GNT",
"GUP",
"ICN",
"MLN",
"MTL",
"NMR",
"OMG",
"PAY",
"QTUM",
"RCN",
"REP",
"RLC",
"SALT",
"SNGLS",
"SNT",
"STORJ",
"SWT",
"TKN",
"TRST",
"WINGS",
"ZRX"
]

for (let c in info) {
  console.log(info[c])

  if ( tokens.includes(c) ) {
    info[c].type = "ETH_TOKEN"
  } else {
    info[c].type = "UNKNOWN"
  }
}

let keys = Object.keys(info)
keys.sort()

let out = {}

keys.forEach(k => {
  out[k] = info[k]
})

console.log(`info`, JSON.stringify(out, false, '  '))
