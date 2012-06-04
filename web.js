var express = require('express'),
    OAuth   = require('oauth').OAuth,
    sha1    = require('./app/sha1'),
    secret  = sha1.hash(new Date().getTime()),
    RedisStore = require('connect-redis')(express),
    sys     = require('util')

// Production
if (process.env.REDISTOGO_URL) 
  var redis = require('redis-url').connect(process.env.REDISTOGO_URL)
// Development
else 
  var redis = require('redis').createClient()

var app    = express.createServer(express.logger()),
    token  = '15730716-duRZBRPjYSREfDTUYmBTwEswetUKrF2CHSSpQ0C7k',
    secret = 'yLMRJbPrFBacALxTEj9c9ZtVZFiWUjoNfleKtEsaM',
    key    = 'IYIAlnMPH17qPp6gV8QcA', // Consumer key
    privat = 'pDfVmCh9J9xJ42ZlYODEUrJhplU1Rfj7YxLcXzT0' // Consumer secret

var accessToken  = '',
    accessSecret = ''

function oauth() {
  return new OAuth(
    'https://api.twitter.com/oauth/request_token', 
    'https://api.twitter.com/oauth/access_token', 
    key,
    privat,
    '1.0', 
    'http://falling-samurai-7438.herokuapp.com/twitter/callback', 
    'HMAC-SHA1')
}

// Twitter urls
var creds   = 'http://twitter.com/account/verify_credentials.json',
    auth    = 'https://api.twitter.com/oauth/authorize?oauth_token=',
    users   = 'https://api.twitter.com/1/users/search.json?q=',
    message = 'https://api.twitter.com/1/statuses/update.json'

app.configure(function() {
  app.use(express.static(__dirname + '/app'))
  app.use(express.bodyParser())
  app.use(express.cookieParser())
  app.use(express.session({ 
    store  : new RedisStore({ client : redis }),
    secret : secret
  }))

  //views
  app.set('views', __dirname + '/jade')
  app.set('view engine', 'jade')
})

app.get('/', function(req, res) {
  res.render('example', { layout : false })
})

app.get('/twitter/signin', function (req, res) {
  oauth().getOAuthRequestToken(function(error, token, secret, results) {

    if (error) res.send(error, 500)
    else {
      req.session.token  = token
      req.session.secret = secret

      res.redirect(auth + token)    
    }
  })
})

app.get('/twitter/callback', function(req, res) {

  oauth().getOAuthAccessToken(
    req.session.token, 
    req.session.secret, 
    req.query.oauth_verifier,

    function(error, t, s, results) {
      req.session.accessToken  = t
      req.session.accessSecret = s
      if (error)
        res.send(error, 500)
      else
        oauth().get(creds, t, s, 
          function (error, data, response) {
            if (error) res.send(error, 500)
            else {
              // res.cookie('twitter_profile', data, { httpOnly: false, path: '/' })
              res.redirect('/')
            }
          })
  })
})

app.get('/twitter/find', function(req, res) {
  oauth().get(users + req.param('name'), token, secret,
    function (error, data, response) {
      if (error) res.send(sys.inspect(error), 500)
      else res.send(data)
    })
})

app.post('/twitter/message', function(req, res) {
  console.log('access token', req.session.accessToken)
  console.log('access secret', req.session.accessSecret)

  oauth().post(message, req.session.accessToken, req.session.accessSecret, 'status=' + req.param('message'), function (error, data, response) {
    if (error) res.send(sys.inspect(error), 500)
    else res.send(data)
  })
})

// The port number is passed in via Heroku
var port = process.env.PORT
app.listen(port)