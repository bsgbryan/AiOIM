(function ($) {
  var container = '#loqui'

  function executeUserSearch(event) {
    $.getJSON('/twitter/find?name=' + $(event.currentTarget).val(), function (u) {
      var users = ''

      u.forEach(function (user) {
        users += '<li class="user">' +
          '<a class="screen name">' + user.screen_name + '</a>' +
          '<span class="human name">' + user.name + '</span>' +
          '</li>'
      })

      $('#loqui .chattable.users').
        html(users).
        on('click', '.user .name', initializeChat)
    })
  }

  function initializeChat(event) {
    $(event.currentTarget).parent().addClass('selected')

    var selected = $('#loqui .chattable.users .selected .screen.name').text()

    $('#loqui .chatting.with').append(
      '<li class="user" data-screen_name="' + selected + '">' +
        '<ol class="messages"></ol>' +
        '<form class="new message">' +
          '<input type="text" name="message">' +
          '<button type="submit">say</button>' +
        '</form>' +
      '</li>')
  }

  function initializeLoqui() {
    $('#loqui').append(
      '<form class="user">' +
      '<input type="text" class="name" placeholder="Twitter name">' +
      '<button type="submit">find</button>' +
      '</form>').

      on('keyup', '.user .search', executeUserSearch)
  }

  $.loqui = function () {
    var loqui = $('#loqui')

    if (loqui.length === 0)
      loqui = $('body').
        append('<div id="loqui"><ol class="chattable users"></ol><ul class="chatting with"></ul></div>').
        find('#loqui')

    if ($.cookie('twitter_profile') === null)
      loqui.append('<a href="/twitter/signin">sign in</button>')
    else
      initializeLoqui()
  }
})(jQuery)