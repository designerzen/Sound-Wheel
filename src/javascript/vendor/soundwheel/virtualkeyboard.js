/*

Just a handy class that listens for button presses from the virtual keyboard
and uses the associated class names to trigger an Input.event()

*/

(function(window, document) {
	
	"use strict";
	
	// find keyboard div...
	var keyboard = document.getElementById("keyboard"),
		startTime = -1;
	
	var getWhich = function(e) 
	{
		if (!e.which && e.button) 
		{
			if (e.button & 1) return 1;      // Left
			else if (e.button & 4) return 2; // Middle
			else if (e.button & 2) return 3; // Right
		}
		return e.which;
	};
	
	var pfx = ["webkit", "moz", "ms", "o", ""];
	var RunPrefixMethod = function (obj, method) {
		
		var p = 0, m, t;
		while (p < pfx.length && !obj[m]) {
			m = method;
			if (pfx[p] == "") {
				m = m.substr(0,1).toLowerCase() + m.substr(1);
			}
			m = pfx[p] + m;
			t = typeof obj[m];
			if (t != "undefined") {
				pfx = [pfx[p]];
				return (t == "function" ? obj[m]() : obj[m]);
			}
			p++;
		}
	};

	// find all buttons and labels...
	var inputs = keyboard.getElementsByTagName("button");
	//inputs.concat( keyboard.getElementsByTagName("label") );
	
	for (var i = 0; i < inputs.length; i++) 
	{
		var input = inputs[ i ],
			keyCode = parseInt( input.value );
			
		var down = function(e){
			var which = getWhich(e);
			if (which>1) return;
			keyCode = parseInt( this.value );
			startTime = Date.now();
			
			// F11 - Fullscreen :P
			if ( keyCode === 122 )
			{
				if (RunPrefixMethod(document, "FullScreen") || RunPrefixMethod(document, "IsFullScreen")) RunPrefixMethod(document, "CancelFullScreen");
				else RunPrefixMethod(e, "RequestFullScreen");
				return;
			}
			
			//console.log(keyCode+ ' down '+e.which );
			Input.dispatchKeyDown( keyCode );
		};
		
		var up = function(e){
			var duration = Date.now() - startTime;
			var which = getWhich(e);
			if (which>1) return;
			Input.dispatchKeyUp( keyCode, duration );
		};
		
		// attach click events...	
		input.mousedown = down
		input.onmousedown = down
		
		input.mouseup = up;
		input.onmouseup = up;
	};
	
})( window, document);