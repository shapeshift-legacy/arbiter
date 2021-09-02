const TAG = " | app | "
require('dotenv').config()
//require('dotenv').config({path: './../../../.env'})

const config = require('./apollo-server/configs/env')
if(!config.YUBIKEY_PUB) throw Error("101: YUBI config not found!")

const http = require('http')
const chalk = require('chalk')
const express = require('express')
const { ApolloServer, gql } = require('apollo-server-express')
const { PubSub } = require('graphql-subscriptions')
const merge = require('deepmerge')
const util = require('./apollo-server/modules/redis')
const redis = util.redis
const subscriber = util.subscriber
const publisher = util.publisher
const log = require('@arbiter/dumb-lumberjack')()
const triggers = require('./apollo-server/triggers.js')
const { defaultValue, autoCall } = require('./utils')
const views = require('@arbiter/arb-views')
// Express app
const app = express()

const {usersDB, channelsDB} = require('./apollo-server/modules/mongo')

const channels = [
    { id: 'arbiter', name: 'Arbiter Commands' },
    { id: 'general', name: 'General discussion' },
    { id: 'random', name: 'Have fun chatting!' },
    { id: 'help', name: 'Ask for or give help' },
]

for (let i = 0; i < channels.length; i++) {
    channelsDB.insert(channels[i])
}


function load (file) {
  const module = require(file)
  if (module.default) {
    return module.default
  }
  return module
}

function processSchema (typeDefs) {
  if (Array.isArray(typeDefs)) {
    return typeDefs.map(processSchema)
  }
  
  if (typeof typeDefs === 'string') {
    // Convert schema to AST
    typeDefs = gql(typeDefs)
  }
  
  // Remove upload scalar (it's already included in Apollo Server)
  removeFromSchema(typeDefs, 'ScalarTypeDefinition', 'Upload')
  
  return typeDefs
}

function removeFromSchema (document, kind, name) {
  const definitions = document.definitions
  const index = definitions.findIndex(
    def => def.kind === kind && def.name.kind === 'Name' && def.name.value === name
  )
  if (index !== -1) {
    definitions.splice(index, 1)
  }
}

//TODO get paths dir
let options = {
  port: process.env.PORT || 4000,
  graphqlPath: '/graphql',
  subscriptionsPath: '/graphql',
  engineKey: null,
  enableMocks: undefined,
  enableEngine: undefined,
  cors: '*',
  timeout: 120000,
  integratedEngine: true,
  serverOptions: undefined,
  paths:
    { typeDefs: './apollo-server/type-defs.js',
      resolvers: './apollo-server/resolvers.js',
      context: './apollo-server/context.js',
      mocks: './apollo-server/mocks.js',
      pubsub: './apollo-server/pubsub.js',
      server: './apollo-server/server.js',
      apollo: './apollo-server/apollo.js',
      engine: './apollo-server/engine.js',
      directives: './apollo-server/directives.js' } }

// Customize those files
let typeDefs = load(options.paths.typeDefs)
const resolvers = load(options.paths.resolvers)
const context = load(options.paths.context)
const schemaDirectives = load(options.paths.directives)
let pubsub
try {
  pubsub = load(options.paths.pubsub)
} catch (e) {
  if (process.env.NODE_ENV !== 'production' && !options.quiet) {
    console.log(chalk.yellow('Using default PubSub implementation for subscriptions.'))
    console.log(chalk.grey(`You should provide a different implementation in production (for example with Redis) by exporting it in 'apollo-server/pubsub.js'.`))
  }
}

// GraphQL API Server

// Realtime subscriptions
if (!pubsub) pubsub = new PubSub()

/*
    Redis Pub/SUB
        -hack
 */
subscriber.subscribe('publish')
subscriber.on('message', async function (channel, payloadS) {
  var tag = TAG + ' | pub/sub | '
  try {
    //
    log.info(tag, 'channel: ', channel)
    log.info(tag, 'payloadS: ', payloadS)
    let message = JSON.parse(payloadS)
    let type = 'added'
    log.info(tag, 'message: ', message)

    message = await views.smartView(message)
    let result = pubsub.publish(triggers.MESSAGE_CHANGED, {
      messageChanged: {
        type,
        message,
      },
    })
    console.log(result)
  
  } catch (e) {
    log.error(tag, 'error: ', e)
  }
})

// Customize server
try {
  const serverModule = load(options.paths.server)
  serverModule(app)
} catch (e) {
  // No file found
}

// Apollo server options

typeDefs = processSchema(typeDefs)

let apolloServerOptions = {
  typeDefs,
  resolvers,
  schemaDirectives,
  tracing: true,
  cacheControl: true,
  engine: !options.integratedEngine,
  // Resolvers context from POST
  context: async ({ req, connection }) => {
    let contextData
    try {
      if (connection) {
        contextData = await autoCall(context, { connection })
      } else {
        contextData = await autoCall(context, { req })
      }
    } catch (e) {
      console.error(e)
      throw e
    }
    contextData = Object.assign({}, contextData, { pubsub })
    return contextData
  },
  // Resolvers context from WebSocket
  subscriptions: {
    path: options.subscriptionsPath,
    onConnect: async (connection, websocket) => {
      let contextData = {}
      try {
        contextData = await autoCall(context, {
          connection,
          websocket,
        })
        contextData = Object.assign({}, contextData, { pubsub })
      } catch (e) {
        console.error(e)
        throw e
      }
      return contextData
    },
  },
}

// Automatic mocking
if (options.enableMocks) {
  // Customize this file
  apolloServerOptions.mocks = load(options.paths.mocks)
  
  if (!options.quiet) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(`Automatic mocking is enabled, consider disabling it with the 'graphqlMock' option.`)
    } else {
      console.log(`✔️  Automatic mocking is enabled`)
    }
  }
}

// Apollo Engine
if (options.enableEngine && options.integratedEngine) {
  if (options.engineKey) {
    apolloServerOptions.engine = {
      apiKey: options.engineKey,
    }
  } else if (!options.quiet) {
    console.log(chalk.yellow('Apollo Engine key not found.') + `To enable Engine, set the ${chalk.cyan('VUE_APP_APOLLO_ENGINE_KEY')} env variable.`)
    console.log('Create a key at https://engine.apollographql.com/')
    console.log('You may see `Error: Must provide document` errors (query persisting tries).')
  }
} else {
  apolloServerOptions.engine = false
}

// Final options
apolloServerOptions = merge({}, apolloServerOptions, defaultValue(options.serverOptions, {}))

// Apollo Server
const server = new ApolloServer(apolloServerOptions)

// Express middleware
server.applyMiddleware({
  app,
  path: options.graphqlPath,
  cors: options.cors,
  // gui: {
  //   endpoint: graphqlPath,
  //   subscriptionEndpoint: graphqlSubscriptionsPath,
  // },
})

// Start server
const httpServer = http.createServer(app)
httpServer.setTimeout(options.timeout)
server.installSubscriptionHandlers(httpServer)

httpServer.listen({
  port: options.port,
}, () => {
  //if (!options.quiet) {
    console.log(`✔️  GraphQL Server is running on ${chalk.cyan(`http://localhost:${options.port}${options.graphqlPath}`)}`)
    // if (process.env.NODE_ENV !== 'production' && !process.env.VUE_CLI_API_MODE) {
    //   console.log(`✔️  Type ${chalk.cyan('rs')} to restart the server`)
    // }
  //}
  
  //cb && cb()
})
