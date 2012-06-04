var express = require('express'),
    OAuth   = require('oauth').OAuth,
    sha1    = require('./app/sha1'),
    secret  = sha1.hash(new Date().getTime()),
    RedisStore = require('connect-redis')(express)

// Production
if (process.env.REDISTOGO_URL) 
  var redis = require('redis-url').connect(process.env.REDISTOGO_URL)
// Development
else 
  var redis = require('redis').createClient()

var app = express.createServer(express.logger()),
    oa  = new OAuth(
      'https://api.twitter.com/oauth/request_token', 
      'https://api.twitter.com/oauth/access_token', 
      'myQEbQTOpgo3Ql9ylTtg', 
      'du2TORpsR39s0ovo1q0EFmicUlIh2gseufVjnQn5o', 
      '1.0', 
      'http://falling-samurai-7438.herokuapp.com/twitter/callback', 
      'HMAC-SHA1')

// Twitter urls
var creds = 'http://twitter.com/account/verify_credentials.json',
    auth  = 'https://api.twitter.com/oauth/authorize?oauth_token=',
    users = 'https://api.twitter.com/1/users/search.json?q='

app.configure(function() {
  app.use(express.static(__dirname + '/app'))
  app.use(express.bodyParser())
  app.use(express.cookieParser())
  app.use(express.session({ 
    store  : new RedisStore({ client : redis }), 
    // key    : 'bryan is awesome',
    secret : secret,
    cookie : {
      path     : '/', 
      httpOnly : true, 
      maxAge   : null 
    }
  }))

  //views
  app.set('views', __dirname + '/jade')
  app.set('view engine', 'jade')
})

app.get('/', function(req, res) {
  res.render('example', { layout : false })
})

app.get('/twitter/signin', function (req, res) {
  oa.getOAuthRequestToken(function(error, token, secret, results) {

    if (error) res.send(error, 500)
    else {
      req.session.token  = token
      req.session.secret = secret

      res.redirect(auth + token)    
    }
  })
})

app.get('/twitter/callback', function(req, res) {
  
  console.log('callback oauth token', req.session.token)
  console.log('callback oauth secret', req.session.secret)

  oa.getOAuthAccessToken(
    req.session.token, 
    req.session.secret, 
    req.query.oauth_verifier,

    function(error, token, secret, results) {
      if (error)
        res.send(error, 500)
      else
        oa.getProtectedResource(creds, 'GET', 
          token, 
          secret, 
          function (error, data, response) {
            if (error) res.send(error, 500)
            else {
              res.cookie('twitter_profile', JSON.parse(decodeURIComponent(data)))
              res.redirect('/')
            }
          })
  })
})

app.get('/twitter/find', function(req, res) {
  console.log('find oauth token', req.session.token)
  console.log('find oauth secret', req.session.secret)

  oa.getProtectedResource(users + req.param('username'), 'GET',
    req.session.token,
    req.session.secret,

    function (error, data, response) {
      if (error) res.send(error, 500)
      else res.send(data)
    })
})

// The port number is passed in via Heroku
var port = process.env.PORT
app.listen(port)