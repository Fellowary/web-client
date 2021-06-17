/////////////////////////////////////////////////////////////////////////////////////
/// topbar scripts
$(document).ready(function() {
  $('.fel__topbar__actionsDropdown .dropdown-menu').on('click', function() {
    $('.fel__topbar__actionsDropdown').on('hide.bs.dropdown', function(event) {
      event.preventDefault() // stop hiding dropdown on click

      $('.fel__topbar__actionsDropdown .nav-link').on('shown.bs.tab', function(e) {
        $('.fel__topbar__actionsDropdown .dropdown-toggle').dropdown('update')
      })
    })
  })

  $(document, '.fel__topbar__actionsDropdown .dropdown-toggle').mouseup(function(e) {
    var dropdown = $('.fel__topbar__actionsDropdown')
    var dropdownMenu = $('.fel__topbar__actionsDropdownMenu')

    if (
      !dropdownMenu.is(e.target) &&
      dropdownMenu.has(e.target).length === 0 &&
      dropdown.hasClass('show')
    ) {
      dropdown.removeClass('show')
      dropdownMenu.removeClass('show')
    }
  })

  $('.fel__topbar__searchInput').on('focus', function() {
    $('.fel__topbar__searchDropdown .dropdown-toggle').dropdown({
      offset: '5, 15',
    })
  })

  $('.fel__topbar__searchInput').on('blur', function() {
    $('.fel__topbar__searchDropdown .dropdown-toggle').dropdown('hide')
  })
})
