(function ($) {
  function initializeChatClient() {
    var profile = JSON.parse($.cookie('twitter_profile')),
        search  = 'http://api.twitter.com/1/friends/ids.json?screen_name=' + profile.screen_name + '&lang=en&callback=?',
        friends

    $.getJSON(search, function (data) {
      friends = data.friends

      $('#loqui').append(
        '<form id="loqui-user-finder">' +
        '<input type="text" id="loqui-twitter-user-name" placeholder="Twitter name">' +
        '<button type="submit">find</button>' +
        '</form>').

        on('keyup', '#loqui-twitter-user-name', function (event) {
          var val        = $('#loqui-twitter-user-name').val(),
              userSearch = 'http://api.twitter.com/1/users/search.json?q=' + val + '&lang=en&callback=?'

          $.getJSON(userSearch, function (users) {
            console.log(users)
          })
        })
    })
  }

  var signinUrl = 'http://falling-samurai-7438.herokuapp.com/twitter/signin'

  $.loqui = function (client, element) {
    var destination = typeof client === 'undefined' ? window.location : client,
        container   = typeof element === 'undefined' ? 'loqui' : element,
        loqui       = $('#' + container)

    if (loqui.length === 0)
      loqui = $('body').
        append('<div id="' + container + '"></div>').
        find('#' + container)

    if ($.cookie('twitter_profile') === null) {
      if (location.hash.indexOf('#twitter_profile=') === 0) {
        $.cookie('twitter_profile', location.hash.substring(17))
        location.hash = ''
      } else
        loqui.append('<a href="' + signinUrl + '?final_destination=' + destination + '">sign in</button>')
    } else
      loqui.append(initializeChatClient())
  }
})(jQuery)