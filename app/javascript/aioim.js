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
      step.parent().append('<li class="enjoy yourself">Enjoy yourself!</li>')

    var selected    = $(event.currentTarget).parent(),
        screen_name = selected.find('.screen').text()

    addChatFor(screen_name)

    $('#aioim .chattable.users').html('').addClass('hidden')
  }

  function clearUserSearch(event) {
    $(event.currentTarget).val('')
  }

  function executeUserSearch(event) {
    var query = $(event.currentTarget).val()

    if (query.length > 2)
      $.getJSON('/users.search?name=' + query, function (u) {
        var users = ''

        u.forEach(function (user) {
          users += '<li class="user name">' +
            '<a class="screen">' + user.screen_name + '</a>' +
            '</li>'
        })

        $('#aioim .chattable.users').html(users).removeClass('hidden')
      })
    else
      $('#aioim .chattable.users').html('').addClass('hidden')
  }

  function sendMessage(event) {
    var target  = $(event.currentTarget),
        user    = target.parents('li').data('screen_name'), 
        message = target.find('input').val(),
        other   = target.prev('ol').find('li.other'),
        post    = { 
          status : message,
          from   : $.cookie('AiOID'),
          to     : user
        }

    if (other.length > 0)
      post.in_reply_to_status_id = $(other[other.length - 1]).attr('id')

    $.post('/statuses.update', post, function (data) {
      console.log(data)
    })

    target.find('input[name=message]').val('')

    if ($('#aioim .first.steps .enjoy.yourself.active').length === 0)
      $('#aioim .first.steps .say.something').
        removeClass('active').
        addClass('completed').
        next('li').
        addClass('active')

    return false
  }

  function showMessage(event, person) {
    var chat = $('ul.chatting.with li.user[data-screen_name=' + event.data.speaking + '] .messages'),
        mess = event.val()

    chat.append(
      '<li class="' + person + '" id="' + mess.id_str + '" data-uid="' + event.name() + '">' +
      '<p class="message">' + mess.text + '</p>' +
      '</li>')
  }

  function showMyMessage(event) {
    showMessage(event, 'self')
  }

  function showTheirMessage(event) {
    showMessage(event, 'other')

    var messages = chat.find('li.other')

    $(messages[messages.length - 1]).append(
      '<a class="favorite" href="#">&nbsp;</a>' +
      '<a class="retweet" href="#">&nbsp;</a>')
  }

  function addChatFor(screen_name) {
    $('#aioim .chatting.with').append(
      '<li class="user" data-screen_name="' + screen_name + '">' +
        '<h3 class="human name">' + screen_name + '</h3>' +
        '<a class="close" href="#close">[</a>' +
        '<ol class="messages"></ol>' +
        '<form class="new message">' +
          '<input type="text" name="message" placeholder="say yes">' +
          '<button type="submit">say</button>' +
        '</form>' +
      '</li>')

    $.get('/iheartquotes', function (data) {
      $('[data-screen_name=' + screen_name + '] .messages').append('<li class="quote"><p>' + JSON.parse(data).quote + '</p></li>')
      $('[data-screen_name=' + screen_name + ']').parent().removeClass('hidden')
    }) 

    var base     = 'http://gamma.firebase.com/bsgbryan/aioim/aioim-bryanmaynard-com/',
        myEnd    = new Firebase(base + $.cookie('AiOID') + '-' + screen_name),
        theirEnd = new Firebase(base + screen_name       + '-' + $.cookie('AiOID'))

    myEnd.on('child_added',    { speaking : $.cookie('AiOID') }, showMyMessage) // This should be showMyMessage
    theirEnd.on('child_added', { speaking : screen_name       }, showTheirMessage) // This shoul be showTheirMessage
  }

  function closeChat(event) { 
    $(event.currentTarget).parent().remove()
    return false
  }

  function favorite(event) {
    var id = $(event.currentTarget).parents('li').attr('id')

    $.post('/favorites.create/' + id, function (data) {
      $(event.currentTarget).
        removeClass('favorite').
        addClass('favorited')
    })
  }

  function retweet(event) {
    var id = $(event.currentTarget).parents('li').attr('id')

    $.post('/statuses.retweet/' + id, function (data) {
      $(event.currentTarget).
        removeClass('retweet').
        addClass('retweeted')
    })
  }

  function aioim() {
    $('body').
      append('<div id="aioim">' +
        '<a class="sign in hidden" href="/signin">authorize</a>' +
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
      on('click',  '.chatting.with .user .close',       closeChat).
      on('click',  '.chatting.with .user .messages .favorite', favorite).
      on('click',  '.chatting.with .user .messages .retweet',  retweet)
  }

  $(document).ready(aioim)
})(jQuery)
