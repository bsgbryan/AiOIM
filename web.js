var express = require('express'),
    SiNO    = require('./sino'),
    sha1    = require('./app/sha1'),
    RedisStore = require('connect-redis')(express),
    sys        = require('util'),
    app        = express.createServer(express.logger()),
    hash       = sha1.hash(new Date().getTime()),
    io         = require('socket.io').listen(app),
    sockets    = { }

io.configure(function () { 
  io.set('transports', ['xhr-polling']); 
  io.set('polling duration', 10); 
});

// Production
if (process.env.REDISTOGO_URL) 
  var redis = require('redis-url').connect(process.env.REDISTOGO_URL)
// Development
else 
  var redis = require('redis').createClient()

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

app.get('/aio', function (req, res) {
  if (typeof req.cookies.aioid !== 'undefined') {
    var u = req.cookies.aioid

    sockets[u] = io.
      of('/' + u).
      on('send message', function (message) {
        var tweet = '@' + message.to + ' ' + message.content + ' #AiOIM'

        SiNO.statuses.update(tweet)
      })
  }

  res.render('aio', { layout : false })
})

app.get('/aio/signin', function (req, res) {
  SiNO.token.request(req, res)
})

app.get('/aio/authorized', function (req, res) {
  SiNO.token.access(req, res)
})

app.get('/aio/users.search', function (req, res) {
  SiNO.users.search(req.param('name'), req, res)
})

app.post('/aio/statuses.update', function (req, res) {
  SiNO.statuses.update(req.body.status, req, res)
})

app.get('/aio/statuses.home_timeline', function (req, res) {
  SiNO.statuses.home_timeline(req, res)
})

// TODO Add streaming support to node-oauth so I can do this
app.get('/aio/statuses.filter', function (req, res) {
  var error = function(error, code) {
    console.log('twitter stream error', arguments)
  }

  var data = function(data) {
    console.log('twitter stream data', data.user.name)
  }

  SiNO.statuses.filter(error, data, req)
})

// The port number is passed in via Heroku
var port = process.env.PORT
app.listen(port)