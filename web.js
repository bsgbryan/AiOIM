var express = require('express'),
    SiNO    = require('./sino'),
    sha1    = require('./app/sha1'),
    RedisStore = require('connect-redis')(express),
    sys        = require('util'),
    app        = express.createServer(express.logger()),
    hash       = 'Sta8aDaMaphubruhustEbr*pede7UbrePufR9cHU$uwup6U+udU&pekun5sp5@e?',
    io         = require('socket.io').listen(app),
    sockets    = { },
    http       = require('http')

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

function sockets(req) {
  if (typeof req.cookies.aioid !== 'undefined' && typeof sockets[req.cookies.aioid] === 'undefined')
    sockets[req.cookies.aioid] = io.of('/aioim/' + req.cookies.aioid)
}

app.configure(function() {
  app.use(express.static(__dirname + '/app'))
  app.use(express.bodyParser())
  app.use(express.cookieParser(hash))
  app.use(express.session({ 
    store  : new RedisStore({ client : redis }),
    secret : hash,
    cookie : {
      maxAge : 1209600000,
      path   : '/'
    }}))
  app.use(sockets)

  app.set('views', __dirname + '/view')
  app.set('view engine', 'jade')
})

app.get('/aio', function (req, res) { res.redirect('/aioim') })

app.get('/aioim', function (req, res) {
  res.render('aioim', { layout : false })
})

app.get('/aioim/quote', function(req, res) {
  http.get({ host: 'www.iheartquotes.com', path: '/api/v1/random?format=json&max_characters=140' }, function (r) {
    var quote = ''
    r.on('data', function(chunk) { quote += chunk  })
    r.on('end',  function()      { res.send(quote) })
  })
})

app.get('/aioim/signin', function (req, res) {
  SiNO.token.request(req, res)
})

app.get('/aioim/authorized', function (req, res) {
  SiNO.token.access(req, res)
})

app.get('/aioim/users.search', function (req, res) {
  SiNO.users.search(req.param('name'), req, res)
})

app.post('/aioim/statuses.update', function (req, res) {
  SiNO.statuses.update(req.body.status, req, res)
})

// This is an admin function. It only needs to be called once - immediatly after the server starts
app.get('/aioim/statuses.filter', function (req, res) {
  var error = function(error, code) {
    console.log('twitter stream error', arguments)
  }

  var data = function(data) {
    var socket = sockets[data.entities.user_mentions[0].screen_name]

    if (typeof socket !== 'undefined')
      socket.emit('receive message', data)
  }

  SiNO.statuses.filter(error, data, req)

  res.redirect('/aioim')
})

// The port number is passed in via Heroku
var port = process.env.PORT
app.listen(port)