var express = require('express'),
    SiNO    = require('./sino'),
    sha1    = require('./app/sha1'),
    RedisStore = require('connect-redis')(express),
    sys        = require('util'),
    app        = express.createServer(express.logger()),
    hash       = sha1.hash(new Date().getTime())

// Production
if (process.env.REDISTOGO_URL) 
  var redis = require('redis-url').connect(process.env.REDISTOGO_URL)
// Development
else 
  var redis = require('redis').createClient()

var sino = new SiNO()

app.configure(function() {
  app.use(express.static(__dirname + '/app'))
  app.use(express.bodyParser())
  app.use(express.cookieParser(hash))
  app.use(express.session({ 
    store  : new RedisStore({ client : redis }),
    secret : hash
  }))

  app.set('views', __dirname + '/view')
  app.set('view engine', 'jade')
})

app.get('/', function(req, res) {
  res.render('aio', { layout : false })
})

app.get('/twitter/signin', function (req, res) {
  SiNO.token.request(res)
})

app.get('/twitter/callback', function(req, res) {
  SiNO.token.access(req.query.oauth_verifier, res)
})

app.get('/twitter/find', function(req, res) {
  SiNO.user.search(req.param('name'), res)
})

app.post('/twitter/message', function(req, res) {
  SiNO.statuses.update(req.body.status, res)
})

// The port number is passed in via Heroku
var port = process.env.PORT
app.listen(port)