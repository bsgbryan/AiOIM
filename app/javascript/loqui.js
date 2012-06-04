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

      $('#loqui .chattable.users').html(users)
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

  $.loqui = function () {
    $('body').
      append('<div id="loqui">' +
        '<a class="sign in hidden" href="/twitter/signin">sign in</a>' +
        '<ol class="chattable users hidden"></ol>' +
        '<ul class="chatting with hidden"></ul>' +
        '<form class="user hidden">' +
          '<input type="text" class="name search" placeholder="Twitter name">' +
          '<button type="submit">find</button>' +
        '</form>' +
      '</div>')

    if ($.cookie('twitter_profile') === null)
      $('#loqui .sign.in').addClass('active')
    else
      $('#loqui form.user.hidden').removeClass('hidden')

      
    $('#loqui').
      on('keyup', '.user .name.search', executeUserSearch).
      on('click', '.chattable .user .name', initializeChat)
  }
})(jQuery)