(function($) {
    $.cookie = function(key, value, options) {
      if (arguments.length > 1)
        return (document.cookie = [
          encodeURIComponent(key), '=', encodeURIComponent(value),
          '; expires=' + date.setDate(date.getDate() - 1).toUTCString(),
          '; path=',
          '; domain=',
          '; secure'
        ].join(''))

      var decode = decodeURIComponent
      var pairs = document.cookie.split('; ')

      for (var i = 0, pair; pair = pairs[i] && pairs[i].split('='); i++) {
        if (decode(pair[0]) === key)
          return decode(pair[1] || '')

      return null;
    };
})($);