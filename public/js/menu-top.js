!function(i){"use strict";i(function(){i(".fel__menuTop__mobileActionToggle").on("click",function(){i("body").toggleClass("fel__menu--mobileToggled")}),i(".fel__menuTop__container").on("click",".fel__menuTop__submenu > .fel__menuTop__link",function(){if(window.innerWidth<768){var n=i(this).closest(".fel__menuTop__submenu"),_=n.hasClass("fel__menuTop__submenu--active");i(".fel__menuTop__submenu--active").removeClass("fel__menuTop__submenu--active"),_||n.addClass("fel__menuTop__submenu--active"),i(".fel__menuTop__submenu > .fel__menuTop__list").stop().slideUp(200),n.find("> .fel__menuTop__list").stop().slideToggle(200)}});var n={};i(".fel__menuTop__submenu").each(function(){i(this).attr("flyout-id",Math.random().toString(36).substring(3))}),i(".fel__menuTop__container").on("mouseover",".fel__menuTop__submenu",function(){var _=i(this).attr("flyout-id"),e=window.innerWidth>768,o=i(this).find("> .fel__menuTop__list"),t=i(".fel__menuFlyout[flyout-id="+_+"]");if(clearInterval(n[_]),e&&o.length&&!t.length){i("body").append('<div class="fel__menuFlyout" flyout-id="'+_+'"></div>');var u=o.clone();i(".fel__menuFlyout[flyout-id="+_+"]").html(u);var a=i(this).offset().top+i(this).innerHeight(),r=i(this).offset().left,s=i(this).innerWidth(),m=i(".fel__menuFlyout[flyout-id="+_+"]").innerWidth();i(".fel__menuFlyout[flyout-id="+_+"]").css({top:a-3,left:r-m/2+s/2}).addClass("fel__menuFlyout--animation")}}),i(".fel__menuTop__container").on("mouseout",".fel__menuTop__submenu",function(){var _=i(this).attr("flyout-id");n[_]=setTimeout(function(){i(".fel__menuFlyout[flyout-id="+_+"]").remove()},100)}),i("body").on("mouseover",".fel__menuFlyout",function(){var _=i(this).attr("flyout-id");clearInterval(n[_])}),i("body").on("mouseout",".fel__menuFlyout",function(){var _=i(this).attr("flyout-id");n[_]=setTimeout(function(){i(".fel__menuFlyout[flyout-id="+_+"]").remove()},100)});var _=window.location.href,e=_.substr(_.lastIndexOf("/")+1),o=i(".fel__menuTop__container").find('a[href="'+e+'"]');o.parent().toggleClass("fel__menuTop__item--active"),o.closest(".fel__menuTop__submenu").addClass("fel__menuTop__submenu--active").find("> .fel__menuTop__list").show()})}(jQuery);