$(function () {

	$('main').on('touchmove', function(e) {
		e.preventDefault();
	});

	// タッチイベントの設定
	// var _touch = ('ontouchstart' in document) ? 'touchstart' : 'click';
	// →jQuery mobileのtapイベントを使用

	document.addEventListner

	// 初期設定
	var initLife = 20;
	var maxPlayerNumber = 4;
	var playerNumber = 2;
	var nameDisp = 'hidden';
	var playerLife = [];
	var playerPoison = [];
	var diffLife = [];
	for (var i = 0; i < maxPlayerNumber; i++) {
		playerLife[i] = initLife;
		diffLife[i] = 0;
	};

	var damageLog;

	resizeCounter(playerNumber);
	initialize();
	settings();

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

	$('.menu .reload').on('tap', function(e){
		e.preventDefault();
		$(this).animate({opacity:0},0).delay(100).animate({opacity:1},0).delay(100).animate({opacity:0},0).delay(100).animate({opacity:1},0).delay(100).animate({opacity:0},0).delay(100).animate({opacity:1},0);
		initialize();
	});

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
		$('.menu .settings').on('tap', function(e){
			e.preventDefault();
			$(this).animate({opacity:0},0).delay(100).animate({opacity:1},0).delay(100).animate({opacity:0},0).delay(100).animate({opacity:1},0).delay(100).animate({opacity:0},0).delay(100).animate({opacity:1},0);
			$('.settings-block').fadeIn(300,function(){
				$('.settings-bg').show();
			});
		});
		$('.settings-block .close-btn, .settings-bg').on('tap',function(){
			$('.settings-block').fadeOut(300,function(){
				$('.settings-bg').hide();
			});
		});

		// 設定項目
		$('#player-number span').on('tap', function(e){
			e.preventDefault();
			playerNumber = $(this).data('player_number');
			console.log(playerNumber);
			$(this).parents('.setting-input').find('ul li').removeClass('active');
			$(this).parent().addClass('active');
			setPlayerNumber(playerNumber);
		});
		$('#life-amount span').on('tap', function(e){
			e.preventDefault();
			initLife = $(this).data('life_amount');
			console.log(initLife);
			$(this).parent().siblings().removeClass('active');
			$(this).parent().addClass('active');
		});
		$('#poison-counter span').on('tap', function(e){
			e.preventDefault();
			var poisonDisp = $(this).data('poison_counter');
			console.log(poisonDisp);
			$(this).parent().siblings().removeClass('active');
			$(this).parent().addClass('active');
			setPoisonDisp(poisonDisp);
		});
		$('#set-fullscreen span').on('tap', function(e){
			e.preventDefault();
			var switchScreen = $(this).data('set_fullscreen');
			console.log(switchScreen);
			$(this).parent().siblings().removeClass('active');
			$(this).parent().addClass('active');
			switchScreen == 'set' ? setFullScreen() : cancelFullScreen();
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
		});
		$('#name-input input').on('change', function(){
			var nameInput = $(this).val();
			var nameTarget = $(this).data('player_id');
			console.log(nameInput, nameTarget);
			$(this).parent().siblings().removeClass('active');
			$(this).parent().addClass('active');
			setNameInput(nameInput, nameTarget);
		});
	}

	function setPlayerNumber(number){ //プレイヤー数変更時
		$('main').removeClass().addClass('main player-number-'+number);
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
		$(targetID+' .poison').text(playerPoison[target]);
		damageLog += timeNow() + ' ' + targetName + ' ' + amount + '毒 ： 計' + playerPoison[target] + '毒\n';

		console.log('life is ' + playerPoison);
	}

	function onKeyEvent() { //キー押された時の分岐
		if(window.event.keyCode == 65){ //a
			lifeEvent(0,-1)
		}else if(window.event.keyCode == 83){ //s
			lifeEvent(0,1)
		}else if(window.event.keyCode == 74){ //j
			lifeEvent(1,-1)
		}else if(window.event.keyCode == 75){ //k
			lifeEvent(1,1)
		}else if(window.event.keyCode == 82){ //r
			$('.menu .reload').animate({opacity:0},0).delay(100).animate({opacity:1},0).delay(100).animate({opacity:0},0).delay(100).animate({opacity:1},0).delay(100).animate({opacity:0},0).delay(100).animate({opacity:1},0);
			initialize();
		}else if(window.event.keyCode == 81){ //q
			poisonEvent(0,-1)
		}else if(window.event.keyCode == 87){ //w
			poisonEvent(0,1)
		}else if(window.event.keyCode == 85){ //u
			poisonEvent(1,-1)
		}else if(window.event.keyCode == 73){ //i
			poisonEvent(1,1)
		}else{return true;}
	}
	window.document.onkeydown= onKeyEvent;
});

