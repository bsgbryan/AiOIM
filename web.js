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
  oa.getOAuthRequestToken(function(error, oauthToken, oauthTokenSecret, results){
    if (error) {
      console.log('error', error)
      res.send('Error getting OAuth request token : ' + error, 500);
    } else {  
      req.session.oauthRequestToken = oauthToken;
      req.session.oauthRequestTokenSecret = oauthTokenSecret;
      res.redirect('https://api.twitter.com/oauth/authorize?oauth_token=' + req.session.oauthRequestToken);      
    }
  })
})

app.get('/twitter/callback', function(req, res) {
  oa.getOAuthAccessToken(req.session.oauthRequestToken, req.session.oauthRequestTokenSecret, req.query.oauth_verifier, function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
    if (error) {
      res.send('Error getting OAuth access token : ' + sys.inspect(error) + '['+oauthAccessToken+']'+ '['+oauthAccessTokenSecret+']'+ '['+sys.inspect(results)+']', 500)
    } else {
      req.session.oauthAccessToken = oauthAccessToken
      req.session.oauthAccessTokenSecret = oauthAccessTokenSecret
      // Right here is where we would write out some nice user stuff
      oa.getProtectedResource('http://twitter.com/account/verify_credentials.json', 'GET', req.session.oauthAccessToken, req.session.oauthAccessTokenSecret, function (error, data, response) {
        if (error) {
          res.send('Error getting twitter screen name : ' + sys.inspect(error), 500)
        } else {
          req.session.twitterScreenName = data['screen_name']
          res.send('data: ' + JSON.parse(data).screen_name)
          // console.log('response', )
        }  
      });  
    }
  });
})

// The port number is passed in via Heroku
var port = process.env.PORT
app.listen(port)