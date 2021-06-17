/////////////////////////////////////////////////////////////////////////////////////////
// "core" module scripts

;(function($) {
  'use strict'
  $(function() {
    /////////////////////////////////////////////////////////////////////////////////////////
    // custom scroll

    if ($('.fel__customScroll').length) {
      if (!/Mobi/.test(navigator.userAgent) && jQuery().perfectScrollbar) {
        $('.fel__customScroll').perfectScrollbar({
          theme: 'fellowary',
        })
      }
    }

    // tooltips & popovers
    $('[data-toggle=tooltip]').tooltip()
    $('[data-toggle=popover]').popover()
  })
})(jQuery)
