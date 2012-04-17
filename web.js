var express = require('express')

var app = express.createServer(express.logger())

var key = "YOURTWITTERCONSUMERKEY";
var secret = "YOURTWITTERCONSUMERSECRET";

function consumer() {
  return new oauth.OAuth(
    "https://api.twitter.com/1/oauth/request_token", 
    "https://api.twitter.com/1/oauth/access_token", 
    "myQEbQTOpgo3Ql9ylTtg", 
    "du2TORpsR39s0ovo1q0EFmicUlIh2gseufVjnQn5o", 
    "1.0", 
    "http://falling-samurai-7438.herokuapp.com/oauth_callback", 
    "HMAC-SHA1");   
}

app.configure(function() {
  app.use(express.static(__dirname + '/app'))

  //views
  app.set('views', __dirname + '/jade')
  app.set('view engine', 'jade')
})

app.get('/', function(req, res) {
  res.render('example', { layout : false })
})

app.get('/oauth_callback', function(req, res) {
  consumer().getOAuthRequestToken(function(error, oauthToken, oauthTokenSecret, results){
    if (error) {
      res.send("Error getting OAuth request token : " + sys.inspect(error), 500);
    } else {  
      req.session.oauthRequestToken = oauthToken;
      req.session.oauthRequestTokenSecret = oauthTokenSecret;
      res.redirect("https://api.twitter.com/1/oauth/authorize?oauth_token="+req.session.oauthRequestToken);      
    }
  });
})

// The port number is passed in via Heroku
var port = process.env.PORT
app.listen(port)