/////////////////////////////////////////////////////////////////////////////////////////
// "menu-right" module scripts

;(function($) {
  'use strict'
  $(function() {
    /////////////////////////////////////////////////////////////////////////////////////////
    // toggle on resize

    ;(function() {
      var isTabletView = false
      function toggleMenu() {
        if (!isTabletView) {
          $('body').addClass('fel__menu--toggled')
        }
      }
      if ($(window).innerWidth() <= 992) {
        toggleMenu()
        isTabletView = true
      }
      $(window).on('resize', function() {
        if ($(window).innerWidth() <= 992) {
          toggleMenu()
          isTabletView = true
        } else {
          isTabletView = false
        }
      })
    })()

    /////////////////////////////////////////////////////////////////////////////////////////
    // mobile toggle

    $('.fel__menuLeft__mobileActionToggle').on('click', function() {
      $('body').toggleClass('fel__menu--mobileToggled')
    })

    /////////////////////////////////////////////////////////////////////////////////////////
    // toggle

    $('.fel__menuLeft__actionToggle').on('click', function() {
      $('body').toggleClass('fel__menu--toggled')
    })

    /////////////////////////////////////////////////////////////////////////////////////////
    // menu logic

    $('.fel__menuLeft__container').on(
      'click',
      '.fel__menuLeft__submenu > .fel__menuLeft__link',
      function() {
        var isMobile = window.innerWidth < 768
        if (
          ($('body').hasClass('fel__menu--toggled') ||
            $('body').hasClass('fel__menu--compact') ||
            $('body').hasClass('fel__menu--flyout')) &&
          !isMobile
        ) {
          return
        }
        var submenu = $(this).closest('.fel__menuLeft__submenu')
        var isActive = submenu.hasClass('fel__menuLeft__submenu--active')
        $('.fel__menuLeft__submenu--active').removeClass('fel__menuLeft__submenu--active')
        if (!isActive) {
          submenu.addClass('fel__menuLeft__submenu--active')
        }
        $('.fel__menuLeft__submenu > .fel__menuLeft__list')
          .stop()
          .slideUp(200)
        submenu
          .find('> .fel__menuLeft__list')
          .stop()
          .slideToggle(200)
      },
    )

    /////////////////////////////////////////////////////////////////////////////////////////
    // flyout logic

    var flyoutTimers = {}

    $('.fel__menuLeft__submenu').each(function() {
      $(this).attr(
        'flyout-id',
        Math.random()
          .toString(36)
          .substring(3),
      )
    })

    $('.fel__menuLeft__container').on('mouseover', '.fel__menuLeft__submenu', function() {
      var isActive = $('body').is('.fel__menu--flyout, .fel__menu--compact, .fel__menu--toggled')
      var isUnfixed = $('body').is('.fel__menu--unfixed')
      var id = $(this).attr('flyout-id')
      var isDesktop = window.innerWidth > 768
      var submenuList = $(this).find('> .fel__menuLeft__list')
      var flyoutContainer = $('.fel__menuFlyout[flyout-id=' + id + ']')
      clearInterval(flyoutTimers[id])
      if (isActive && isDesktop && submenuList.length && !flyoutContainer.length) {
        $('body').append('<div class="fel__menuFlyout" flyout-id="' + id + '"></div>')
        var cloned = submenuList.clone()
        $('.fel__menuFlyout[flyout-id=' + id + ']').html(cloned)
        var top = isUnfixed
          ? $(this).offset().top - $(window).scrollTop()
          : $(this).position().top + $('.fel__menuLeft__container').position().top
        var left = $(this).offset().left + $(this).innerWidth()
        var itemHeight = $(this).innerHeight()
        var flyoutHeight = $('.fel__menuFlyout[flyout-id=' + id + ']').innerHeight()
        $('.fel__menuFlyout[flyout-id=' + id + ']')
          .css({
            top: top - flyoutHeight / 2 + itemHeight / 2,
            left: left - 10,
          })
          .addClass('fel__menuFlyout--animation')
      }
    })

    $('.fel__menuLeft__container').on('mouseout', '.fel__menuLeft__submenu', function() {
      var isActive = $('body').is('.fel__menu--flyout, .fel__menu--compact, .fel__menu--toggled')
      if (!isActive) {
        return
      }
      var id = $(this).attr('flyout-id')
      flyoutTimers[id] = setTimeout(function() {
        $('.fel__menuFlyout[flyout-id=' + id + ']').remove()
      }, 100)
    })

    $('body').on('mouseover', '.fel__menuFlyout', function() {
      var isActive = $('body').is('.fel__menu--flyout, .fel__menu--compact, .fel__menu--toggled')
      if (!isActive) {
        return
      }
      var id = $(this).attr('flyout-id')
      clearInterval(flyoutTimers[id])
    })

    $('body').on('mouseout', '.fel__menuFlyout', function() {
      var isActive = $('body').is('.fel__menu--flyout, .fel__menu--compact, .fel__menu--toggled')
      if (!isActive) {
        return
      }
      var id = $(this).attr('flyout-id')
      flyoutTimers[id] = setTimeout(function() {
        $('.fel__menuFlyout[flyout-id=' + id + ']').remove()
      }, 100)
    })

    /////////////////////////////////////////////////////////////////////////////////////////
    // set active menu item on load

    var url = window.location.href
    var page = url.substr(url.lastIndexOf('/') + 1)
    var currentItem = $('.fel__menuLeft__container').find('a[href="' + page + '"]')
    currentItem.parent().toggleClass('fel__menuLeft__item--active')
    currentItem
      .closest('.fel__menuLeft__submenu')
      .addClass('fel__menuLeft__submenu--active')
      .find('> .fel__menuLeft__list')
      .show()
  })
})(jQuery)
