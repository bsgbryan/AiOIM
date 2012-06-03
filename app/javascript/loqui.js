(function ($) {
  $.loqui = function (client, element) {
    var destination = typeof client === 'undefined' ? window.location : client,
        container   = typeof element === 'undefined' ? 'loqui' : element,
        loqui       = $('#' + container)

    if (loqui.length === 0)
      loqui = $('body').
        append('<div id="' + container + '"></div>').
        find('#' + container)

    if ($.cookie('twitter_profile') === null) {
      var url = 'http://falling-samurai-7438.herokuapp.com/twitter/signin?final_destination=' + destination,
          profile

      if (location.hash.indexOf('#twitter_profile=') === 0) {
        $.cookie('twitter_profile', location.hash.substring(17))
        location.hash = ''
      }

      loqui.append('<a href="' + url + '">sign in</button>')
    } else {
      var profile = JSON.parse($.cookie('twitter_profile'))

      console.log('logged in as', profile.screen_name)
    }
  }
})(jQuery)