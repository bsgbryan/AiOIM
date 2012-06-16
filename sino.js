var OAuth = require('bs-oauth').OAuth,
    util  = require('util'),
    sha1  = require('./app/sha1')

// Twitter urls
var creds   = 'http://twitter.com/account/verify_credentials.json',
    auth    = 'https://api.twitter.com/oauth/authenticate?oauth_token=',
    users   = 'https://api.twitter.com/1/users/search.json?q=',
    message = 'http://api.twitter.com/1/statuses/update.json',
    filter  = 'https://stream.twitter.com/1/statuses/filter.json?track=#AiOIM'

var tweeters = { }

function oauth() {
  return new OAuth(
    'https://api.twitter.com/oauth/request_token', 
    'https://api.twitter.com/oauth/access_token', 
    process.env.TwitterConsumerKey,
    process.env.TwitterConsumerSecret,
    '1.0', 
    process.env.TwitterOAuthCallback, 
    'HMAC-SHA1')
}

function tweeter(req) {
  return tweeters[req.cookies.aioid]
}

function a(req) {
  return tweeter(req).auth
}

exports.token = { 
  request: function(req, res) {
    oauth().getOAuthRequestToken(function (err, t, s, results) {

      if (err) res.send(util.inspect(err), 500)
      else {
        req.session.token  = t
        req.session.secret = s 

        res.redirect(auth + t)
      }
    })
  },
  access: function(req, res) {
    var myauth = oauth()

    myauth.getOAuthAccessToken(req.session.token, req.session.secret, req.query.oauth_verifier,
      function (err, token, secret, results) {
        
        if (err) res.send(util.inspect(err), 500)
        else
          myauth.get(creds, token, secret, function (error, data, response) {
            if (error) res.send(util.inspect(error), 500)
            else {
              var screen_name = JSON.parse(decodeURIComponent(data)).screen_name;

              res.cookie('AiOID', screen_name, { httpOnly: false, path: '/' })

              tweeters[screen_name] = { auth: myauth }

              // These two values are what we use to interact with Twitter on our user's behalf
              req.session.token  = token
              req.session.secret = secret

              // Where we store old tweets to we don't keep sending them every time
              tweeters[screen_name].messages = [ ]              

              res.redirect('/aioim')
            }
          })
      })
  }
}

function please(verb, url, req, res, cb) {
  var usr = tweeter(req)

  console.log('SESSION TOKEN', req.session.token)
  console.log('SESSION SECRET', req.session.secret)

  a(req)[verb](url, req.session.token, req.session.secret,
    function (error, data, response) {
      if (error) res.send(util.inspect(error), 500)
      else {
        if (cb) cb(data)
        else res.send(data)
      }
    })
}

exports.users = {
  search: function(name, req, res) { please('get', users + name, req, res) }
}

exports.statuses = {
  update: function(sts, req, res) { 
    please('post', message + '?status=' + encodeURIComponent(sts), req, res)
  },

  filter: function(error, data, req) {
    var twitter = require('ntwitter'),
        usr     = tweeter(req)

    new twitter({
      consumer_key: process.env.TwitterConsumerKey,
      consumer_secret: process.env.TwitterConsumerSecret,
      access_token_key: req.session.token,
      access_token_secret: req.session.secret
    }).stream('statuses/filter', { track : [ 'AiOIM', 'aioim' ] }, function(stream) {
      stream.on('data', data)
      stream.on('error', error)
    })
  }
}