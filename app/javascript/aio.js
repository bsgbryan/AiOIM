(function ($) {
  var container = '#aio'

  function initializeChat(event) {
    $(event.currentTarget).parent().addClass('selected')

    var selected = $('#aio .chattable.users .selected')

    $('#aio .chatting.with').append(
      '<li class="user" data-screen_name="' + selected.find('.screen.name').text() + '">' +
        '<h3 class="human name">' + selected.find('.human.name').text() + '</h3>' +
        '<ol class="messages"></ol>' +
        '<form class="new message">' +
          '<input type="text" name="message">' +
          '<button type="submit">say</button>' +
        '</form>' +
      '</li>').removeClass('hidden')

    $('#aio .chattable.users').addClass('hidden')
  }

  function clearUserSearch(event) {
    $(event.currentTarget).val('')
  }

  function executeUserSearch(event) {
    $.getJSON('/twitter/find?name=' + $(event.currentTarget).val(), function (u) {
      var users = ''

      u.forEach(function (user) {
        users += '<li class="user">' +
          '<a class="screen name">' + user.screen_name + '</a>' +
          '<span class="human name">' + user.name + '</span>' +
          '</li>'
      })

      $('#aio .chattable.users').html(users).removeClass('hidden')
    })
  }

  function messageSent(data) {
    console.log(data)
    console.log($('#' + Sha1.hash(decodeURIComponent(data.text))))

    $('#' + Sha1.hash(decodeURIComponent(data.text))).find('.messages').append('<li class="self">' + data.text + '</li>')
  }

  function sendMessage(event) {
    var user    = $(event.currentTarget).parents('li').data('screen_name'), 
        message = $(event.currentTarget).find('input').val(),
        tweet   = '@' + user + ' ' + message + ' IM'

    $(event.currentTarget).parent().attr('id', Sha1.hash(tweet))

    $.post('/twitter/message', { status : tweet }, messageSent, 'json')

    return false
  }

  $.aio = function () {
    $('body').
      append('<div id="aio">' +
        '<a class="sign in hidden" href="/twitter/signin">sign in</a>' +
        '<ol class="chattable users hidden"></ol>' +
        '<ul class="chatting with hidden"></ul>' +
        '<form class="user search hidden">' +
          '<input type="text" class="name" placeholder="Find a tweeter">' +
        '</form>' +
      '</div>')

    if ($.cookie('twitter_user') === null)
      $('#aio .sign.in').removeClass('hidden')
    else 
      $('#aio form.user.hidden').removeClass('hidden')

      
    $('#aio').
      on('keyup',  '.user.search .name',                executeUserSearch).
      on('blur',   '.user.search .name',                clearUserSearch).
      on('click',  '.chattable .user .name',            initializeChat).
      on('submit', '.chatting.with .user .new.message', sendMessage)
  }
})(jQuery)