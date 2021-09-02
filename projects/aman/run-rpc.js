const pm2 = require('pm2')
const config = require('./configs/env')

pm2.connect((err, result) => {

  if ( err ) {
    console.error(`error connecting to pm2`, err)
    throw err
  }

  for (let coin in config.env.coins) {
    let conf = config.env.coins[coin]

    console.log(`starting process for ${coin} on port ${conf.port}`)

    pm2.start({
      "script": "rpc.js",
      "name": "rpc-"+coin+"-"+conf.port,
      force: true,
      "env": {
        "port": conf.port,
        coin
      }
    }, (err, result) => {
      if (err) {
        console.error(`error starting process`, err)
      } else {
        console.log(`successfully started process for ${coin} on port ${conf.port}`)
      }
    })
  }
})
