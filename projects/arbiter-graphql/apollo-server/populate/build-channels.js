const util = require('../modules/redis')
const redis = util.redis
const {usersDB, channelsDB} = require('../modules/mongo')

const channels = [
  { id: 'arbiter', name: 'Arbiter Commands' },
  { id: 'general', name: 'General discussion' },
  { id: 'random', name: 'Have fun chatting!' },
  { id: 'help', name: 'Ask for or give help' },
]

for (let i = 0; i < channels.length; i++) {
  channelsDB.insert(channels[i])
}
