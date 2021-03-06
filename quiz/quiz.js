$(document).ready(function(){
	//to read data
	var data;
	var count = 0;
	var score = 0;
	const total_question_count = 1;
	var total;
	var quesTimeout;
	var next_question;

	var lvl1, lvl2, lvl3;
	var current_level;

	var lvl1_correct = 0;
	var lvl2_correct = 0;
	var lvl3_correct = 0;

	var badge_url;
	var character;
	var badge;
	var content_url;

	$.ajax({
	  type: "GET",  
	  url: "data.csv",
	  dataType: "text",       
	  success: function(response)  
	  {
		data = $.csv.toObjects(response);

		instruction = data.filter(function (el) {
		  return el.category == "Instruction";
		})[0];

		lvl1 = data.filter(function (el) {
		  return el.difficulty == 1;
		});
		lvl2 = data.filter(function (el) {
		  return el.difficulty == 2;
		});
		lvl3 = data.filter(function (el) {
		  return el.difficulty == 3;
		});

		lvl1 = shuffle(lvl1);
		lvl2 = shuffle(lvl2);
		lvl3 = shuffle(lvl3);

		var questions = []
		for(var i=0; i<total_question_count; i++){
			questions.push(null);
		}

		current_level = 1;
		next_question = instruction;

		generateTrackers(questions);
		generateQuestions(next_question, count);
	  }   
	});

	//load badges
	$.ajax({
	  type: "GET",  
	  url: "badges.csv",
	  dataType: "text",       
	  success: function(response)  
	  {
		var badges = $.csv.toObjects(response);
		//var random_badge = badges[0]; //use to test solution 3
		var random_badge = shuffle(badges)[0]; //use after all html pages made
		

		badge_url = random_badge.url;
		character = random_badge.character;
		description = random_badge.description;
		content_url = "https://sandeep-sthapit.github.io/quiz/index.html"
		badge = {"url": badge_url, "character": character, "description": description}
		modifyMetaElement(badge); //TODO with prerender
		// console.log(badge_url)
		// console.log(character)
	  	// console.log(badge)
	  }   
	});

	function generateTrackers(myData, myCount){
		var scoreHTML = $('#createScore').html();
		var scoreTemplate = Handlebars.compile(scoreHTML);
		var scoreData = scoreTemplate(myData);

		$.when($('#tracker-section').html(scoreData)).done(function(){
			//add events on click
			$(".question-track-item").on('click', function(event) {
				// console.log($(this).attr('class'));
			});
			for (var i=0; i<total_question_count; i++){
				// $('.tracker-'+i+'>p').text((i+1));
			}
		});
	}

	/**
	 * The main/first method of solving our problem with facebook posts. It's a simple workaround
	 * and adds more 'text based' information without images to get closer to what we want to 
	 * show the user.
	 * 
	 * @param {badge} myData the data of a winning badge
	 * @param {content url} content_url 
	 */
	function generateBadge(myData, content_url){
		var badgeHTML = $('#createBadge').html();
		var badgeTemplate = Handlebars.compile(badgeHTML);
		var badgeData = badgeTemplate(myData);

		//for the bg image
		$('.bg-image').addClass('score-bg-img');
		$('.content').css('background-color', 'transparent');

		$.when($('#quiz-content').html(badgeData)).done(function(){
			//add events on click
			$("#tracker-section").hide();
			$('#user-score').text(score);
			$('#total-ques').text(total_question_count);

			$("#share-button").on('click', function(event) {
                runTemporaryWorkaround(myData, content_url);
            });
		});
	}

	/**
	 * SOLUTION 1 - WORKAROUND TO GET MORE DATA TO A POST
	 * The Facebook API has gotten very strict. Adding images
	 * can only be done via metadata hardcoded in the source file.
	 * This might be dynamically injectible via prerendering, which will
	 * communicate with any crawler only after statically bound. For now,
	 * we use Hashtags, and quotes, with creative usage of metadata, to
	 * get near what we want.
	 * 
	 * @param {badge} myData is a hashmap/enumlike object with badge data 
	 * @param {string} content_url a url of the site we are linking the share to
	 */
	function runTemporaryWorkaround(myData, content_url){
		FB.ui({
			method: 'share',
			href: content_url,
			hashtag: "#"+myData.character,
			quote: "That quiz told me I'm a " + myData.character + "!. It describes me as follows: " + myData.description,
		  }, function(response){});
	}

	/**
		 * POTENTIAL SOLUTION 2 - IDEA 1 - REQUIRES DIFFERENT ARCHITECUTRE (NODE BASED)
		 * This will create meta tags to the page prior to load, since
		 * we use pre-loaded data to generate the quiz. This is a potential future
		 * method that we may use to dynamically inject the images in a share.
		 * STATUS: Currently UN-USED, waiting for PRERENDER
		 * This would run at the beginning, and index.html would have no default
		 * meta tags until this made them. Prerender then would 'static'-ify it.
		 * This is an alternative to the method below, modifyMetaElement. This
		 * CREATES meta tags, whereas the other one modifies existing default meta tags.
		 * The idea is that pre-rendering won't push to the crawlers until all the
		 * tags are more or less fixed.
		 * 
		 * @param {String} property the property we want to set for meta tag
		 * @param {String} content the content that we want to add for meta tag
		 */
		function createMetaElement(property, content){
			var link = document.createElement('meta');
			link.setAttribute('property', property);
			link.content = content;
			document.getElementsByTagName('head')[0].appendChild(link);
		}

		/**
		 * POTENTIAL SOLUTION 2 - IDEA 2 REQUIRES DIFFERENT ARCHITECUTRE (NODE BASED)
		 * This is also usable after preloading is done (if done). The purpose
		 * is to modify existing meta tags, unlike the above - this may be 
		 * faster than creating new meta elements.
		 * STATUS: Currently UN-USED, waiting for PRERENDER
		 * Effect would run anytime, likely at the beginning, but would just
		 * 'rewrite' existing components (like better performance than above) 
		 * before web scrapers (twitter, google, facebook, etc... look at it)
		 * 
		 * @param {badge} myData a hashmap/enum like object with badge data 
		 */
		function modifyMetaElement(myData){
			$("meta[property='og:title']").attr("content", myData.character);
			$("meta[property='og:image']").attr("content", myData.url);
			$("meta[property='og:description']").attr("content", myData.description);
		}

		/**
		 * SOLUTION 3 - HTML STATICALLY PLACED - WORKS for what we want.
		 * To use this, replace the 'generateBadge' above with this one, and
		 * ensure that you have created the badge/html for all students! (This 
		 * requires copying and pasting Teacher.html for all of them, then
		 * adding the meta tags! However, once done, they can be used at any
		 * point during usage, and they will never be greater than some constant
		 * number so it won't impact performance.)
		 * This creates a bunch of static HTML pages per each badge that we have.
		 * This means that whatever badge the user chooses, it will open a HTML
		 * page that has already had the static meta tags put into it. The issue
		 * with this approach is that usually we want to link to the main page
		 * and facebeook uses the main page of the meta tags. You can test this is 
		 * working, but it requires some recreative redirecting (see my single example, 
		 * the rest can be added via duplicating it for all the cards, and we have a 
		 * constant number of cards so this is still feasible). If only facebook 
		 * was more lenient like it used to be in 2018 (sigh... @ privacy concerns, haha).
		 * Note the images must also not be svg for og meta tags. If it doesn't catch it,
		 * go to the Facebook dev page and scrape it! Note that I've proven this example
		 * but only for the teacher - the other pages must be created. More info on the 
		 * README.
		 * 
		 * @param {badge} myData the badge data for the winner 
		 * @param {string} content_url the URL for the webpage that we want facebook to hit 
		 */
		function generateBadgeSolution3(myData, content_url){
			sessionStorage.setItem("myData", JSON.stringify(myData));
			sessionStorage.setItem("score", JSON.stringify(score));
			sessionStorage.setItem("totalQuestionCount", JSON.stringify(total_question_count));
			//save to local storage
			document.location = "./badges/"+myData.character+".html";
			//open new page where this is pulled up
		}

		


	function generateQuestions(myData, myCount){
		var currentData = myData;
		var isQuestion = true;
		var hasExplanation = true;
		$('#tracker-section').show(0);
		$('.bg-image').removeClass('covid-img');
		$('.content').css('background-color', '#FBF9D2');
		if(currentData.category.trim() == "" ){
			hasExplanation = false;
		}
		if (currentData.category == "Instruction") {
			currentData.instruction = true;
			isQuestion = false;
			$('#tracker-section').hide(0);
			$('.bg-image').addClass('covid-img');
			$('.content').css('background-color', 'transparent');
		} else{
			var otheroptions = [currentData.other1, currentData.other2, currentData.other3, currentData.other4, currentData.other5];
			var others = otheroptions.filter(function (el) {
				 return el.trim() != "";
			});
			var options = shuffle(others);
			if(options.length >= 4) {
				// console.log(options);
				options = options.slice(0, 3);
			}
			currentData.other = shuffle(options);
			// console.log(options);
		}

		// console.log(currentData);

		var quizHTML = $('#createQuestions').html();
		var quizTemplate = Handlebars.compile(quizHTML);
		var quizData = quizTemplate(currentData);

		// console.log(quizData)
		$.when($('#quiz-content').html(quizData)).done(function(){
			
			if(isQuestion){
				$('.tracker-'+(count-2)).removeClass('active-tracker');
				$('.tracker-'+(count-1)).addClass('active-tracker');
				var wrongClicked = false;
				$('#question-number-indicator').text('Question '+ String(count) +'/'+ String(total_question_count));
				shuffleOptions('answer-block', 'answer-text');

				$(".answer-option").on('click', function(event) {
					$('.tracker-'+(count-1)).removeClass('active-tracker');
					if($(this).hasClass('correct-answer')){

						$(".answer-option").css("pointer-events", "none");
						// $(this).addClass('correct-ans');
						$(this).css({'background-color': '#59C057', 'border-color': '#59C057',  'color': 'white'});

						if(!wrongClicked){	
							score++;
							on_correct_counter(current_level);
							$('.tracker-'+(count-1)).css('background-color', '#59C057');
							$('.tracker-'+(count-1)).css('border', 'none');
						}

						if(hasExplanation){
							quesTimeout = setTimeout(function(){
								$('.explanation-text').fadeIn(250, function(){
								});
								$("#next-button").fadeIn(250);
							}, 500);							
						} else{
							$("#next-button").show(0);
						}
					} else{
						$(this).css("pointer-events", "none");
						// $(this).addClass('incorrect-ans');
						$(this).css({'background-color': '#FA9B80', 'border-color': '#FA9B80',  'color': 'white'});
						if(!wrongClicked){	
							$('.tracker-'+(count-1)).css('background-color', '#F95841');
							$('.tracker-'+(count-1)).css('border', 'none');
						}	
						wrongClicked = true;
					}
				});
			}

			$("#next-button").on('click', function(event) {
				next_question = get_next_question(current_level);
				if(count == total_question_count){
					generateBadge(badge, content_url); //exchange with below to see the 3rd solution
// 					generateBadgeSolution3(badge, content_url); //for readability
					$('#quiz-content').css('top', '0');
					$('#quiz-content').css('height', '100%');
					return false;
				} else{
					count++;
					$(this).hide(0);
					generateQuestions(next_question, count);
				}
			});
		});

	}

	function get_next_question(lvl){
		if(lvl == 1){
			return lvl1.pop(); 
		}else if(lvl == 2){
			return lvl2.pop(); 
		}else if(lvl == 3){
			return lvl3.pop(); 
		}
	}

	function on_correct_counter(lvl){
		if(current_level == 1){
			lvl1_correct++;
		}else if(current_level == 2){
			lvl2_correct++;
		}else if(current_level == 3){
			lvl3_correct++;
		}
		if(lvl1_correct == 5){
			current_level = 2;
		}
		if(lvl2_correct == 3){
			current_level = 3;
		}
	}

	
	function getRandom(arr, n) {
	    var result = new Array(n),
	        len = arr.length,
	        taken = new Array(len);
	    if (n > len)
	        throw new RangeError("getRandom: more elements taken than available");
	    while (n--) {
	        var x = Math.floor(Math.random() * len);
	        result[n] = arr[x in taken ? taken[x] : x];
	        taken[x] = --len in taken ? taken[len] : len;
	    }
	    return result;
	}

	// function to shuffle options
	function shuffleOptions(optionContainerID, optionsClass) {
		var container = document.getElementById(optionContainerID);
		var elementsArray = Array.prototype.slice.call(container.getElementsByClassName(optionsClass));
		    elementsArray.forEach(function(element){
		    container.removeChild(element);
		})
		shuffle(elementsArray);
		elementsArray.forEach(function(element){
			container.appendChild(element);
		})
	}

	function shuffle(a) {
	    var j, x, i;
	    for (i = a.length - 1; i > 0; i--) {
	        j = Math.floor(Math.random() * (i + 1));
	        x = a[i];
	        a[i] = a[j];
	        a[j] = x;
	    }
	    return a;
	}

});

