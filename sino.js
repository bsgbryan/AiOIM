var OAuth = require('oauth').OAuth,
    util  = require('util')

// Twitter urls
var creds   = 'http://twitter.com/account/verify_credentials.json',
    auth    = 'https://api.twitter.com/oauth/authorize?oauth_token=',
    users   = 'https://api.twitter.com/1/users/search.json?q=',
    message = 'http://api.twitter.com/1/statuses/update.json',
    filter  = 'https://stream.twitter.com/1/statuses/filter.json',
    home_timeline = 'http://api.twitter.com/1/statuses/home_timeline.json'

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

              res.redirect('/')
            }
          })
      })
  }
}

function post(url, req, res) {
  a(req).post(url, process.env.TwitterAccessToken, process.env.TwitterAccessTokenSecret, null, null,
    function (error, data, response) {
      if (error) res.send(util.inspect(error), 500)
      else res.send(data)
    })
}

function get(url, req, res, cb) {
  a(req).get(url, process.env.TwitterAccessToken, process.env.TwitterAccessTokenSecret,
    function (error, data, response) {
      if (error) res.send(util.inspect(error), 500)
      else {
        if (cb) cb(data)
        res.send(data)
      }
    })
}

exports.users = {
  search: function(name, req, res) { get(users + name, req, res) }
}

exports.statuses = {
  update: function(sts, res) { 
    post(message + '?status=' + encodeURIComponent(sts), req, res)
  },
  home_timeline: function(req, res) {
    var tweeter = tweeter(req)
    var last    = tweeter.most_recent_tweet

    get(home_timeline + '?since_id=' + last, req, res, function(tweets) {
      tweeter.most_recent_tweet = tweets[0].id
    })
  },
  filter: function(req, res) {
    // #AiOIM is the hashtag aio will use to track chat messages
    a(req).post(filter + '?track=#AiOIM', process.env.TwitterAccessToken, process.env.TwitterAccessTokenSecret, null, null,
      function (error, data, response) {
        // TODO add streaming support to node-oauth so I can implement this
      })
  }
}