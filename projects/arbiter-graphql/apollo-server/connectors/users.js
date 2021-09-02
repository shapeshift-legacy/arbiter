const shortid = require('shortid')
const log = require('@arbiter/dumb-lumberjack')()
const passwordHash = require('password-hash')
// users in mongo
let users = []
const util = require('../modules/redis')
const yub = require('../modules/yubikey')
const redis = util.redis
const TAG = ' | users | '
const {usersDB} = require('../modules/mongo')

let startup = async function () {
  try {
    users = await usersDB.find()
    log.debug(users)
  } catch (e) {
    log.error(e)
  }
}
startup()


let on_create = async function(){
    let tag = TAG + " | on_create | "
    try{
        // find bot user in mongo
        let botUser = await usersDB.findOne({id:"BOT001"})

        //if no bot user
        if(!botUser){
            //sign up bot
            let botInfo = {
                id:'BOT001',
                nickname:'Mr. Bot',
                bot:true,
                created:new Date().getTime(),
                tokens:[],
                channels:['help'],
                yubikey:"",
                email:"mrBot@gmail.com",
                password:"<redacted>"

            }
            await usersDB.insert(botInfo)

            users = await usersDB.find()
            log.debug(users)
        } else {
            users = await usersDB.find()
            log.debug(users)
        }

    }catch(e){
        log.error(tag,e)
        throw e
    }
}

on_create()

// exports.register = (input, context) => {
// 	if (users.find(u => u.email === input.email)) {
// 		throw new Error('Email already used')
// 	}
//
// 	users.push({
// 		id: shortid(),
// 		email: input.email,
// 		password: input.password,
// 		nickname: input.nickname,
// 		yubikey: input.yubikey,
// 		tokens: [],
// 	})
//
// 	return true
// }

exports.register = async (input, context) => {
  let tag = ' | register | '
  try {
    if (users.find(u => u.email === input.email)) {
      throw new Error('Email already used')
    }
    let hashedPassword = passwordHash.generate(input.password)
    let yubikeyRep = await yub.authenticate(input.yubikey)
    log.info(tag, 'yubikeyRep: ', yubikeyRep)
    let user = {
      id: shortid(),
      email: input.email,
      password: hashedPassword,
      nickname: input.nickname,
      yubikey: yubikeyRep.identity,
      tokens: [],
      channels: ['random', 'general', 'help'],
    }
    users.push(user)
    usersDB.insert(user)
    return true
  } catch (e) {
    log.error(tag, e)
    throw new Error(e)
  }
}

// exports.register = async (input, context) => {
//   let tag = ' | register | '
//   try {
//     let users = await users.find()
//
// 	  if (users.find(u => u.email === input.email)) {
//       throw new Error('Email already used')
//     }
//
//     users.push({
//       id: shortid(),
//       email: input.email,
//       password: input.password,
//       nickname: input.nickname,
//       yubikey: input.yubikey,
//       tokens: [],
//     })
//     users.insert(users)
//     return true
//   } catch (e) {
//     log.error(tag, e)
//   }
// }

// exports.register = (input, context) => {
//   if (users.find(u => u.email === input.email)) {
//     throw new Error('Email already used')
//   }
//
//   users.push({
//     id: shortid(),
//     email: input.email,
//     password: input.password,
//     nickname: input.nickname,
//     yubikey: input.yubikey,
//     tokens: [],
//   })
//
//   return true
// }

exports.login = async ({ email, password, yubikey }, context) => {
  let tag = TAG + ' | login | '
  const user = users.find(
    u => u.email === email
  )
  log.debug(tag, 'user: ', user)
  if (!passwordHash.verify(password, user.password)) throw new Error('Invalid password!')
  if (!user) throw new Error('User not found')
  if (!yubikey) throw new Error('Yubikey required!')

  // validate yubikey press
  let yubikeyRep = await yub.authenticate(yubikey)
  log.info(tag, 'yubikeyRep: ', yubikeyRep)

  const token = {
    id: shortid(),
    userId: user.id,
    expiration: Date.now() + 24 * 3600 * 1000,
  }
  user.tokens.push(token)
  return {
    user,
    token,
  }
}

exports.logout = (context) => {
  if (context.userId && context.token) {
    const user = exports.getOne(context.userId)
    if (user) {
      const index = user.tokens.findIndex(t => t.id === context.token.id)
      if (index !== -1) user.tokens.splice(index, 1)
    }
  }
  return true
}

// exports.getOne = async (id, context) => {
//   let tag = ' | getOne | '
//   try {
//     let user = await users.findOne({id})
//     return user
//   } catch (e) {
//     log.error(tag, e)
//   }
// }

// exports.validateToken = async (token) => {
//   let tag = ' | validateToken | '
//   try {
//     const user = await exports.getOne(token.userId)
// log.info(tag, user)
//
//     if (user) {
//
//       const storedToken = user.tokens.find(t => t.id === token.id)
//       if (storedToken) {
//         return storedToken.expiration === token.expiration && storedToken.expiration > Date.now()
//       }
//     }
//     return false
//   } catch (e) {
//     log.error(tag, e)
//   }
// }

exports.getOne = (id, context) => {
  return users.find(u => u.id === id)
}

exports.validateToken = (token) => {
  const user = exports.getOne(token.userId)
  if (user) {
    const storedToken = user.tokens.find(t => t.id === token.id)
    if (storedToken) {
      return storedToken.expiration === token.expiration && storedToken.expiration > Date.now()
    }
  }
  return false
}

exports.current = (context) => {
  if (!context.userId) throw new Error('Unauthorized')
  return exports.getOne(context.userId, context)
}
