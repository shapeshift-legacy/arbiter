
module.exports = (obj, keys) => {
  let out = {}
  let inKeys = Object.keys(obj)

  keys.forEach(key => {
    if ( inKeys.includes(key) ) { // only include keys if they exist in the source object
      out[key] = obj[key]
    }
  })

  return out
}
