(function ($) {
  var container = '#aioim'

  function initializeChat(event) {
    var step = $('#aioim .first.steps .find.someone')

    step.
      removeClass('active').
      addClass('completed').
      next('li').
      addClass('active')

    if (step.parent().find('.enjoy.yourself').length === 0)
      step.after('<li class="enjoy yourself">Enjoy yourself!</li>')

    var selected    = $(event.currentTarget).parent(),
        screen_name = selected.find('.screen').text(),
        human_name  = selected.find('.human').text()

    addChatFor(screen_name, human_name)

    $('#aioim .chattable.users').html('').addClass('hidden')
  }

  function clearUserSearch(event) {
    $(event.currentTarget).val('')
  }

  function executeUserSearch(event) {
    var query = $(event.currentTarget).val()

    if (query.length > 2)
      $.getJSON('/aioim/users.search?name=' + query, function (u) {
        var users = ''

        u.forEach(function (user) {
          users += '<li class="user name">' +
            '<a class="screen">' + user.screen_name + '</a>' +
            '<span class="human">' + user.name + '</span>' +
            '</li>'
        })

        $('#aioim .chattable.users').html(users).removeClass('hidden')
      })
    else
      $('#aioim .chattable.users').html('').addClass('hidden')
  }

  function sendMessage(event) {
    var user    = $(event.currentTarget).parents('li').data('screen_name'), 
        message = $(event.currentTarget).find('input').val(),
        tweet   = '@' + user + ' ' + message + ' #AiOIM'

    $.post('/aioim/statuses.update', { status : tweet })

    $('[data-screen_name=' + user + '] .messages').
      append('<li class="self">' + message + '</li>')

    $(event.currentTarget).find('input').val('')

    if ($('#aioim .first.steps .enjoy.yourself.active').length === 0)
      $('#aioim .first.steps .say.something').
        removeClass('active').
        addClass('completed').
        next('li').
        addClass('active')

    return false
  }

  function showMessage(data) {
    console.log('data', data)
    var message = data,
        h       = message.entities.hashtags,
        m       = message.entities.user_mentions,
        tag, mention, to

    if (h[h.length - 1].text === 'AiOIM') {
      tag     = h[h.length - 1].indices[0]
      mention = m[0].screen_name === $.cookie('AiOID') ? message.user : m[0]
      to      = m[0].screen_name
    }

    if (tag > 0) {
      if ($('[data-screen_name=' + mention.screen_name + ']').length === 0)
        addChatFor(mention.screen_name, mention.name)

      var said     = message.text.substring(0, tag - 1).substring(to.length + 2),
          person   = message.user.screen_name === $.cookie('AiOID') ? 'self' : 'other',
          present  = false,
          messages = $('ul.chatting.with li.user[data-screen_name=' + mention.screen_name + '] .messages li')

      for (var j = 0; j < messages.length; j++)
        if (said === $(messages[j]).text())
          present = true

      $('#aioim .first.steps .find.someone').
        removeClass('active').
        addClass('completed').
        next('.say.something').
        addClass('')

      if (present === false)
        $('ul.chatting.with li.user[data-screen_name=' + mention.screen_name + '] .messages').
          append('<li class="' + person + '">' + said + '</li>')
    }
  }

  function addChatFor(screen_name, human_name) {
    $('#aioim .chatting.with').append(
      '<li class="user" data-screen_name="' + screen_name + '">' +
        '<h3 class="human name">' + human_name + '</h3>' +
        '<a class="close" href="#close">[</a>' +
        '<ol class="messages"></ol>' +
        '<form class="new message">' +
          '<input type="text" name="message" placeholder="say yes">' +
          '<button type="submit">say</button>' +
        '</form>' +
      '</li>')

    $.get('/aioim/quote', function (data) {
      $('[data-screen_name=' + screen_name + '] .messages').append('<li class="quote"><p>' + JSON.parse(data).quote + '</p></li>')
      $('[data-screen_name=' + screen_name + ']').parent().removeClass('hidden')
    }) 
  }

  function closeChat(event) { 
    $(event.currentTarget).parent().remove()
    return false
  }

  $.aioim = function () {
    $('body').
      append('<div id="aioim">' +
        '<a class="sign in hidden" href="/aioim/signin">authorize</a>' +
        '<ol class="first steps">' +
          '<li class="authorize">Click "authorize"</li>' +
          '<li class="find someone">Find someone</li>' +
          '<li class="say something">Say something</li>' +
        '</ol>' +
        '<ol class="chattable users hidden"></ol>' +
        '<ul class="chatting with hidden"></ul>' +
        '<form class="user search hidden">' +
          '<input type="text" class="name" placeholder="Find a tweeter">' +
        '</form>' +
      '</div>')

    if ($.cookie('AiOID') === null) {
      $('#aioim .sign.in').removeClass('hidden')
      $('#aioim .first.steps .authorize').addClass('active')
    }
    else {
      io.connect('/aioim').
        on('receive message', showMessage).
        on('statuses filter', function() { 
          $.get('/aioim/statuses.filter')
        })
        
      $('#aioim form.user.hidden').removeClass('hidden')
      $('#aioim .first.steps .authorize').
        addClass('completed').
        next('li').
        addClass('active')
    }

      
    $('#aioim').
      on('keyup',  '.user.search .name',                executeUserSearch).
      on('blur',   '.user.search .name',                clearUserSearch).
      on('submit', '.chatting.with .user .new.message', sendMessage).
      on('click',  '.chattable .user.name .screen',     initializeChat).
      on('click',  '.chattable .user.name .human',      initializeChat).
      on('click',  '.close',                            closeChat)
  }
})(jQuery)
