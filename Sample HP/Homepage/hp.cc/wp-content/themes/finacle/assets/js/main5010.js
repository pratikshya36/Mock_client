(function($) {
    'use strict';

    $( window ).load(function() {
        $('.preloader-wrapper').fadeOut();
    });


 /*================*/
    /* 01 - scroll down */
    /*================*/
    $(window).on('scroll load', function () {
    if($(window).scrollTop() > 80) {
        $('.header-area').addClass('fixed');
    }else {
        $('.header-area').removeClass('fixed');
    }
});
    /*---------------------------------------
       PORTFOLIO IMAGE LODED WITH MASONRY
    -----------------------------------------*/
    var $PortfolioMasonry = $('.portfolio-masonry');
    if (typeof imagesLoaded === 'function') {
        imagesLoaded($PortfolioMasonry, function() {
            setTimeout(function() {
                $PortfolioMasonry.isotope({
                    itemSelector: '.portfolio-item',
                    resizesContainer: false,
                    layoutMode: 'masonry',
                    filter: '*'
                });
            }, 500);

        });
    };
     
    /*-------------------------------------------
       SET ACTIVE CLASS FOR PORTFOLIO FILTER
    ---------------------------------------------*/
    $('.portfolio-filter li').on('click', function(event) {
        $(this).siblings('.active').removeClass('active');
        $(this).addClass('active');
        event.preventDefault();
    });

    /*--------------------------------
       FILTER JS FOR PORRTFOLIO
    -----------------------------------*/
    $('.portfolio-filter').on('click', 'li', function() {
        var filterValue = $(this).attr('data-filter');
        $PortfolioMasonry.isotope({ filter: filterValue });
    });
    
    
    /*--------------------------------
       VENOBOX GALLARY IMAGE VIEW
    -----------------------------------*/
    $('.venobox').venobox();

    // Mainmenu JS
    jQuery('.mobile-menu-custom').meanmenu();


    /* parallax Active*/
    $.stellar({
        horizontalScrolling: false,
        verticalOffset: 40
    });

    

    // Mainmenu JS
    jQuery('.mobile-menu').meanmenu();

    
   
    /* ---------------------------------------------
        3. Header sticky style.
    --------------------------------------------- */
    $(window).on('scroll', function () {
        var wSize = $(window).width();
        if (wSize > 1 && $(this).scrollTop() > 1) {
            $('#sticky-header').addClass('sticky');
        }
        else {
            $('#sticky-header').removeClass('sticky');
        }
    });
    
    /* ---------------------------------------------
     MENU HAMBURGER AND FULL SCREEN  OVERLAY.
    --------------------------------------------- */
    $('.hamburger').on('click', function() {
        $(this).toggleClass('is-active');
        $(this).next().toggleClass('nav-show')
    });
    $('.menu-button a').on('click', function() {
        $('.overlay').fadeToggle(300);
        $(this).toggleClass('btn-open').toggleClass('btn-close');
    });
    $('.overlay').on('click', function() {
        $('.menu-button').fadeToggle(300);
        $('.button a').toggleClass('btn-open').toggleClass('btn-close');
        open = false;
    });


    //Homepage Three Slider Main Section

      $(".slider-wrapper").owlCarousel({
        items: 1,
        nav: true,
        dots: false,
        autoplay: true,
        loop: true,
        navText: ["<i class='fa fa-angle-left'></i>", "<i class='fa fa-angle-right'></i>"],
        mouseDrag: false,
        touchDrag: false,
        smartSpeed: 700
      });

    $('.search-icon').on('click', function() {
        $('.search-box').fadeToggle('fade');
        $('.search-box').toggleClass('show-box');
    });




})(jQuery);
