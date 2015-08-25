$(function () {

	$('main').on('scrollstart', function(e) {
		e.preventDefault();
	});

	// タッチイベントの設定
	// var _touch = ('ontouchstart' in document) ? 'touchstart' : 'click';
	// →jQuery mobileのtapイベントを使用

	// 初期設定
	var initLife = 20;
	var maxPlayerNumber = 4;
	var playerNumber = 2;
	var poisonDisp ='none';
	var switchScreen ='cancel';
	var nameDisp = 'hidden';
	var playerLife = [];
	var playerPoison = [];
	var diffLife = [];
	var nameInput = [];
	for (var i = 0; i < maxPlayerNumber; i++) {
		playerLife[i] = initLife;
		diffLife[i] = 0;
	};
	var lsdata = localStorage["setSave"];

	var damageLog;

	resizeCounter(playerNumber);
	settings();

	$('.notice').delay(3000).fadeOut(5000);

	if(lsdata){
		lsdataLoad();
	}else{
		initialize();
	}

	$(window).resize(function(){
		resizeCounter(playerNumber);
	});

	$('.upperside').on('tap', function(e){
		e.preventDefault();
		lifeEvent($('.player').index($(this).parents('.player')),+1);
	});
	$('.lowerside').on('tap', function(e){
		e.preventDefault();
		lifeEvent($('.player').index($(this).parents('.player')),-1);
	});
	$('.poison').on('tap', function(e){
		e.preventDefault();
		poisonEvent($('.player').index($(this).parents('.player')),+1);
	});

	//hover関連の擬似実装
	function timeNow(){ //時刻表記
		var nowTime = new Date(); // 現在日時を得る
		var nowHour = nowTime.getHours(); // 時を抜き出す
		var nowMin = nowTime.getMinutes(); // 分を抜き出す
		var nowSec = nowTime.getSeconds(); // 秒を抜き出す
		var msg = nowHour + "時" + nowMin + "分" + nowSec +"秒";
		return msg;
	}

	function settings(){ //設定周りの項目
		// 設定ウインドウの開閉
		function closeSettings(){
			$('.menu .settings i').removeClass('fa-spin');
			$('.settings-block, .main').removeClass('active');
			setTimeout(function(){
				$('.settings-bg').hide();
			},300);
		}
		function openSettings(){
			$('.menu .settings i').addClass('fa-spin');
			$('.settings-block, .main').addClass('active');
			setTimeout(function(){
				$('.settings-bg').show();
			},300);
		}
		$(document).on('swiperight', function(e){
			e.preventDefault();
			openSettings();
		});
		$('.menu .settings').on('tap', function(e){
			e.preventDefault();
			openSettings();
		});
		$(document).on('swipeleft', function(e){
			e.preventDefault();
			closeSettings();
		});
		$('.settings-bg').on('tap',function(e){
			e.preventDefault();
			closeSettings();
		});


		// リロードボタン
		$('.reload').on('tap', function(e){
			e.preventDefault();
			$(this).find('i').addClass('fa-spin-fast');
			setTimeout(function(){
				$('.reload i').removeClass('fa-spin-fast');
				closeSettings();
			},500);
			initialize();
		});

		//設定の初期化
		$('.setting-reflesh').on('tap', function(e){
			e.preventDefault();
			playerNumber = 2;
			setPlayerNumber(playerNumber);
			initLife = 20;
			poisonDisp = 'none';
			setPoisonDisp(poisonDisp);
			switchScreen = 'cancel';
			cancelFullScreen();
			nameDisp = 0;
			setNameDisp(nameDisp);
			setNameInput('player1', 'player1');
			setNameInput('player2', 'player2');
			setNameInput('player3', 'player3');
			setNameInput('player4', 'player4');
			for (var i = 0; i < maxPlayerNumber; i++) {
				var j = i + 1;
				$('#name-input ul li input').eq(i).val('player'+j);
			}
			$('.setting-group li').removeClass('active');
			$('.setting-group li.default').addClass('active');
			lsdataSet(null,true);
			$(this).find('i').addClass('fa-jump');
			setTimeout(function(){
				$('.setting-reflesh i').removeClass('fa-jump');
			},1000);
		});

		// 設定項目
		$('#player-number span').on('tap', function(e){
			e.preventDefault();
			playerNumber = $(this).data('player_number');
			console.log(playerNumber);
			$(this).parents('.setting-input').find('ul li').removeClass('active');
			$(this).parent().addClass('active');
			setPlayerNumber(playerNumber);
			lsdataSet(null,true);
		});
		$('#life-amount span').on('tap', function(e){
			e.preventDefault();
			initLife = $(this).data('life_amount');
			console.log(initLife);
			$(this).parent().siblings().removeClass('active');
			$(this).parent().addClass('active');
			lsdataSet(null,true);
		});
		$('#poison-counter span').on('tap', function(e){
			e.preventDefault();
			poisonDisp = $(this).data('poison_counter');
			console.log(poisonDisp);
			$(this).parent().siblings().removeClass('active');
			$(this).parent().addClass('active');
			setPoisonDisp(poisonDisp);
			lsdataSet(null,true);
		});
		$('#set-fullscreen span').on('tap', function(e){
			e.preventDefault();
			switchScreen = $(this).data('set_fullscreen');
			console.log(switchScreen);
			$(this).parent().siblings().removeClass('active');
			$(this).parent().addClass('active');
			switchScreen == 'set' ? setFullScreen() : cancelFullScreen();
			lsdataSet(null,true);
		});
		/*$('#set-neversleep span').on('tap', function(e){
			e.preventDefault();
			var switchNeversleep = $(this).data('neversleep');
			console.log(switchNeversleep);
			$(this).parent().siblings().removeClass('active');
			$(this).parent().addClass('active');
			switchNeversleep == 'set' ?  $('#silent')[0].play() :  $('#silent')[0].pause();
		});*/
		$('#name-disp span').on('tap', function(e){
			e.preventDefault();
			nameDisp = $(this).data('name_disp');
			console.log(nameDisp);
			$(this).parent().siblings().removeClass('active');
			$(this).parent().addClass('active');
			setNameDisp(nameDisp);
			lsdataSet(null,true);
		});
		$('#name-input input').on('change', function(){
			var nameInput = $(this).val();
			var nameTarget = $(this).data('player_id');
			console.log(nameInput, nameTarget);
			$(this).parent().siblings().removeClass('active');
			$(this).parent().addClass('active');
			setNameInput(nameInput, nameTarget);
			lsdataSet(null,true);
		});
	}

	function setPlayerNumber(number){ //プレイヤー数変更時
		var mainClass = $('main').hasClass('active') ? 'main active player-number-'+number : 'main player-number-'+number
		$('main').removeClass().addClass(mainClass);
		resizeCounter();
	}

	function setPoisonDisp(status){ //プレイヤー数変更時
		$('.poison').css({'display':status});
		console.log(status);
	}

	function setNameDisp(status){ //名前表示変更時
		$('.name').css({'opacity':status});
		console.log(status);
	}

	function setNameInput(name, targetID){ //名前入力時
		$('#' + targetID + ' .name').text(name);
		console.log('#' + targetID + ' .name');
	}

	function setFullScreen(){ //フルスクリーン化
		if ((document.fullScreenElement && document.fullScreenElement !== null) ||    // alternative standard method
		(!document.mozFullScreen && !document.webkitIsFullScreen)) {              // current working methods
			if (document.documentElement.requestFullScreen) {
				document.documentElement.requestFullScreen();
			} else if (document.documentElement.mozRequestFullScreen) {
				document.documentElement.mozRequestFullScreen();
			} else if (document.documentElement.webkitRequestFullScreen) {
				document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
			}
		}
	}

	function cancelFullScreen(){ //フルスクリーン停止
		if (document.cancelFullScreen) {
			document.cancelFullScreen();
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		} else if (document.webkitCancelFullScreen) {
			document.webkitCancelFullScreen();
		}
	}

	function lsdataSet(target,settings){
		localStorage['setSave'] = 'true';
		if(target){
			localStorage["playerPoison["+target+"]"] = playerPoison[target];
			localStorage["playerLife["+target+"]"] = playerLife[target];
		}else{
			for (var i = 0; i < maxPlayerNumber; i++) {
				localStorage["playerPoison["+i+"]"] = playerPoison[i];
				localStorage["playerLife["+i+"]"] = playerLife[i];
			};
		}
		if(settings){
			localStorage["playerNumber"] = playerNumber;
			localStorage["playerNumberActive"] = $('#player-number ul li').index($('#player-number ul li.active'));
			localStorage["initLife"] = initLife;
			localStorage["initLifeActive"] = $('#life-amount ul li').index($('#life-amount ul li.active'));
			localStorage["poisonDisp"] = poisonDisp;
			localStorage["poisonDispActive"] = $('#poison-counter ul li').index($('#poison-counter ul li.active'));
			localStorage["nameDisp"] = nameDisp;
			localStorage["nameDispActive"] = $('#name-disp ul li').index($('#name-disp ul li.active'));
			localStorage["switchScreen"] = switchScreen;
			localStorage["switchScreenActive"] = $('#set-fullscreen ul li').index($('#set-fullscreen ul li.active'));
			for (var i = 0; i < maxPlayerNumber; i++) {
				localStorage["nameInput["+i+"]"] = $('#name-input ul li input').eq(i).val();
			};
		}
	}

	function lsdataLoad(){ //前回からの続きで表示

		playerNumber = localStorage["playerNumber"];
		initLife = parseInt(localStorage["initLife"]);
		poisonDisp = localStorage["poisonDisp"];
		nameDisp = localStorage["nameDisp"];
		switchScreen = localStorage["switchScreen"];

		setNameDisp(nameDisp);
		switchScreen == 'set' ? setFullScreen() : cancelFullScreen();
		setPlayerNumber(playerNumber);
		setPoisonDisp(poisonDisp);

		$('#player-number ul li').removeClass('active').eq(localStorage["playerNumberActive"]).addClass('active');
		$('#life-amount ul li').removeClass('active').eq(localStorage["initLifeActive"]).addClass('active');
		$('#poison-counter ul li').removeClass('active').eq(localStorage["poisonDispActive"]).addClass('active');
		$('#name-disp ul li').removeClass('active').eq(localStorage["nameDispActive"]).addClass('active');
		$('#set-fullscreen ul li').removeClass('active').eq(localStorage["switchScreenActive"]).addClass('active');

		for (var i = 0; i < maxPlayerNumber; i++) {
			playerLife[i] = parseInt(localStorage['playerLife['+i+']']);
			playerPoison[i] = parseInt(localStorage['playerPoison['+i+']']);
			$(".player").eq(i).find('.life').text(playerLife[i]);
			$(".player").eq(i).find('.poison').text(playerPoison[i]);
			$(".player").eq(i).find('.name').text(playerLife[i]);

			nameInput[i] = localStorage["nameInput["+i+"]"];

			setNameInput(nameInput[i], 'player'+(i+1));
			$('#name-input ul li input').eq(i).val(nameInput[i]);
		};
		resizeCounter();
	}

	function initialize(){ //初期化
		for (var i = 0; i < maxPlayerNumber; i++) {
			playerLife[i] = initLife;
			playerPoison[i] = 0;
			diffLife[i] = 0;
		};
		$('.life').text(initLife);
		$('.diff').text(0);
		$('.poison').text(0);
		resizeCounter();
		lsdataSet(null,true);
		console.log(damageLog);
		damageLog = 'start at ' + timeNow() + '\n';
		console.log('start at ' + timeNow());
		console.log('life is ' + playerLife);
	}

	function resizeCounter(){ //カウンターのフォントサイズ変更
		var winH = $('.player').height();
		var winW = $('.player').width();
		//var actH = number == 2 ? winH : winH / 2;
		//ar actW = winW / 2;
		var size = Math.min(winH,winW);
		var count = 0;
		$('.life').each(function(){
			if(playerLife[count] >= 100){
				$(this).css({'font-size':size * 0.6+'px'});
				$(this).next('.diff').css({'font-size':size * 0.1+'px','margin-top':-size * 0.1});
			}else{
				$(this).css({'font-size':size * 0.8+'px'});
				$(this).next('.diff').css({'font-size':size * 0.1+'px','margin-top':-size * 0.1});
			}
			count++;
		});
		$('.name').css({'font-size':size * 0.1+'px'});
		$('.guide').css({'font-size':size * 0.1+'px'});
		$('.poison').css({'font-size':size * 0.25+'px'});
		//$('.poison:before').css({'height':size * 0.3+'px','width':size * 0.3 * 144 / 283 +'px'});
		//console.log('winH:'+winH+', winW:'+winW+', actH:'+actH+', actW:'+actW+', size:'+size);
	}

	function lifeEvent(target, amount){ //ライフ増減イベント
		var targetID = '#player'+(parseInt(target)+1);
		var targetName = $(targetID + ' .name').text();
		diffLife[target] = diffLife[target] + amount;
		var dispDiffLife = diffLife[target] > 0 ? '+' + diffLife[target] : diffLife[target];
		playerLife[target] = playerLife[target] + amount;
		var LifeDisp = playerLife[target];
		lsdataSet(target);
		$(targetID+' .life').text(playerLife[target]);
		$(targetID+' .diff').text(dispDiffLife).css({'display':'block','opacity':1}).stop().animate({'opacity':0},5000,function(){
			damageLog += timeNow() + ' ' + targetName + ' ' + dispDiffLife + ' ： 計' + LifeDisp + '\n';
			console.log(timeNow() + ' ' + targetName + ' ' + dispDiffLife  + ' ： 計' + LifeDisp + '\n');
			diffLife[target] = 0;
		});
		resizeCounter();
		console.log('life is ' + playerLife);
		console.log('diff is ' + diffLife);
	}
	function poisonEvent(target, amount){ //毒カウンター増（減）イベント
		var targetID = '#player'+(parseInt(target)+1);
		var targetName = $(targetID + ' .name').text();
		playerPoison[target] = playerPoison[target] == 10 ? 0 : playerPoison[target] + amount;
		lsdataSet(target);
		$(targetID+' .poison').text(playerPoison[target]);
		damageLog += timeNow() + ' ' + targetName + ' ' + amount + '毒 ： 計' + playerPoison[target] + '毒\n';

		console.log('life is ' + playerPoison);
	}

	window.document.onkeydown = function(e) { //キー押された時の分岐
		if($('.settings-block').is(':hidden') && !e.ctrlKey && !e.metaKey){
			if(e.keyCode == 65){ //a
				lifeEvent(0,-1)
			}else if(e.keyCode == 83){ //s
				lifeEvent(0,1)
			}else if(e.keyCode == 74){ //j
				lifeEvent(1,-1)
			}else if(e.keyCode == 75){ //k
				lifeEvent(1,1)
			}else if(e.keyCode == 82){ //r
				$('.menu .reload').animate({opacity:0},0).delay(100).animate({opacity:1},0).delay(100).animate({opacity:0},0).delay(100).animate({opacity:1},0).delay(100).animate({opacity:0},0).delay(100).animate({opacity:1},0);
				initialize();
			}else if(e.keyCode == 81){ //q
				poisonEvent(0,-1)
			}else if(e.keyCode == 87){ //w
				poisonEvent(0,1)
			}else if(e.keyCode == 85){ //u
				poisonEvent(1,-1)
			}else if(e.keyCode == 73){ //i
				poisonEvent(1,1)
			}else{return true;}
		}
	}
});

