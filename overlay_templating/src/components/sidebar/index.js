/////////////////////////////////////////////////////////////////////////////////////////
// "sidebar" module scripts

;(function($) {
  'use strict'
  $(function() {
    /////////////////////////////////////////////////////////////////////////////////////////
    // hide non top menu related settings
    if ($('.fel__menuTop').length) {
      $('.hideIfMenuTop').css({
        pointerEvents: 'none',
        opacity: 0.4,
      })
    }

    /////////////////////////////////////////////////////////////////////////////////////////
    // toggle
    $('.fel__sidebar__actionToggle').on('click', function() {
      $('body').toggleClass('fel__sidebar--toggled')
    })

    /////////////////////////////////////////////////////////////////////////////////////////
    // custom scroll init

    if ($('.fel__sidebar').length) {
      if (!/Mobi/.test(navigator.userAgent) && jQuery().perfectScrollbar) {
        $('.fel__sidebar__scroll').perfectScrollbar({
          theme: 'fellowary',
        })
      }
    }

    /////////////////////////////////////////////////////////////////////////////////////////
    // switch

    $('.fel__sidebar__switch input').on('change', function() {
      var el = $(this)
      var checked = el.is(':checked')
      var to = el.attr('to')
      var setting = el.attr('setting')
      if (checked) {
        $(to).addClass(setting)
      } else {
        $(to).removeClass(setting)
      }
    })

    $('.fel__sidebar__switch input').each(function() {
      var el = $(this)
      var to = el.attr('to')
      var setting = el.attr('setting')
      if ($(to).hasClass(setting)) {
        el.attr('checked', true)
      }
    })

    /////////////////////////////////////////////////////////////////////////////////////////
    // colors

    $('.fel__sidebar__select__item').on('click', function() {
      var el = $(this)
      var parent = el.parent()
      var to = parent.attr('to')
      var setting = el.attr('setting')
      var items = parent.find('> div')
      var classList = ''
      items.each(function() {
        var setting = $(this).attr('setting')
        if (setting) {
          classList = classList + ' ' + setting
        }
      })
      items.removeClass('fel__sidebar__select__item--active')
      el.addClass('fel__sidebar__select__item--active')
      $(to).removeClass(classList)
      $(to).addClass(setting)
    })

    $('.fel__sidebar__select__item').each(function() {
      var el = $(this)
      var parent = el.parent()
      var to = parent.attr('to')
      var setting = el.attr('setting')
      var items = parent.find('> div')
      if ($(to).hasClass(setting)) {
        items.removeClass('fel__sidebar__select__item--active')
        el.addClass('fel__sidebar__select__item--active')
      }
    })

    /////////////////////////////////////////////////////////////////////////////////////////
    // type

    $('.fel__sidebar__type__items input').on('change', function() {
      var el = $(this)
      var checked = el.is(':checked')
      var to = el.attr('to')
      var setting = el.attr('setting')
      $('body').removeClass('fel__menu--compact fel__menu--flyout fel__menu--nomenu')
      if (checked) {
        $(to).addClass(setting)
      } else {
        $(to).removeClass(setting)
      }
    })

    $('.fel__sidebar__type__items input').each(function() {
      var el = $(this)
      var to = el.attr('to')
      var setting = el.attr('setting')
      if ($(to).hasClass(setting)) {
        el.attr('checked', true)
      }
    })
  })
})(jQuery)
