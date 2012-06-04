(function ($) {
  function initializeChatClient() {
    var profile = JSON.parse($.cookie('twitter_profile'))

    $('#loqui').append(
      '<form id="loqui-user-finder">' +
      '<input type="text" id="loqui-twitter-user-name" placeholder="Twitter name">' +
      '<button type="submit">find</button>' +
      '</form>').

      on('keyup', '#loqui-twitter-user-name', function (event) {
        var val        = $('#loqui-twitter-user-name').val(),
            userSearch = 'http://falling-samurai-7438.herokuapp.com/twitter/find?username=' + val

        $.getJSON(userSearch, function (users) {
          console.log(users)
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