const proxy = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(proxy('/oauth', { target: 'https://localhost:3000/', secure: false }))
}
