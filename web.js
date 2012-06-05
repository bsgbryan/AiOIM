var express = require('express'),
    OAuth   = require('oauth').OAuth,
    sha1    = require('./app/sha1'),
    RedisStore = require('connect-redis')(express),
    sys        = require('util'),
    app        = express.createServer(express.logger())

// Production
if (process.env.REDISTOGO_URL) 
  var redis = require('redis-url').connect(process.env.REDISTOGO_URL)
// Development
else 
  var redis = require('redis').createClient()

var accessToken  = '15730716-UE4BDzg9YlgVacdjFx7pW6MOSK0oOZ8TUtJejXJQP',
    accessSecret = 'MwLGhLYQkJwKKRkDNBHoD6UMl6E64RoFYnd5K0WsJU',
    consumerKey    = 'OqqiFJ8yB8fSa8vMRa9qWQ', // Consumer key
    consumerSecret = 'pyH876yiaROW7JXCoanARBOpL9z0KiYllZW3PZX88OM' // Consumer secret

function oauth() {
  return new OAuth(
    'https://api.twitter.com/oauth/request_token', 
    'https://api.twitter.com/oauth/access_token', 
    consumerKey,
    consumerSecret,
    '1.0', 
    'http://falling-samurai-7438.herokuapp.com/twitter/callback', 
    'HMAC-SHA1')
}

// Twitter urls
var creds   = 'http://twitter.com/account/verify_credentials.json',
    auth    = 'https://api.twitter.com/oauth/authorize?oauth_token=',
    users   = 'https://api.twitter.com/1/users/search.json?q=',
    message = 'http://api.twitter.com/1/statuses/update.json'

app.configure(function() {
  app.use(express.static(__dirname + '/app'))
  app.use(express.bodyParser())
  app.use(express.cookieParser())
  app.use(express.session({ 
    store  : new RedisStore({ client : redis }),
    secret : sha1.hash(new Date().getTime())
  }))

  app.set('views', __dirname + '/jade')
  app.set('view engine', 'jade')
})

app.get('/', function(req, res) {
  res.render('example', { layout : false })
})

app.get('/twitter/signin', function (req, res) {
  oauth().getOAuthRequestToken(function(error, t, s, results) {

    if (error) res.send(error, 500)
    else {
      req.session.token  = t
      req.session.secret = s

      // We can't pass token here, not sure why
      res.redirect(auth + t)    
    }
  })
})

app.get('/twitter/callback', function(req, res) {
  console.log('oauth query verifyer', req.query.oauth_verifier)

  oauth().getOAuthAccessToken(
    req.session.token, 
    req.session.secret, 
    req.query.oauth_verifier,

    function(error, token, secret, results) {
      if (error)
        res.send(error, 500)
      else
        oauth().get(creds, token, secret, 
          function (error, data, response) {
            if (error) res.send(error, 500)
            else {
              res.cookie('twitter_user', JSON.parse(decodeURIComponent(data)).screen_name, { httpOnly: false, path: '/' })
              res.redirect('/')
            }
          })
  })
})

app.get('/twitter/find', function(req, res) {
  oauth().get(users + req.param('name'), accessToken, accessSecret,
    function (error, data, response) {
      if (error) res.send(sys.inspect(error), 500)
      else res.send(data)
    })
})

app.post('/twitter/message', function(req, res) {
  console.log('request body status', req.body.status)
  oauth().post(message + '?status=' + encodeURIComponent(req.body.status), accessToken, accessSecret, null, null,
    function (error, data, response) {
      if (error) res.send(sys.inspect(error), 500)
      else res.send(data)
    })
})

// The port number is passed in via Heroku
var port = process.env.PORT
app.listen(port)