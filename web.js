var express = require('express'),
    SiNO    = require('./sino'),
    sha1    = require('./app/sha1'),
    RedisStore = require('connect-redis')(express),
    sys        = require('util'),
    app        = express.createServer(express.logger()),
    hash       = 'Sta8aDaMaphubruhustEbr*pede7UbrePufR9cHU$uwup6U+udU&pekun5sp5@e?',
    http       = require('http')

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
    secret : hash,
    cookie : {
      maxAge : 1209600000,
      path   : '/'
    }}))

  app.set('views', __dirname + '/view')
  app.set('view engine', 'jade')
})

app.get('/', function (req, res) {
  var base = req.headers.host.indexOf('localhost:5000') === 0 ? '/' : 'http://bsgbryan.github.com/AiOIM/app/'
  res.render('aioim', { layout : false , base : base })
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
  console.log('YO')
  SiNO.statuses.update(req, res)
})

app.post('/statuses.retweet/:id', function (req, res) {
  SiNO.statuses.retweet(req.params.id, req, res)
})

app.post('/favorites.create/:id', function (req, res) {
  SiNO.favorites.create(req.params.id, req, res)
})

app.listen(process.env.PORT)