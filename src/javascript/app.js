/**
 * ...
 * @author zen
 */


var addEvent = function(elem, type, eventHandle) {
	if ( elem.addEventListener ) elem.addEventListener( type, eventHandle, false );
	else if ( elem.attachEvent ) elem.attachEvent( "on" + type, eventHandle );
	else elem["on"+type]=eventHandle;
};

var SoundWheelApp = (function() 
{

	function SoundWheelApp(element) 
	{
		FastClick.attach(document.body);
		if (element) this.append( element );
	}
	
	SoundWheelApp.prototype.append = function(element) 
	{	
		// get the window size Form dimensions
		var width = isNaN(window.innerWidth) ? window.clientWidth : window.innerWidth;
		var height = isNaN(window.innerHeight) ? window.clientHeight : window.innerHeight;
		var dimensions = width > height ? height: width - 24 ;
	
		dimensions = Math.floor( dimensions );
		
		console.log(dimensions);
		
		var soundWheel = new SoundWheel();
		var success = soundWheel.construct(element, dimensions,dimensions);
		if (success)
		{
			var container = document.getElementById( 'soundwheel' );
			//container.style.marginTop = ( -dimensions / 2 ) + 'px';
			soundWheel.create();
			/*
			// now watch for resize events...
			addEvent( window, 'resize' function( event ){
				
				// adjust the css 
				//container.style.marginTop = ( -dimensions / 2 ) + 'px';
			
				// and send the new size to the wheel
				soundWheel.resize( dimensions );
			});
			*/
		}else{
			// error...
			alert( soundWheel.error );
		}
	};
	
	return SoundWheelApp;
	
})();
	
// create our SoundWheel wheel
var view = new SoundWheelApp('application');
