$(document).ready(function () {
  var loqui = $('#loqui'),
      url   = 'http://falling-samurai-7438.herokuapp.com/twitter/signin?final_destination=' + window.location

  if (loqui.length === 0)
    loqui = $('body').
      append('<div id="loqui"></div>').
      find('#loqui')

  loqui.append('<a href="' + url + '">sign in</button>')
})