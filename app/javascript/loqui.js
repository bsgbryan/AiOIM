$(document).ready(function () {
  var loqui = $('#loqui'),
      url   = 'http://falling-samurai-7438.herokuapp.com/twitter/signin?final_destination=' + window.location
      profile
  if (loqui.length === 0)
    loqui = $('body').
      append('<div id="loqui"></div>').
      find('#loqui')

  if (location.search.indexOf('?twitter_profile=') === 0)
    profile = JSON.parse(location.search.substring(17))

  console.log(profile)
  
  loqui.append('<a href="' + url + '">sign in</button>')
})