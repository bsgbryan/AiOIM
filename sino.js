var OAuth = require('bs-oauth').OAuth,
    util  = require('util'),
    sha1  = require('./app/sha1'),
    http  = require('http'),
    qString = require('querystring')

// Twitter urls
var creds   = 'http://twitter.com/account/verify_credentials.json',
    auth    = 'https://api.twitter.com/oauth/authenticate?oauth_token=',
    users   = 'https://api.twitter.com/1/users/search.json?q=',
    message = 'http://api.twitter.com/1/statuses/update.json',
    filter  = 'https://stream.twitter.com/1/statuses/filter.json?track=#AiOIM'

var oauth = new OAuth(
  'https://api.twitter.com/oauth/request_token', 
  'https://api.twitter.com/oauth/access_token', 
  process.env.TwitterConsumerKey,
  process.env.TwitterConsumerSecret,
  '1.0', 
  process.env.TwitterOAuthCallback, 
  'HMAC-SHA1')

function twitter(req) {
  return require('ntwitter')({
    consumer_key: process.env.TwitterConsumerKey,
    consumer_secret: process.env.TwitterConsumerSecret,
    access_token_key: req.session.accessToken,
    access_token_secret: req.session.accessSecret
  })
}

exports.token = { 
  request: function(req, res) {
    oauth.getOAuthRequestToken(function (err, t, s, results) {

      if (err) res.send(util.inspect(err), 500)
      else {
        req.session.token  = t
        req.session.secret = s

        req.session.whenAuthenticatedRedirectTo = req.header('Referer')

        res.redirect(auth + t)    
      }
    })
  },

  access: function(req, res) {
    oauth.getOAuthAccessToken(req.session.token, req.session.secret, req.query.oauth_verifier,
      function (err, token, secret, results) {
        
        if (err) res.send(util.inspect(err), 500)
        else
          oauth.get(creds, token, secret, function (error, data, response) {
            if (error) res.send(util.inspect(error), 500)
            else {
              var screen_name = JSON.parse(decodeURIComponent(data)).screen_name;

              res.cookie('AiOID', screen_name, { httpOnly: false, path: '/' })

              // These two values are what we use to interact with Twitter on our user's behalf
              req.session.accessToken  = token
              req.session.accessSecret = secret

              res.redirect(req.session.whenAuthenticatedRedirectTo + '?AiOID=' + screen_name)
              // res.redirect('/')
            }
          })
      })
  }
}

function please(verb, url, req, res, cb) {
  oauth[verb](url, req.session.accessToken, req.session.accessSecret,
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

exports.favorites = {
  create: function(id, req, res) {
    twitter(req).favoriteStatus(id, function (err, data) {
      if (err) res.send(err, 500)
      else res.send(data)
    })
  }
}

// We delete ids becuase we can only ever use *_id_str properties anyway
function deleteIDs(data) {
  for (var prop in data)
    if (data[prop] instanceof Object)
      deleteIDs(data[prop])
    else if (data[prop] instanceof Array)
      for (var i = 0; i < data[prop].lenth; i++)
        deleteIDs(data[prop][i])
    else if (prop === 'id')
      delete data[prop]

  return data
}

function sanitize(thing) {
  return decodeURIComponent(thing).replace(/\W/g, '-')
}

exports.statuses = {
  update: function(params, req, res) {
    twitter(req).updateStatus(params.status, { in_reply_to_status_id: params.in_reply_to_status_id }, function (err, data) {
      if (err) res.send(err, 500)
      else  {
        var referer = sanitize(req.header('Referer').split('//')[1].split('?')[0]),
            reqSess = req.param('session'),
            session = typeof reqSess === 'string' ? sanitize(reqSess) : req.param('from') + '-' + req.param('to')

        console.log('REQSESS', reqSess)
        console.log('SESSION', session)

        var options = {
              host: 'gamma.firebase.com',
              port: 80,
              path: '/bsgbryan/aioim/' + referer + session + '.json',
              method: 'POST'
            },
            
            post = http.request(options, function (resp) {
              resp.on('end',   function()   { res.send()       })
              resp.on('error', function (e) { res.send(e, 500) })
            })

        post.write(JSON.stringify(deleteIDs(data)))
        post.end()
      }
    })
  },

  retweet: function(id, req, res) {
    twitter(req).retweetStatus(id, function (err, data) {
      if (err) res.send(err, 500)
      else res.send(data)
    })
  }
}