(function($) {
  function qParams() {
    var vars   = { }, hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');

    for (var i = 0; i < hashes.length; i++) {
      hash = hashes[i].split('=');
      if (hash.length === 2) {
        vars[hash[0]] = undefined;

        var pound = hash[1].indexOf('#');

        vars[hash[0]] = (pound < 0 ? hash[1] : hash[1].substring(0, pound));
      }
    }

    return vars;
  }

  function qParam(name) {
    return qParams()[name];
  }

  // Ganked from jquery.cookie
  function cookie(key, value, options) {

    // key and at least value given, set cookie...
    if (arguments.length > 1 && (!/Object/.test(Object.prototype.toString.call(value)) || value === null || value === undefined)) {
        options = $.extend({}, options);

        if (value === null || value === undefined) {
            options.expires = -1;
        }

        if (typeof options.expires === 'number') {
            var days = options.expires, t = options.expires = new Date();
            t.setDate(t.getDate() + days);
        }

        value = String(value);

        return (document.cookie = [
            encodeURIComponent(key), '=', options.raw ? value : encodeURIComponent(value),
            options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
            options.path    ? '; path=' + options.path : '',
            options.domain  ? '; domain=' + options.domain : '',
            options.secure  ? '; secure' : ''
        ].join(''));
    }

    // key and possibly options given, get cookie...
    options = value || {};
    var decode = options.raw ? function(s) { return s; } : decodeURIComponent;

    var pairs = document.cookie.split('; ');
    for (var i = 0, pair; pair = pairs[i] && pairs[i].split('='); i++) {
        if (decode(pair[0]) === key) return decode(pair[1] || ''); // IE saves cookies with empty string as "c; ", e.g. without "=" as opposed to EOMB, thus pair[1] may be undefined
    }
    return null;
  };

  function populateMessages() {

  }

  function showNewMessageForm() {
    $('#aioim').append('<form class="new message" action="http://aioim.bryanmaynard.com/statuses.update" method="post">' +
        '<input type="hidden" name="AiOID" value="' + cookie('AiOID') + '">' +
        '<textarea name="status" placeholder="What do you have to say?"></textarea>' +
        '<button type="submit">say</button>' +
      '</form>')
  }

  function initialize() {
    if (cookie('AiOID') === null && typeof qParam('AiOID') === 'undefined')
      $('#aioim').prepend('<p><a class="authorize" href="http://aioim.bryanmaynard.com/signin">Sign in via Twitter</a> to join the discussion!</p>')
    else {
      populateMessages()
      showNewMessageForm()
    }

    if (typeof qParam('AiOID') === 'string')
      cookie('AiOID', qParam('AiOID'))

    var root     = 'http://gamma.firebase.com/bsgbryan/aioim/' + window.location.host.replace(/\./g, '_') + window.location.pathname.replace(/\./g, '_'),
        messages = new Firebase(root)

    messages.on('child_added', function (message) {
      var m = message.val()

      $('#aioim .messages').append('<dt>' +
        '<a href="#" class="user">' + m.user.screen_name + '</a>' +
        '<a href="#" class="retweet">h</a>' +
        '<a href="#" class="favorite">7</a>' +
      '</dt>' +
      '<dd class="message">' +
        '<p class="content">' + m.text + '</p>' +
      '</dd>')
    })
  }

  $(document).ready(function() {
    $.getScript('http://static.firebase.com/v0/firebase.js', initialize)

    $('#aioim').on('submit', '.new.message', function (event) {
      $.post($(event.currentTarget).attr('action'), { status: $('#aioim .new.message .status').val() })
      $('#aioim .new.message .status').val('')
    })

    $('#aioim').append('<dl class="messages"></dl>')
  })
})(jQuery)