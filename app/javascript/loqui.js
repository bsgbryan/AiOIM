(function ($) {
  function initiateChatForm() {

  }

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
        loqui.append('<a href="http://falling-samurai-7438.herokuapp.com/twitter/signin?final_destination=' + destination + '">sign in</button>')
    } else {
      var profile = JSON.parse($.cookie('twitter_profile'))

      var friends = $.getJSON('http://api.twitter.com/1/friends/ids.json?screen_name=' + profile.screen_name + '&lang=en&callback=?')

      console.log(friends)

      loqui.append(initiateChatForm())
    }
  }
})(jQuery)