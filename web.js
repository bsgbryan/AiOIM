var express = require('express'),
    SiNO    = require('./sino'),
    sha1    = require('./app/sha1'),
    RedisStore = require('connect-redis')(express),
    sys        = require('util'),
    app        = express.createServer(express.logger()),
    hash       = 'Sta8aDaMaphubruhustEbr*pede7UbrePufR9cHU$uwup6U+udU&pekun5sp5@e?',
    io         = require('socket.io').listen(app),
    http       = require('http'),
    sockets    = { },
    users      = { }

io.configure(function () { 
  io.enable('browser client minification')
  io.enable('browser client etag')
  io.enable('browser client gzip')
  io.set('log level', 1)
  io.set('transports', ['xhr-polling'])
  io.set('polling duration', 10)
})

io.of('/aioim').
  on('connection', function (socket) {
    // We are linking users to sessions via the socket.handshake.sessionID,
    // which is identical to the connect.sid (connect session id)
    var user      = users[socket.handshake.sessionID]
    sockets[user] = socket

    socket.emit('statuses filter')
  })
 
io.set('authorization', function (data, accept) {
  if (data.headers.cookie) {
    var cookies = {}
    
    data.headers.cookie.split(';').forEach(function(cookie) {
      var parts                = cookie.split('=')
      cookies[parts[0].trim()] = (parts[ 1 ] || '').trim()
    })
    
    // We're assigning our handshake session id to the connect session id
    // and mapping the session id to our user so we can later assign the
    // socket resulting from this handshake to our user
    data.sessionID        = cookies['connect.sid']
    users[data.sessionID] = cookies['AiOID']
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
    // Here we pull out the socket we assigned to our user to send them a message
    var user = data.entities.user_mentions[0].screen_name
    sockets[user].emit('receive message', data)
  },

  error: function(error, code) {
    console.log('twitter stream error "%s", "%s"', error, code)
  }
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

app.get('/', function (req, res) {
  res.render('aioim', { layout : false })
})

app.get('/iheartquotes', function(req, res) {
  http.get({ host: 'www.iheartquotes.com', path: '/api/v1/random?format=json&max_characters=140' }, function (r) {
    var quote = ''
    r.on('data', function(chunk) { quote += chunk  })
    r.on('end',  function()      { res.send(quote) })
  })
})

app.get('/signin', function (req, res) {
  SiNO.token.request(req, res)
})

app.get('/authorized', function (req, res) {
  SiNO.token.access(req, res)
})

app.get('/users.search', function (req, res) {
  SiNO.users.search(req.param('name'), req, res)
})

app.post('/statuses.update', function (req, res) {
  SiNO.statuses.update(req.body, req, res)
})

app.post('/statuses.retweet/:id', function (req, res) {
  SiNO.statuses.retweet(req.params.id, req, res)
})

app.post('/favorites.create/:id', function (req, res) {
  SiNO.favorites.create(req.params.id, req, res)
})

app.get('/statuses.filter', function (req, res) {
  SiNO.statuses.filter(sock, req)
  res.send()
})

app.listen(process.env.PORT)