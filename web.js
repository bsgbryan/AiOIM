var express = require('express'),
    OAuth   = require('oauth').OAuth,
    sha1    = require('./app/sha1'),
    secret  = sha1.hash(new Date().getTime())

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
    auth  = 'https://api.twitter.com/oauth/authorize?oauth_token='

app.configure(function() {
  app.use(express.static(__dirname + '/app'))
  app.use(express.cookieParser(secret))
  app.use(express.session({ secret : secret }))

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
      req.session.destination = req.param('final_destination')

      req.session.token  = token
      req.session.secret = secret

      res.redirect(auth + token)    
    }
  })
})

app.get('/twitter/callback', function(req, res) {
  
  oa.getOAuthAccessToken(
    req.session.token, 
    req.session.secret, 
    req.query.oauth_verifier,

    function(error, token, secret, results) {
      if (error)
        res.send(error, 500)
      else
        oa.getProtectedResource(creds, 'GET', token, secret, function (error, data, response) {
          if (error) res.send(error, 500)
          else res.redirect(req.session.destination + '?twitter_profile=' + data)
        })
  })
})

// The port number is passed in via Heroku
var port = process.env.PORT
app.listen(port)