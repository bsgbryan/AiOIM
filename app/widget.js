(function($) {
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

  function initialize() {
    if (cookie('AiOID') === null)
      $('#aioim').prepend('<a class="authorize" href="https://aioim.bryanmaynard.com/signin">Sign in via Twitter</a> to join the discussion!')
    else
      io.connect('http://aioim.bryanmaynard.com/aioim').
        on('receive message', showMessage).
        on('statuses filter', function() { 
          $.get('http://aioim.bryanmaynard.com/statuses.filter?callback=?')
        })
  }

  $(document).ready(function() {
    $.getScript('http://aioim.bryanmaynard.com/socket.io/socket.io.js', initialize)
  })
})(jQuery)