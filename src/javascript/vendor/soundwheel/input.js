var Input = (function() {

	"use strict";
	
	var keyPressedAt;	// duration that key was held / is being held for...
	
	var shift = false, ctrl = false, alt = false;
	
	var addListener = function(type, method){
		if (window.addEventListener) document.addEventListener(type, method, false);
		else if (window.attachEvent) document.attachEvent('on'+type, method);
		else window["on"+type] = method;
	};
	var removeListener = function( type, method ){
		if( window.removeEventListener )document.removeEventListener(type, method, false);
		else if(window.detachEvent) document.detachEvent('on'+type, method);
		else window["on"+type] = method;
	};
	
	var dispatch = function( keyCode, callbacks, duration ) 
	{
		for ( var c=0, l = callbacks.length; c < l ; ++c)
		{
			var callback = callbacks[ c ],
				method = callback.method,
				scope = callback.scope;
		
			// loop through callbacks
			if (duration) method.call( scope, keyCode, shift, ctrl, alt, duration );
			else method.call( scope, keyCode, shift, ctrl, alt );
			//console.log(keyCode, shift, ctrl, alt, duration, method, scope);
		}
	};
	
	var Input = {};
	
	Input.keyHeld = -1;
	Input.isKeyHeld = false;
	Input.keyDownCallbacks = [];
	Input.keyUpCallbacks = [];
	
	Input.dispatchKeyDown = function( keyCode ) 
	{
		dispatch( keyCode, Input.keyDownCallbacks );
	};
	
	Input.dispatchKeyUp = function( keyCode,duration )
	{
		dispatch( keyCode, Input.keyUpCallbacks, duration  );
	};
	Input.onKeyDown = function( callback, scope, remove, preventDefault ) 
	{
		// strip out keycode and return in callback
		var onKey = function (event)
		{
			var keyCode = event.keyCode || event.which;
			Input.keyHeld = keyCode;
			keyPressedAt = Date.now();
			 
			shift = event.shiftKey;
			alt = event.altKey;
			ctrl = event.ctrlKey;
			//e.metaKey;
			
			Input.dispatchKeyDown( keyCode );
			
			if (preventDefault) return false;	
		};
	
		Input.keyDownCallbacks.push( { method:callback , scope:scope } );
		
		if ( remove ) removeListener('keydown', onKey);
		else addListener('keydown', onKey);
	};

	Input.onKeyUp = function( callback, scope, remove, preventDefault ) 
	{
		// strip out keycode and return in callback
		var onKey = function (event)
		{
			var keyCode = event.keyCode || event.which;
			
			// modifiers...
			if ( keyCode > 15 && keyCode < 19) return;
			
			var duration = Date.now() - keyPressedAt;
			Input.dispatchKeyUp( keyCode, duration );

			shift = alt = ctrl = false;
			Input.keyHeld = -1;
			
			if (preventDefault) return false;	
		};
		
		Input.keyUpCallbacks.push( { method:callback , scope:scope } );
		
		if ( remove ) removeListener('keyup', onKey);
		else addListener('keyup', onKey);
	};
	
	Input.onGamePad = function( callback, scope, remove, preventDefault ) {
		
		var onPad = function(event)
		{
			
		};
		
		var gamepads = navigator.getGamepads(); 
		for (var i = 0; i <gamepads.length; i++) 
		{   
			var gamepad = gamepads[i];   
			console.log(gamepad.id);   
			console.log(gamepad.index);   
			console.log(gamepad.buttons);   
			console.log(gamepad.axes); 
		}
		
		window.addEventListener("gamepadconnected", onPad);
		window.addEventListener("gamepaddisconnected", onPad); 		
	};
	

	Input.onMouseWheel = function( callback, scope, remove, preventDefault ) 
	{
		var onWheel = function(event)
		{
			event = window.event || event; // old IE support
			var delta = Math.max(-1, Math.min(1, ( event.wheelDelta || -event.detail )));
			callback.call( scope, delta );

			if (preventDefault) 
			{
				event.preventDefault();
				return false;
			}
		};
		
		if ( remove ) removeListener('mousewheel', onWheel);
		else addListener('mousewheel', onWheel);
	};
	
	return Input;
})();