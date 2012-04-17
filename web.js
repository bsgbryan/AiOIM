var express = require('express')

var app = express.createServer(express.logger())

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
  res.redirect('https://api.twitter.com/1/oauth/authenticate?oauth_token=' + req.param('oauth_token'))
})

// The port number is passed in via Heroku
var port = process.env.PORT
app.listen(port)