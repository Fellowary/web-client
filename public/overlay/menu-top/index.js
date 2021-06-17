/////////////////////////////////////////////////////////////////////////////////////////
// "menu-right" module scripts

;(function($) {
  'use strict'
  $(function() {
    /////////////////////////////////////////////////////////////////////////////////////////
    // mobile toggle

    $('.fel__menuTop__mobileActionToggle').on('click', function() {
      $('body').toggleClass('fel__menu--mobileToggled')
    })

    /////////////////////////////////////////////////////////////////////////////////////////
    // menu logic

    $('.fel__menuTop__container').on(
      'click',
      '.fel__menuTop__submenu > .fel__menuTop__link',
      function() {
        var isMobile = window.innerWidth < 768
        if (!isMobile) {
          return
        }
        var submenu = $(this).closest('.fel__menuTop__submenu')
        var isActive = submenu.hasClass('fel__menuTop__submenu--active')
        $('.fel__menuTop__submenu--active').removeClass('fel__menuTop__submenu--active')
        if (!isActive) {
          submenu.addClass('fel__menuTop__submenu--active')
        }
        $('.fel__menuTop__submenu > .fel__menuTop__list')
          .stop()
          .slideUp(200)
        submenu
          .find('> .fel__menuTop__list')
          .stop()
          .slideToggle(200)
      },
    )

    /////////////////////////////////////////////////////////////////////////////////////////
    // flyout logic

    var flyoutTimers = {}

    $('.fel__menuTop__submenu').each(function() {
      $(this).attr(
        'flyout-id',
        Math.random()
          .toString(36)
          .substring(3),
      )
    })

    $('.fel__menuTop__container').on('mouseover', '.fel__menuTop__submenu', function() {
      var id = $(this).attr('flyout-id')
      var isDesktop = window.innerWidth > 768
      var submenuList = $(this).find('> .fel__menuTop__list')
      var flyoutContainer = $('.fel__menuFlyout[flyout-id=' + id + ']')
      clearInterval(flyoutTimers[id])
      if (isDesktop && submenuList.length && !flyoutContainer.length) {
        $('body').append('<div class="fel__menuFlyout" flyout-id="' + id + '"></div>')
        var cloned = submenuList.clone()
        $('.fel__menuFlyout[flyout-id=' + id + ']').html(cloned)
        var top = $(this).offset().top + $(this).innerHeight()
        var left = $(this).offset().left
        var itemWidth = $(this).innerWidth()
        var flyoutWidth = $('.fel__menuFlyout[flyout-id=' + id + ']').innerWidth()
        $('.fel__menuFlyout[flyout-id=' + id + ']')
          .css({
            top: top - 3,
            left: left - flyoutWidth / 2 + itemWidth / 2,
          })
          .addClass('fel__menuFlyout--animation')
      }
    })

    $('.fel__menuTop__container').on('mouseout', '.fel__menuTop__submenu', function() {
      var id = $(this).attr('flyout-id')
      flyoutTimers[id] = setTimeout(function() {
        $('.fel__menuFlyout[flyout-id=' + id + ']').remove()
      }, 100)
    })

    $('body').on('mouseover', '.fel__menuFlyout', function() {
      var id = $(this).attr('flyout-id')
      clearInterval(flyoutTimers[id])
    })

    $('body').on('mouseout', '.fel__menuFlyout', function() {
      var id = $(this).attr('flyout-id')
      flyoutTimers[id] = setTimeout(function() {
        $('.fel__menuFlyout[flyout-id=' + id + ']').remove()
      }, 100)
    })

    /////////////////////////////////////////////////////////////////////////////////////////
    // set active menu item on load

    var url = window.location.href
    var page = url.substr(url.lastIndexOf('/') + 1)
    var currentItem = $('.fel__menuTop__container').find('a[href="' + page + '"]')
    currentItem.parent().toggleClass('fel__menuTop__item--active')
    currentItem
      .closest('.fel__menuTop__submenu')
      .addClass('fel__menuTop__submenu--active')
      .find('> .fel__menuTop__list')
      .show()
  })
})(jQuery)
