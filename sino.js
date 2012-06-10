var OAuth = require('oauth').OAuth,
    util  = require('util')

// Twitter urls
var creds   = 'http://twitter.com/account/verify_credentials.json',
    auth    = 'https://api.twitter.com/oauth/authenticate?oauth_token=',
    users   = 'https://api.twitter.com/1/users/search.json?q=',
    message = 'http://api.twitter.com/1/statuses/update.json',
    filter  = 'https://stream.twitter.com/1/statuses/filter.json',
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
        console.log('authorization results', results)

        if (err) res.send(util.inspect(err), 500)
        else
          myauth.get(creds, token, secret, function (error, data, response) {
            if (error) res.send(util.inspect(error), 500)
            else {
              var screen_name = JSON.parse(decodeURIComponent(data)).screen_name;

              res.cookie('AiOID', screen_name, { httpOnly: false, path: '/' })

              tweeters[screen_name] = { auth: myauth }

              tweeters[screen_name].screen_name = screen_name

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
        else res.send(data)
      }
    })
}

exports.users = {
  search: function(name, req, res) { get(users + name, req, res) }
}

exports.statuses = {
  update: function(sts, req, res) { 
    post(message + '?status=' + encodeURIComponent(sts), req, res)
  },

  // This will be the initial, non-streaming, polling solution for getting
  // chat messages. It will not scale, however.
  home_timeline: function(req, res) {
    var usr   = tweeter(req)
    var last  = usr.most_recent_tweet
    var since = typeof last === 'undefined' ? '' : '&since_id=' + last

    get(home_timeline + since, req, res, function(data) {

      var tweets = JSON.parse(decodeURIComponent(data))

      if (tweets.length > 0) {
        usr.most_recent_tweet = tweets[0].id
        var messages = [ ]

        for (var i = 0; i < tweets.length; i++) {
          var e = tweets[i].entities,
              h = false, 
              u = false

          for (var j = 0; j < e.hashtags.length; j++)
            if (e.hashtags[j].text === 'AiOIM') {
              h = true
              break
            }

          for (var k = 0; k < e.user_mentions.length; k++)
            if (e.user_mentions[k].screen_name === usr.screen_name) {
              u = true
              break
            }

          if (h === true && u === true)
            messages.push(tweets[i])
        }

        res.send(messages)
      } else
        res.send()
    })
  },

  // This will be the long term, streaming solution to tracking im messages
  filter: function(req, res) {
    // #AiOIM is the hashtag aio will use to track chat messages
    a(req).post(filter + '?track=#AiOIM', process.env.TwitterAccessToken, process.env.TwitterAccessTokenSecret, null, null,
      function (error, data, response) {
        // TODO add streaming support to node-oauth so I can implement this
      })
  }
}