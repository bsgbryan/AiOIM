var OAuth = require('oauth').OAuth,
    util  = require('util')

// Twitter urls
var creds   = 'http://twitter.com/account/verify_credentials.json',
    auth    = 'https://api.twitter.com/oauth/authorize?oauth_token=',
    users   = 'https://api.twitter.com/1/users/search.json?q=',
    message = 'http://api.twitter.com/1/statuses/update.json'

var oauth = new OAuth(
  'https://api.twitter.com/oauth/request_token', 
  'https://api.twitter.com/oauth/access_token', 
  process.env.TwitterConsumerKey,
  process.env.TwitterConsumerSecret,
  '1.0', 
  process.env.TwitterOAuthCallback, 
  'HMAC-SHA1')

var tok = '',
    sec = ''

exports.token = { 
  request: function(res) {
    oauth.getOAuthRequestToken(function(err, t, s, results) {

      if (err) res.send(util.inspect(err), 500)
      else {
        tok  = t
        sec = s

        res.redirect(auth + t)    
      }
    })
  },
  access: function(oauth_verifier, res) {

    oauth.getOAuthAccessToken(tok, sec, oauth_verifier,

      function(err, token, secret, results) {
        if (err) res.send(util.inspect(err), 500)
        else
          oauth.get(creds, token, secret, function (error, data, response) {
            if (error) res.send(util.inspect(error), 500)
            else {
              res.cookie('twitter_user', JSON.parse(decodeURIComponent(data)).screen_name, { httpOnly: false, path: '/' })
              res.redirect('/')
            }
          })
      })
  }
}

exports.user = {
  search: function(name, res) {
    oauth.get(users + name, process.env.TwitterAccessToken, process.env.TwitterAccessTokenSecret,
    function (error, data, response) {
      if (error) res.send(util.inspect(error), 500)
      else res.send(data)
    })
  }
}

exports.statuses = {
  update: function(status, res) {
    // I have to pass the status parameter in the query string. Not sure why, but Twitter demands it.
    oauth.post(message + '?status=' + encodeURIComponent(status), process.env.TwitterAccessToken, process.env.TwitterAccessTokenSecret, null, null,
      function (error, data, response) {
        if (error) res.send(util.inspect(error), 500)
        else res.send(data)
      })
  }
}