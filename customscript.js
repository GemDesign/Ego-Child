jQuery(function ($) {
	$.fn.epicSlider = function (options) {
/*slider defaults
		-----------------------------*/
		var defaults = {
			loop:true,									//Boolean: whether slideshow should loop or not	
			slideShow:false,							//Boolean: use slideshow or not
			autoPlay:false,								//Boolean: autoplay uplon load or not
			slideShowInterval:2500,						//Integer: slideshow cycling speed, in milliseconds
			transitionSpeed:750,						//Integer: transitions speed, in milliseconds
			startSlide:0,								//Integer: starts at 0
			shuffleSlides:false,						//Boolean: add pattern or not
			stack:false,								//Boolean: whether slides should stack
			easing:'easeInOutQuint',					//String: easing method - see http://jqueryui.com/demos/effect/easing.html
			fx:'leftToRight',							//String: none, fade, leftToRight, topToBottom 
			fxmobile:'leftToRight',						//String: mobile effect -  none, fade, leftToRight, topToBottom 
			pattern:true,								//Boolean: use overlay pattern or not
			callback:function() {}						//Call back				
		};

		//overwrite or merge user es_options
		var es_options = $.extend({},defaults, options);
		
		/*internals
		-----------------------------*/
		var	slider = $(this),
			slides = slider.find('#slides'),
			currentSlide = slides.find('img').eq(es_options.startSlide), 
			slideLength = slides.find('img').length,
			running = false,
			nextSlide,
			prevSlide,
			navNext,
			navPrev,
			navPlay,
			caption,
			winW,
			winH,
			winRatio,
			imgW,
			imgH,
			imgRatio,
			newW,
			newH,
			timer;
			
			/*initiate slider
			-----------------------------*/
			
			function init(){
				
				es_options.callback.call(this);
				resize();
				currentSlide.addClass('current').show();
				caption = currentSlide.attr('title');
				captionProcess();
				
				//check if slidehow is active & if it should autoplay
				if(es_options.slideShow === true && es_options.autoPlay === true){
					
					setTimer();
					running = true;
				}
			}
			
			/*construct nav
			-----------------------------*/
			
			if(es_options.slideShow === false) {
				
				slider.append('<div id="epic-navigation"><div class="nav-button"><div id="prev"></div></div><div class="nav-button"><div id="next"></div></div></div>');
				
			//add play-nextSlide-prev but dont autostart slideshow
			}else if(es_options.slideShow === true && es_options.autoPlay === false){

				slider.append('<div id="epic-navigation" class="allcontrols"><div class="nav-button"><div id="progress"></div><div id="play"></div></div><div class="nav-button"><div id="prev"></div></div><div class="nav-button nav-last"><div id="next"></div></div></div>');
				
			//add play-nextSlide-prev and autostart slideshow
			}else{

				slider.append('<div id="epic-navigation" class="allcontrols"><div class="nav-button"><div id="progress"></div><div id="play" class="active"></div></div><div class="nav-button"><div id="prev"></div></div><div class="nav-button nav-last"><div id="next"></div></div></div>');
					
			}
			
			//cache the navs
			navNext = $('#next');	
			navPrev = $('#prev');	
			navPlay = $('#play');
			
			/*add pattern
			-----------------------------*/

			if(es_options.pattern === true) {slider.append(' <div id="epic-overlay"></div>');}
				
			
			/*set arrow direction & state
			-----------------------------*/

			if(es_options.fx !== 'topToBottom'){
				$('#next').addClass('right');
				$('#prev').addClass('left');
			}else{
				$('#next').addClass('up');
				$('#prev').addClass('down');
			}

			if(es_options.loop === false){
				navPrev.parent().addClass('disabled');
				navPrev.attr('disabled','disabled');
			}
			
			/*shuffle
			-----------------------------*/
			
			if(es_options.shuffleSlides === true){
				
				//get the elements to shuffle
				var stack = slides.children('img');

				stack.sort(function() { 
					return (Math.round(Math.random())-0.5); 
				}); 

				slides.children().remove();
				
				for(var i=0; i < stack.length; i++){
						
					slides.append(stack[i]);    
					
				}
				//update currentSlide based on new order	
				currentSlide = slides.find('img').eq(es_options.startSlide);
			}
				
				
			/*mobile check
			-----------------------------*/
			
			function deviceMobile() {
					
				//check for device	
				if( navigator.userAgent.match(/Android/i) || 
					navigator.userAgent.match(/webOS/i) ||
					navigator.userAgent.match(/iPhone/i) || 
					navigator.userAgent.match(/iPad/i)|| 
					navigator.userAgent.match(/iPod/i) || 
					navigator.userAgent.match(/BlackBerry/i)){
					
						//swap effect
						es_options.fx = es_options.fxmobile;
						
						//call reduced version of jquery mobile swipe actions 
						//from http://www.codingjack.com/playground/swipe/ - MIT/GPLv.2
						
						$(slider).touchSwipe(callback);
						
						
				}
			}
			
			/*listen for direction
			-----------------------------*/
			function callback(direction) {
				
				$.fn.epicSlider.killTimer();
					
					if(direction === 'left'){
						
						slide('next');
					
					}else{
						
						slide('prev');
					
					}
			} 


			/*navigation
			-----------------------------*/
			
			//nextSlide	
			navNext.on('click', function() {
				if(running === true){$.fn.epicSlider.killTimer();}
				slide('next');
			});
			//prev
			navPrev.on('click', function () {
				if(running === true){$.fn.epicSlider.killTimer();}
				slide('prev');
			});
			//play-pause
			navPlay.on('click',function () {
				if($(this).parent().hasClass('disabled')){return false;}
				if (running === false) {
					setTimer();
					$(this).addClass('active');
					running = true;
				}else {
					$.fn.epicSlider.killTimer();
					$(this).removeClass('active');
					running = false;
				}
			});
			
			//key events 
			$(document).keydown(function(e){

				if(currentSlide.is(':animated')) {return false;}

				if(es_options.fx != 'topToBottom'){
						
					switch(e.which){	
						case 37:	
							slide('prev');
							$.fn.epicSlider.killTimer();
							break;	
							
						case 39:
							slide('next');
							$.fn.epicSlider.killTimer();
							break;
					}
				}else{
					switch(e.which){
						case 38:
							slide('next');
							$.fn.epicSlider.killTimer();
							break;	
						case 40:
							slide('prev');
							$.fn.epicSlider.killTimer();
							break;		
					}
				}
			});
			
			
			/*window resize action
			-----------------------------*/
			
			$(window).bind('resize',function(){
				
					resize();
				
			});
				
			
			/*fullscreen/resizing
			-----------------------------*/	
						
			function resize(){
					
				winW	= $(window).width();
				winH	= $(window).height();
				winRatio	= winH / winW;
				imgW	=  slides.children().width();
				imgH	=  slides.children().height();
				imgRatio	= imgH / imgW;
							
				if(winRatio > imgRatio){
					
					newH	= winH;
					newW	= winH / imgRatio;
					
				}else{
						
					newH	= winW * imgRatio;
					newW	= winW;
						
				}
					
							
					/*set width, height and position of image*/
					slides.children('img').css({width: newW + 'px',height: newH + 'px',left: (winW - newW) / 2 + 'px',top: (winH - newH) / 2 + 'px'});

				}
				
			
				
				
				/*slideshow timer & progress
				-----------------------------*/
				
				function setTimer(){
				
					startProgress();
				
					timer  =  setInterval(function(){ 
							
							startProgress();
							slide('next');
									
					}, es_options.slideShowInterval);

				}
				
				function startProgress(){
					
					$('#progress')
								
								.show()
								.animate({width:'40px'},es_options.slideShowInterval, 'easeInOutQuint', function(){
							
								$(this).css({width:'0'});
								
					});	
					
					
				
				}
				
				//make it public
				$.fn.epicSlider.killTimer = function (){
					clearInterval(timer);
					$('#progress').stop().fadeOut('fast');
					$('div#play').removeClass('active');
					running=false;
				};
				
					
				/*caption handling
				-----------------------------*/
						
				function captionProcess(){
							
					if(currentSlide.attr('title') != ''){
									
						caption = currentSlide.attr('title');	
						if(es_options.fx != 'none'){
							
							$(caption).fadeIn();
							
						}else{
							
							$(caption).show();
								
						}
					}
						
				}
				
				
				/*slide handling
				-----------------------------*/
					
				function slide(dir){
					
				if(currentSlide.is(':animated') || $(this).parent().hasClass('disabled')){return false;}
	
						if(dir == 'next'){
						
						//get currentSlide & nextSlide image	
						currentSlide = slides.children('img.current');
						nextSlide = currentSlide.next('img');
					
						//check & set button states - if previous is disabled then enable it
						if(navPrev.parent().hasClass('disabled')){navPrev.parent().removeClass('disabled');}
						
						//check if we are at the second to last image and if looping is off, if so 
						//disable play and next button for the last slide
						if(slides.find('img').length-2 == currentSlide.index() && es_options.loop === false){
							
							$('#progress').stop().fadeOut('fast');				//kill progress animation
							if(running === true){$.fn.epicSlider.killTimer();}	//kill timer
							navNext.parent().addClass('disabled');				//disable next
							navPlay.parent().addClass('disabled');				//disable play
						
						}
						
						//reached limit
						if(nextSlide.length === 0) { 
						
							//check loop status
							if(es_options.loop === false){
								
								//prevent clicking
								return false;
							
							}else{
								
								//fade out caption								
								$(caption).fadeOut('fast');	
								//move to the first slide								
								nextSlide = slides.children('img:first-child');
							
							}
								 
						}else{
							
							$(caption).fadeOut('fast');
							
						}
						 
						//none
						if(es_options.fx =='none'){
							
							currentSlide
									.removeClass('current')
									.hide();  
							
							nextSlide
									.addClass('current')
									.show();
									currentSlide = slides.children('img.current');
									captionProcess();

						//fade
						}else if(es_options.fx =='fade'){
							
							currentSlide
									.removeClass('current')
									.animate({opacity:0},es_options.transitionSpeed,es_options.easing, function(){$(this).hide();});  
							
							nextSlide
									.addClass('current')
									.css({opacity:0})
									.show()
									.animate({opacity:1},es_options.transitionSpeed,es_options.easing, function(){
										
										currentSlide = slides.children('img.current');
										captionProcess();
										
						});
									
						//slide right to left
						}else if(es_options.fx == 'leftToRight'){
					
							if(es_options.stack === true){
								
								currentSlide
									.css({zIndex:0})
									.removeClass('current')
									.animate({left:((winW - newW) / 2)},es_options.transitionSpeed, es_options.easing, function(){$(this).hide();});
									
							}else{
									
								currentSlide
									.css({zIndex:0})
									.removeClass('current')
									.animate({left:-newW+((winW - newW) / 2)},es_options.transitionSpeed, es_options.easing, function(){$(this).hide();});
							}
							
							nextSlide
								.addClass('current')
								.css({left:newW+((winW - newW) / 2), zIndex:1})
								.show()
								.animate({left:((winW - newW) / 2)},es_options.transitionSpeed, es_options.easing, function(){
									
									currentSlide = slides.children('img.current');
									captionProcess();
								
								});		
							
						//slide top/bottom
						}else if(es_options.fx =='topToBottom'){
							
							if(es_options.stack === true){
								
								currentSlide
									.css({zIndex:0})
									.removeClass('current')
									.animate({top:((winH - newH) / 2)},es_options.transitionSpeed, es_options.easing, function(){$(this).hide();});
							}else{
								
								currentSlide
									.css({zIndex:0})
									.removeClass('current')
									.animate({top:newH+((winH - newH) / 2)},es_options.transitionSpeed, es_options.easing, function(){$(this).hide();});	
							}
							
							nextSlide
								.addClass('current')
								.css({top:-newH+((winH - newH) / 2), zIndex:1})
								.show()
								.animate({top:((winH - newH) / 2)},es_options.transitionSpeed,es_options.easing, function(){
									
									currentSlide = slides.children('img.current');
									captionProcess();
								
								});
						}
					
					}else{
						
						//get currentSlide & nextSlide image							
						currentSlide = slides.children('img.current');
						prevSlide = currentSlide.prev('img');
						
						//check & set button states
						if(navNext.parent().hasClass('disabled')){ navNext.parent().removeClass('disabled');}
						if(navPlay.parent().hasClass('disabled')){navPlay.parent().removeClass('disabled');}
						
						
						if(currentSlide.index()==1 && es_options.loop === false){
							
							navPrev.parent().addClass('disabled');
						
						}
						
						//reached limit	
						if (prevSlide.length === 0) { 
							
							//check loop status 
							if(es_options.loop == false){
								
								navPrev.parent().addClass('disabled');			//disable prev upon start
								return false;									//prevent clicking
							
							}else{
								
								$(caption).fadeOut('fast');						//fade out caption
								prevSlide = slides.children('img:last-child'); //move to last slide
							
							}
						
						} else{
							
							$(caption).fadeOut('fast'); 
						}
					 
						//none
						if(es_options.fx =='none'){
							
							currentSlide
									.removeClass('current')
									.hide();  
							
							prevSlide
									.addClass('current')
									.show();
									currentSlide = slides.children('img.current');
									captionProcess();
						
						//fade
						}else if(es_options.fx =='fade'){
							
							currentSlide
								.removeClass('current')
								.animate({opacity:0},es_options.transitionSpeed, es_options.easing, function(){$(this).hide();});
							
							prevSlide
								.addClass('current')
								.css({opacity:0})
								.show()
								.animate({opacity:1},es_options.transitionSpeed, es_options.easing, function(){
									
									currentSlide = slides.children('img.current');
									captionProcess();
								});   
						
						//slide left to right
						}else if(es_options.fx == 'leftToRight'){

							if(es_options.stack === true){
								
								currentSlide
										.css({zIndex:0})
										.removeClass('current')
										.animate({left:((winW - newW) / 2)},es_options.transitionSpeed, es_options.easing, function(){$(this).hide();});
							
							}else{
								
								currentSlide
										.css({zIndex:0})
										.removeClass('current')
										.animate({left:newW+((winW - newW) / 2)},es_options.transitionSpeed, es_options.easing, function(){$(this).hide();});
							}
							
							prevSlide
								.addClass('current')
								.css({left:-newW+((winW - newW) / 2), zIndex:1})
								.show()
								.animate({left:((winW - newW) / 2)},es_options.transitionSpeed, es_options.easing, function(){
									currentSlide = slides.children('img.current');
									captionProcess();
								});

					//slide top/bottom		
					}else if(es_options.fx =='topToBottom'){

						if(es_options.stack === true){
							
							currentSlide	
									.css({zIndex:0})
									.removeClass('current')
									.animate({top:((winH - newH) / 2)},es_options.transitionSpeed, es_options.easing, function(){$(this).hide();});
						
						}else{
							
							currentSlide
									.css({zIndex:0})
									.removeClass('current')
									.animate({top:-newH+((winH - newH) / 2)},es_options.transitionSpeed, es_options.easing, function(){$(this).hide();});
						
						}

						prevSlide
								.addClass('current')
								.css({top:newH+((winH - newH) / 2), zIndex:1})
								.show()
								.animate({top: ((winH - newH) / 2)},es_options.transitionSpeed, es_options.easing, function(){   
									
									currentSlide = slides.children('img.current');
									captionProcess();
								
								});   
					}
				}
			}

			/*preload
			-----------------------------*/
			
			slides.find('img').each(function(){
				
				//create image object
				var img = new Image();
				
				//store currentSlide image src 
				var path = $(this).attr('src');
					
					$(img).load(function(){
						
						slideLength--;
							
							if(!slideLength){
								slider.css({background:'none'}); //remove loader
								deviceMobile();					//check device
								init();							//init slider
							}
				})
					.attr('src',path)
					.on('error', function(){
						
						alert('check image path or connection');
					
					});
			});	
		
	

	$(window).scroll(function(){
    	if ($(this).scrollTop() > $(this).height()) {
			$.fn.epicSlider.killTimer();
			$(this).removeClass('active');
			running = false;
    	}
	}); }



		//Showing menu SPECIFIC ---------------------------------------------------------------------/
	/*menu
	-------------------*/
	var MenuContent = $('#MenuContent');
	var Evening = $('#Evening');
	var Lunch = $('#Lunch');
	var Specials = $('#Specials');
	var Party = $('#Party');
	var BBQ = $('#BBQ');
	var Christmas = $('#Christmas');


	$('#lunchContainer').click(function (){
		if(MenuContent.is(":hidden")){
			MenuContent.slideDown();
			$("html, body").animate({ scrollTop: $('#lunchContainer').offset().top + 485}, 1000);
		}
		if(MenuContent.is(":visible")){
			Evening.hide();
			Lunch.slideDown();
			Specials.slideUp();
			Party.slideUp();
			BBQ.slideUp();
			Christmas.slideUp();

			$("html, body").animate({ scrollTop: $('#lunchContainer').offset().top + 485}, 1000);
		}

	});

	$('#eveningContainer').click(function (){
		if(MenuContent.is(":hidden")){
			MenuContent.slideDown();
			$("html, body").animate({ scrollTop: $('#eveningContainer').offset().top + 485}, 1000);
		}
		if(MenuContent.is(":visible")){
			Evening.slideDown();
			Lunch.slideUp();
			Specials.slideUp();
			Party.slideUp();
			BBQ.slideUp();
			Christmas.slideUp();
			$("html, body").animate({ scrollTop: $('#eveningContainer').offset().top + 485}, 1000);

		}
	});

	$('#specialsContainer').click(function (){
		if(MenuContent.is(":hidden")){
			MenuContent.slideDown();
			$("html, body").animate({ scrollTop: $('#specialsContainer').offset().top + 485}, 1000);

		}
		if(MenuContent.is(":visible")){
			Evening.slideUp();
			Lunch.slideUp();
			Specials.slideDown();
			Party.slideUp();
			BBQ.slideUp();
			Christmas.slideUp();
			$("html, body").animate({ scrollTop: $('#specialsContainer').offset().top + 485}, 1000);
		}
	});

	$('#partyContainer').click(function (){
		if(MenuContent.is(":hidden")){
			MenuContent.slideDown();
			$("html, body").animate({ scrollTop: $('#partyContainer').offset().top + 180}, 1000);
		}
		if(MenuContent.is(":visible")){
			Evening.slideUp();
			Lunch.slideUp();
			Specials.slideUp();
			BBQ.slideUp();
			Christmas.slideUp();
			Party.slideDown();
			$("html, body").animate({ scrollTop: $('#partyContainer').offset().top + 180}, 1000);
		}
	});

	$('#bbqContainer').click(function (){
		if(MenuContent.is(":hidden")){
			MenuContent.slideDown();
			$("html, body").animate({ scrollTop: $('#bbqContainer').offset().top + 180}, 1000);

		}
		if(MenuContent.is(":visible")){
			Evening.slideUp();
			Lunch.slideUp();
			Specials.slideUp();
			Party.slideUp();
			Christmas.slideUp();
			BBQ.slideDown();
			$("html, body").animate({ scrollTop: $('#bbqContainer').offset().top + 150}, 1000);
		}
	});

	//CHANGE THIS VALUE FOR THE IMAGE GALLERY SCROLL UP CSS HERE
	$('.folio-thumb').animate({ scrollTop: $('.lazy').offset().top + 180}, 1000);

	$('#christmasContainer').click(function (){
		if(MenuContent.is(":hidden")){
			MenuContent.slideDown();
			$("html, body").animate({ scrollTop: $('#christmasContainer').offset().top + 180}, 1000);
		}
		if(MenuContent.is(":visible")){
			Evening.slideUp();
			Lunch.slideUp();
			Specials.slideUp();
			Party.slideUp();
			BBQ.slideUp();
			Christmas.slideDown();
			$("html, body").animate({ scrollTop: $('#christmasContainer').offset().top + 180}, 1000);
		}
	});

	$('#menu-primary li').click(function(){
		MenuContent.hide();
		$('#googleMaps').removeClass('googleMaps');
		$('.section .content').attr('style', 'max-width: 1278px !important');
		$('#TourCover').show();
		$('#closeMaps').remove();
	});

	$('.upArrow').click(function(){
		MenuContent.hide();
		Evening.hide();
		Lunch.hide();
		Specials.hide();
		Party.hide();
		BBQ.hide();
		Christmas.hide();
	})	

		//ROLLOVER SPECIFIC ---------------------------------------------------------------------/
	/*folio
	-------------------*/	
	var wh,
		scrollSpeed = parseInt(udt_global_vars.scroll_speed,10),
		parallaxSpeedFactor = 0.6,
		scrollEase = 'easeOutExpo',
		targetSection,
		sectionLink = 'a.navigateTo',
		menuLinkStr = '.menu ul li a',
		menuLink = $('.menu ul li a'),
		section = $('.section'),
		toggleMenu =$('.mobileMenuToggle'),
		foliothumb = $('.menu-thumb'),
		thumbW,
		thumbH,
		thumbCaption,
		target,
		hoverSpeed=500,
		hoverEase='easeOutExpo';

	foliothumb.on({
		mouseenter: function () {
			//check if device is mobile 
			//or within an inactive filter category
			//or if its video content in which case do nothing
			if(isMobile === true) {
				return false;
			}
			
			thumbW = foliothumb.find('a').find('img').width();
			thumbH = foliothumb.find('a').find('img').height();
			
			//get refrences needed
			thumbCaption = $(this).find('a').attr('title');
			
			//add rolloverscreen
			if(!$(this).find('a').find('div').hasClass('menu-thumb-rollover')) {
				$(this).find('a').append('<div class="menu-thumb-rollover"></div>');
			}
			
			//set it to the image size and fade in
			var hoverScreen = $('.menu-thumb-rollover');
			hoverScreen.css({width:thumbW,height:thumbH});
			
			//make sure caption is filled out
			if (typeof thumbCaption !== 'undefined' && thumbCaption !== false && $(this).find(hoverScreen).is(':empty')) {	
				//construct rollover & animate
				$(this).find(hoverScreen).append('<div class="thumbInfo">'+thumbCaption+'</div>');
				target = $(this).find(hoverScreen);
				target.stop().animate({opacity:1},hoverSpeed, hoverEase);
			}
		},
		mouseleave: function () {
			if(isMobile === true) {
				return false;
			}
			//animate out
			$(this).find('.menu-thumb-rollover').animate({opacity:0},hoverSpeed,'linear',function(){
				//delete rollover
				$(this).remove();
			});
		}
	});


// <![CDATA[
function Hide()
{
document.getElementById('TourCover').style.display='none';
}
// ]]>

$('#downarrow').mouseenter(function(){
	$('img#downarrow').attr("src", "http://bunnyconnellan.ie/wp/wp-content/uploads/2013/06/arrowBrown.png");
});

$('#downarrow').mouseleave(function(){
	$('img#downarrow').attr("src", "http://bunnyconnellan.ie/wp/wp-content/uploads/2013/06/arrowBlue.png");
});
$('#closeMaps').click(function(){
		$('#googleMaps').removeClass('googleMaps');
		$('.section .content').removerAttr('style');
		$('#TourCover').show();
		alert("CLICKED")
});
$("#ClickMe").click(function(){
	$('#googleMaps').addClass('googleMaps');
	$('.section .content').attr('style', 'max-width: 100% !important');	
});


$('.section-button').append('<a class="pagedown navigateTo" id="buttondown" href=""></a>');

var buttoncount = 0;

$('.pagedown').each(function(){
	$('#buttondown').attr('id', buttoncount + "downbutton");
	//console.log(buttoncount+ "downbutton");
	pagedownUrl = "#" +  $(this).parent().parent().parent().next().attr('id');
	//console.log(pagedownUrl);
	$('#' + buttoncount + "downbutton").attr('href', pagedownUrl)
	buttoncount++;
});

//Adding titles to the nav buttons
$('.next').attr('title','Keyboard arrows can be used to easily navigate the Gallery');
$('.prev').attr('title','Keyboard arrows can be used to easily navigate the Gallery');




});//END OF JQUERY FUNCTION($){}
