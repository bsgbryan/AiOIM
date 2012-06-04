(function ($) {
  var container = '#loqui'

  function initializeChat(event) {
    $(event.currentTarget).parent().addClass('selected')

    var selected = $('#loqui .chattable.users .selected')

    $('#loqui .chatting.with').append(
      '<li class="user" data-screen_name="' + selected.find('.screen.name').text() + '">' +
        '<h3 class="human name">' + selected.find('.human.name').text() + '</h3>' +
        '<ol class="messages"></ol>' +
        '<form class="new message">' +
          '<input type="text" name="message">' +
          '<button type="submit">say</button>' +
        '</form>' +
      '</li>').removeClass('hidden')

    $('#loqui .chattable.users').addClass('hidden')
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

      $('#loqui .chattable.users').html(users).removeClass('hidden')
    })
  }

  function messageSent(data) {
    console.log(data)
    console.log($('#' + Sha1.hash(data.text)))

    $('#' + Sha1.hash(data.text)).find('.messages').append('<li class="self">' + data.text + '</li>')
  }

  function sendMessage(event) {
    var message = {
      status : ' @' + $(event.currentTarget).find('input').val() + ' IM'
    }

    $(event.currentTarget).parent().attr('id', Sha1.hash(message.status))

    $.post('https://api.twitter.com/1/statuses/update.json', message, messageSent, 'json')

    return false
  }

  $.loqui = function () {
    $('body').
      append('<div id="loqui">' +
        '<a class="sign in hidden" href="/twitter/signin">sign in</a>' +
        '<ol class="chattable users hidden"></ol>' +
        '<ul class="chatting with hidden"></ul>' +
        '<form class="user search hidden">' +
          '<input type="text" class="name" placeholder="Search for a tweeter">' +
        '</form>' +
      '</div>')

    if ($.cookie('twitter_profile') === null)
      $('#loqui .sign.in').addClass('active')
    else
      $('#loqui form.user.hidden').removeClass('hidden')

      
    $('#loqui').
      on('keyup',  '.user.search .name',            executeUserSearch).
      on('blur',   '.user.search .name',            clearUserSearch).
      on('click',  '.chattable .user .name',        initializeChat).
      on('submit', '.chattable .user .new.message', sendMessage)
  }
})(jQuery)