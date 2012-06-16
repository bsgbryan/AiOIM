var express = require('express'),
    SiNO    = require('./sino'),
    sha1    = require('./app/sha1'),
    RedisStore = require('connect-redis')(express),
    sys        = require('util'),
    app        = express.createServer(express.logger()),
    hash       = 'Sta8aDaMaphubruhustEbr*pede7UbrePufR9cHU$uwup6U+udU&pekun5sp5@e?',
    io         = require('socket.io').listen(app),
    sockets    = { },
    http       = require('http'),
    firehoses  = { }

io.configure(function () { 
  io.set('transports', ['xhr-polling'])
  io.set('polling duration', 10)
})
 
io.set('authorization', function (data, accept) {
  if (data.headers.cookie) {
    var cookies = {}
    
    data.headers.cookie.split(';').forEach(function(cookie) {
      var parts = cookie.split('=')
      cookies[parts[0].trim()] = (parts[ 1 ] || '').trim()
    })
    
    data.id = cookies['connect.sid']
  } else
   return accept('No cookie transmitted.', false)

  accept(null, true)
});

// Production
if (process.env.REDISTOGO_URL) 
  var redis = require('redis-url').connect(process.env.REDISTOGO_URL)
// Development
else 
  var redis = require('redis').createClient()

var socket = {
  message: function(data) {
    var socket = sockets[data.entities.user_mentions[0].screen_name]

    if (typeof socket !== 'undefined')
      socket.emit('receive message', data)
  },

  error: function(error, code) {
    console.log('twitter stream error', arguments)
  }
}

function openFirehose(req) {
  console.log('FIREHOSE STATUS', firehoses[req.cookies.aioid])
  if (firehoses[req.cookies.aioid] !== 'open') {
    console.log('OPENING FIREHOSE')
    SiNO.statuses.filter(socket.error, socket.message, req)
    firehoses[req.cookies.aioid] = 'open'
  }
}

function socketFor(user) {
  console.log('SOCKET FOR USER', user, sockets[user])
  if (typeof user !== 'undefined' && typeof sockets[user] === 'undefined')
    sockets[user] = io.of('/aioim/' + user)
  console.log('SOCKET FOR USER', sockets[user])
}

function init(req, res, next) {
  console.log('INIT ARGS', arguments)
  socketFor(req.cookies.aioid)
  openFirehose(req)
  next()
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

  app.set('views', __dirname + '/view')
  app.set('view engine', 'jade')
})

app.get('/aio', function (req, res) { res.redirect('/aioim') })

app.get('/aioim', init, function (req, res) {
  res.render('aioim', { layout : false })
})

app.get('/aioim/quote', function(req, res) {
  http.get({ host: 'www.iheartquotes.com', path: '/api/v1/random?format=json&max_characters=140' }, function (r) {
    var quote = ''
    r.on('data', function(chunk) { quote += chunk  })
    r.on('end',  function()      { res.send(quote) })
  })
})

app.get('/aioim/signin', init, function (req, res) {
  SiNO.token.request(req, res)
})

app.get('/aioim/authorized', function (req, res) {
  SiNO.token.access(req, res)
})

app.get('/aioim/users.search', init, function (req, res) {
  SiNO.users.search(req.param('name'), req, res)
})

app.post('/aioim/statuses.update', init, function (req, res) {
  SiNO.statuses.update(req.body.status, req, res)
})

app.listen(process.env.PORT)