
module.exports = function(length){
  return new Promise((resolve, reject) => {
    setTimeout(resolve,length*1000)
  })
}
