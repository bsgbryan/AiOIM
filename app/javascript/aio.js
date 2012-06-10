(function ($) {
  var container = '#aio'

  function initializeChat(event) {

    var selected    = $(event.currentTarget).parent(),
        screen_name = selected.find('.screen').text(),
        human_name  = selected.find('.human').text()

    addChatFor(screen_name, human_name)

    $('#aio .chattable.users').addClass('hidden')
  }

  function clearUserSearch(event) {
    $(event.currentTarget).val('')
  }

  function executeUserSearch(event) {
    $.getJSON('/aio/users.search?name=' + $(event.currentTarget).val(), function (u) {
      var users = ''

      u.forEach(function (user) {
        users += '<li class="user name">' +
          '<a class="screen">' + user.screen_name + '</a>' +
          '<span class="human">' + user.name + '</span>' +
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
        tweet   = '@' + user + ' ' + message + ' #AiOIM'

    $(event.currentTarget).parent().attr('id', Sha1.hash(tweet))

    $.post('/aio/statuses.update', { status : tweet }, messageSent, 'json')

    return false
  }

  $.aio = function () {
    $('body').
      append('<div id="aio">' +
        '<a class="sign in hidden" href="/aio/signin">sign in</a>' +
        '<ol class="chattable users hidden"></ol>' +
        '<ul class="chatting with hidden"></ul>' +
        '<form class="user search hidden">' +
          '<input type="text" class="name" placeholder="Find a tweeter">' +
        '</form>' +
      '</div>')

    if ($.cookie('AiOID') === null)
      $('#aio .sign.in').removeClass('hidden')
    else {
      setInterval(getNewMessages, 3000)
      $('#aio form.user.hidden').removeClass('hidden')
    }

      
    $('#aio').
      on('keyup',  '.user.search .name',                executeUserSearch).
      on('blur',   '.user.search .name',                clearUserSearch).
      on('click',  '.chattable .user.name .screen, .chattable .user.name .human', initializeChat).
      on('submit', '.chatting.with .user .new.message', sendMessage)
  }
})(jQuery)

function getNewMessages() {
  $(document).ready(function($) {
    $.getJSON('/aio/statuses.home_timeline', showMessage)
  })
}

function showMessage(data) {
  $(data).each(function(i, message) {
    var tag, mention
    var h = message.entities.hashtags,
        m = message.entities.user_mentions

    if (h[h.length - 1].text === 'AiOIM') {
      tag     = h[h.length - 1].indices[0]
      mention = m[0]
    }

    if (tag > 0) {
      if ($('[data-screen_name=' + mention.screen_name + ']').length === 0)
        addChatFor(mention.screen_name, mention.name)

      var said   = message.text.substring(0, tag).substring(mention.screen_name.length),
          person = mention.screen_name === $.cookie('AiOID') ? 'self' : 'other'

      $('[data-screen_name=' + mention.screen_name + '] .messages').
        append('<li class="' + person + '">' + said + '</li>')
    }
  })
}

function addChatFor(screen_name, human_name) {
  $('#aio .chatting.with').append(
    '<li class="user" data-screen_name="' + screen_name + '">' +
      '<h3 class="human name">' + human_name + '</h3>' +
      '<ol class="messages"></ol>' +
      '<form class="new message">' +
        '<input type="text" name="message" placeholder="say yes">' +
        '<button type="submit">say</button>' +
      '</form>' +
    '</li>').removeClass('hidden')
}