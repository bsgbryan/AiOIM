$(document).ready(function () {
  var loqui = $('#loqui')

  if (loqui.length === 0) {
    $(document).append('<div id="loqui"></div>')
    loqui = $('#loqui')
  }
  
  loqui.
    append('<button class="sign in">sign in</button>').
    on('click', '.sign.in', function (event) {
      $.get('http://falling-samurai-7438.herokuapp.com/twitter/signin', function (data) {
        console.log(data)
      })
    })
})