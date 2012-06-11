var OAuth = require('bs-oauth').OAuth,
    util  = require('util'),
    sha1  = require('./app/sha1')

// Twitter urls
var creds   = 'http://twitter.com/account/verify_credentials.json',
    auth    = 'https://api.twitter.com/oauth/authenticate?oauth_token=',
    users   = 'https://api.twitter.com/1/users/search.json?q=',
    message = 'http://api.twitter.com/1/statuses/update.json',
    filter  = 'https://stream.twitter.com/1/statuses/filter.json?track=#AiOIM',
    home_timeline = 'http://api.twitter.com/1/statuses/home_timeline.json?include_entities=true'

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

              tweeters[screen_name].screen_name = screen_name

              // These two values are what we use to interact with Twitter on our user's behalf
              tweeters[screen_name].token  = token
              tweeters[screen_name].secret = secret

              // Where we store old tweets to we don't keep sending them every time
              tweeters[screen_name].messages = [ ]              

              res.redirect('/')
            }
          })
      })
  }
}

function please(verb, url, req, res, cb) {
  var usr = tweeter(req)

  a(req)[verb](url, usr.token, usr.secret,
    function (error, data, response) {
      if (error) res.send(util.inspect(error), 500)
      else {
        if (cb) cb(data)
        else res.send(data)
      }
    })
}

exports.users = {
  search: function(name, req, res) { get(users + name, req, res) }
}

function isAiOIM(tweet) {
  for (var j = 0; j < tweet.entities.hashtags.length; j++)
    if (tweet.entities.hashtags[j].text === 'AiOIM')
      return true

  return false
}

function mentions(usr, tweet) {
  for (var k = 0; k < tweet.entities.user_mentions.length; k++)
    if (tweet.entities.user_mentions[k].screen_name === usr.screen_name)
      return true

  return false
}

function authoredBy(usr, tweet) {
  return tweet.user.screen_name === usr.screen_name
}

exports.statuses = {
  update: function(sts, req, res) { 
    please('post', message + '?status=' + encodeURIComponent(sts), req, res)
  },

  // This will be the initial, non-streaming, polling solution for getting
  // chat messages. It will not scale, however.
  home_timeline: function(req, res) {
    var usr   = tweeter(req)
    var since = typeof usr.most_recent_tweet === 'undefined' ? '' : '&since_id=' + usr.most_recent_tweet

    please('get', home_timeline + since, req, res, function(data) {
      var tweets = JSON.parse(decodeURIComponent(data))

      if (tweets.length > 0) {
        usr.most_recent_tweet = tweets[0].id
        var messages = [ ]

        for (var i = 0; i < tweets.length; i++)
          if (isAiOIM(tweets[i])) {
            var hash = sha1.hash(tweets[i].text)

            if ((mentions(usr, tweets[i]) || authoredBy(usr, tweets[i])))
              if (usr.messages.indexOf(hash) < 0) {
                usr.messages.push(hash)
                messages.push(tweets[i])
              }
          }

        res.send(messages)
      } else
        res.send()
    })
  },

  // This will be the long term, streaming solution to tracking im messages
  filter: function(req, res) {
    var usr   = tweeter(req)

    // #AiOIM is the hashtag aio will use to track chat messages
    a(req).stream(filter, usr.token, usr.secret,
      function (error, data, response) {
        console.log('=======================')
        console.log('streaming data received', data)
        console.log('=======================')
      })
  }
}