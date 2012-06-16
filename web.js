var express = require('express'),
    SiNO    = require('./sino'),
    sha1    = require('./app/sha1'),
    RedisStore = require('connect-redis')(express),
    sys        = require('util'),
    app        = express.createServer(express.logger()),
    hash       = 'Sta8aDaMaphubruhustEbr*pede7UbrePufR9cHU$uwup6U+udU&pekun5sp5@e?',
    io         = require('socket.io').listen(app),
    http       = require('http'),
    firehoses  = { },
    sockets    = { }

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
    
    data.id   = cookies['connect.sid']
    data.user = cookies['AiOID']
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

var sock = {
  message: function(data) {
    console.log('DATA FOR ', 
      data.entities.user_mentions[0].screen_name, 
      sockets[data.entities.user_mentions[0].screen_name])

    sockets[data.entities.user_mentions[0].screen_name].send(data)
  },

  error: function(error, code) {
    console.log('twitter stream error "%s", "%s"', error, code)
  }
}

function init(req, res, next) {
  if (typeof sockets[req.cookies.aioid] === 'undefined')
    io.of('/aioim/' + req.cookies.aioid).
      on('connection', function (socket) {
        sockets[req.cookies.aioid] = socket
      })

  if (firehoses[req.cookies.aioid] !== 'open') {
    SiNO.statuses.filter(sock, req)
    firehoses[req.cookies.aioid] = 'open'
  }

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

app.get('/aioim/signin', function (req, res) {
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