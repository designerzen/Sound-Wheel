var SoundWheel = (function() {

	"use strict";
	
	// Constants
	var DEBUG = false;
	var NAME_SPACE = "SoundWheel.";
	
	var DEGREES_TO_RADS = 180/Math.PI ; 
	var RADS_TO_DEGREES = Math.PI / 180;
	var ROTATOR_OFFSET = 45 * DEGREES_TO_RADS;
	var NODE_RADIUS = 20;
	var FONT_FAMILY = '"Bitter-Regular",Helvetica,Arial,sans-serif';
	//var FONT_FAMILY = '"BPReplayBold", Arial,"Helvetica Neue", Helvetica, sans-serif';
	
	var config = {
		font:FONT_FAMILY,
		workerPath : 'javascripts/vendor/recorder/recorderWorker.js',
		sizeFactor : 0.4
	};
	
	var copy = {
		h1 : 'S o u n d W h e e l',
		h2 : 'H a r m o n i c s   G e n e r a t o r'
	};
	
	var createID = function( l )
	{
		return (Math.random().toString(16)+"000000000").substr(2,l||8);
	};
	
	
	
	var timecode = function ( milliseconds ) 
	{
		var ms = ~~(milliseconds),
			seconds = ~~(ms*0.001),
			hours = ~~(seconds / 3600);
		seconds -= hours*3600;
		var minutes = ~~(seconds / 60);
		seconds -= minutes*60;

		if (hours   < 10) hours   = "0"+hours;
		if (minutes < 10) minutes = "0"+minutes;
		if (seconds < 10) seconds = "0"+seconds;
		//if (ms < 10) ms = "0"+ms;
		else ms = String( ms ).slice(-1);
		return hours+':'+minutes+':'+seconds+':'+ms;
	};
	// CONSTRUCTOR -------------------------------------------------------------------------
	
	function SoundWheel() 
	{
		this.tooltipShowing = false;
		this.isRecording = false;
		this.recordStart;
		this.allowSaving = false;
	}
	
	// AUDIO ------------------------------------------------------------------------------
	
	SoundWheel.prototype.createAudio = function()
	{
		try {
			var dsp = new AudioContext();
			// 8-bit
			// dsp.sampleRate = 22050;
			return dsp;
			
		} catch(error) {
			
			return false;
		}
		
		//alert( new AudioContext() );
		/*
		try {
			// AudioContext itself is polyfilled but here we Fix up for prefixing if it has failed
			//window.AudioContext = AudioContext || window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
			
			
			var dsp = new AudioContext();
			dsp.sampleRate = 22050;
			return dsp;
			
		} catch(error) {
			
			return false;
		}*/
	};
	
	// RECORD -----------------------------------------------------------------------------
	
    SoundWheel.prototype.createRecordButton = function(x,y) 
	{
		var self = this;
		var rec = new Kinetic.Label({
			x: x,
			y: y
		});

		var text = new Kinetic.Text({
			text: 'RECORD',
			fontFamily: FONT_FAMILY,
			fontSize: 18,
			padding: 0,
			fill: 'white',
			x: 0,
			y: 20
		});
		var midW = text.width() / 2;
		
		var icon = new Kinetic.Circle({
			x: midW,
			y: 0,
			radius: 10,
			fill: 'red',
			stroke: 'black',
			strokeWidth:2
		});
		
		var bg = new Kinetic.Circle({
			x: midW,
			y: 0,
			radius: 14,
			fill: 'black',
			stroke: 'red',
			strokeWidth:1
		});
		/*var bg = new Kinetic.Square({
			x: midW,
			y: 0,
			width: midW,
			height: midW,
			fill: 'black',
			stroke: 'red',
			strokeWidth:2
		});*/
		// move origin to bottom right
		rec.add( bg ).add( icon ).add( text );
		rec.offset( {x:rec.width() , y:rec.height()} );
		
		rec.icon = icon;
		
		rec.on('mouseover', function(evt) {
			self.setCursor('pointer');
			self.moveTip( bg, midW );
			if (!self.isRecording) self.showTip( "Click to\nStart recording" );
			else self.showTip( "Click to\nStop recording" );
			
		});
		rec.on('mouseout', function(evt) {
			self.setCursor('default');
			self.hideTip( );
			
		});
		
		rec.on('mousedown touchstart', function(evt) {
			if (self.isRecording) self.stopRecording();
			else self.startRecording();
		});
		
		return rec;
	};
	
	SoundWheel.prototype.startRecording = function()
	{
		if ( this.isRecording ) return;
		if ( !this.recorder ) this.recorder = new Recorder( NodeFactory.getGain() ,config );
		
		// update UI
		this.feedbackText( 'Recording...' );
		this.recButton.getText().setText( "*STOP*" );
		this.gadgets.draw();
			
		this.recorder.record();
		this.isRecording = true;
		this.recordStart = Date.now();
		
		console.log('Recording started at '+this.recordStart );
	};
	
	SoundWheel.prototype.stopRecording = function()
	{
		var self = this;
		var duration = Date.now() - this.recordStart;
		
		if ( !this.isRecording ) return;
		console.log('Recording Completed '+duration+' ms');
		
		var onRecordingSaved = function(){
			self.recButton.getText().setText( 'RECORD' );
			self.gadgets.draw();
			self.feedbackText( 'Saved!' );
			console.log('Recording Saved');
		};
		
		var onRecordingCompleted = function( blob ){
			var fileName = 'PhotoSynth-'+createID( 5 )+'.wav';
			// update UI
			self.feedbackText( parseInt(duration*0.1)*0.01 +' seconds' );
		
			// Save to desktop
			Recorder.forceDownload(blob, fileName );
			self.gadgets.draw();
			
			self.recorder.clear();
			self.isRecording = false;
			
			setTimeout( onRecordingSaved, 1200 );
			
			console.log('Recording Ready');
		};
		
		this.recorder.stop();
		this.recorder.exportWAV( onRecordingCompleted );
	};
	
	// Successfully completed SETUP
	SoundWheel.prototype.setVolume = function( volume )
	{
		NodeFactory.setVolume( volume );
		volume = NodeFactory.getVolume();
		var amp = (volume*100)>>0;
		this.feedbackText( 'Volume : '+amp +'%');
		if (!this.allowSaving) return;
		var key = NAME_SPACE+"vol";
		localStorage.setItem( key, volume );
	};
	
	// COLOURS ---------------------------------------------------------------------------
	
	// Fetch the colour at this position on the colour wheel
    SoundWheel.prototype.getColour = function( x, y, centralise ) 
	{
		if (true)
		{
			var offset = this.margin;
			x -= offset;
			y -= offset;
		}
	
		return this.colourWheel.getPixelRGB( x, y, true );
		//return this.colourWheel.getColours( x, y );
	};
	
	
	// I / O ------------------------------------------------------------------------------
	
	SoundWheel.prototype.saveOrLoad = function( memoryBank, forceSave ) 
	{
		if (!this.allowSaving) return;
	
		var key = NAME_SPACE+"data";
		if ( memoryBank ) key += '-'+memoryBank;
		var data = localStorage.getItem( key );
		if ( data )
		{
			console.log(key+ ' loaded : '+data );
			NodeFactory.fromJSON( data );
			this.feedbackText( 'Loaded from memory bank '+memoryBank );
		}else{
			data = NodeFactory.toJSON();
			if (data) localStorage.setItem( key, data );
			console.log(key+ ' saved : '+data );
			this.feedbackText( 'Saved to memory bank '+memoryBank );
		}
	};
	
	SoundWheel.prototype.load = function( memoryBank ) 
	{
		if (!this.allowSaving) return;
	
		var key = NAME_SPACE+"data";
		if ( memoryBank ) key += '-'+memoryBank;
		var data = localStorage.getItem( key );
		if ( data ) NodeFactory.fromJSON( data );
		console.log(key+ ' loaded : '+data );
		this.feedbackText( 'Loaded to memory bank '+memoryBank );
	};
	
	SoundWheel.prototype.loadPreset = function( preset ) 
	{
		if (!this.allowSaving) return;
		var presets = SoundWheel.PRESETS;
		preset = 'k'+preset;
		var data = presets.hasOwnProperty( preset ) ? presets[ preset ] : null;
		console.log(' loaded : '+preset, data );
		if ( data )NodeFactory.fromJSON( data );
		
		this.feedbackText( 'Loaded preset '+preset );
	};
	
	SoundWheel.prototype.save = function( memoryBank ) 
	{
		if (!this.allowSaving) return;
	
		var data = NodeFactory.toJSON();
		if ( data === "[]" ) return;
		
		var key = NAME_SPACE+"data";
		if ( memoryBank ) key += '-'+memoryBank;
		if (data) localStorage.setItem( key, data );
		console.log(key+ ' saved : '+data );
		
		this.headingText( 'Saved' );
		this.feedbackText( 'to Memory Bank '+memoryBank );
	};
	
	SoundWheel.prototype.clearMemory = function( memoryBank ) 
	{
		if (!this.allowSaving) return;
		var key = NAME_SPACE+"data";
		if ( memoryBank ) key += '-'+memoryBank;
		localStorage.removeItem( key );
		console.log( 'cleared main mem' );
			
		this.headingText( 'Cleared!' );
		this.feedbackText( 'Memory Bank '+memoryBank );
	};
	
	SoundWheel.prototype.clearAllMemory = function() 
	{
		if (!this.allowSaving) return;
		var key = NAME_SPACE+"data";
		localStorage.removeItem( key );
		// loop through numbers 0 -> 999
		for ( var memoryBank=0; memoryBank < 99; memoryBank++ )
		{
			var local = key+'-'+memoryBank;
			localStorage.removeItem( local );
			console.log( 'cleared all mem' );
			
		}this.headingText( 'Cleared!' );
		this.feedbackText( 'All Memory Banks' );
	};
	
	// CURSOR -----------------------------------------------------------------------------
	
	var currentCursor = "default";
	SoundWheel.prototype.setCursor = function( type ){
		if ( type === currentCursor ) return;
		//switch(type){}
		currentCursor = document.body.style.cursor = type;
	};
	
	// TOOLTIP -----------------------------------------------------------------------------
   
	SoundWheel.prototype.createToolTip = function(element) 
	{
		// tooltip
		var tooltip = new Kinetic.Label({
			x: 170,
			y: 75,
			listening : false,
			opacity: 0.75,
			visible : false
		});

		tooltip.add(new Kinetic.Tag({
			fill: 'black',
			pointerDirection: 'down',
			pointerWidth: 10,
			pointerHeight: 10,
			lineJoin: 'round',
			listening : false,
			shadowColor: 'black',
			shadowBlur: 12,
			shadowOffset: {x:4,y:4},
			shadowOpacity: 0.3
		}));

		tooltip.add(new Kinetic.Text({
			text: 'CLICK ME!',
			fontFamily: FONT_FAMILY,
			fontSize: 15,
			padding: 6,
			listening : false,
			fill: 'white'
		}));

		// tooltip.cache();
		return tooltip;
	};
	
	SoundWheel.prototype.moveTip = function( node, offsetX, position )
	{
		var pos = position || node.getAbsolutePosition();
		pos.y -= offsetX || 0;
		//self.tooltip.setPosition(mousePos.x, mousePos.y - 5);
		this.tooltip.setAbsolutePosition(pos);
		//self.tooltip.getText().setText("node: " + mousePos.x + ", color: " + mousePos.y);
		this.tipLayer.batchDraw();
	};
	
	SoundWheel.prototype.showTip = function( text )
	{
		if ( this.tooltipShowing == false) this.tooltip.show();
		
		//if ( this.tooltipShowing === true) return;
		this.tooltipShowing = true;
		
		var existingText = this.tooltip.lastText;
		if ( existingText === text ) return;
		this.tooltip.lastText = text;
		
		this.tooltip.getText().setText(text);
		this.tipLayer.batchDraw();
	};
	
	SoundWheel.prototype.hideTip = function()
	{
		if ( this.tooltipShowing === false) return;
		this.tooltipShowing = false;
		
		this.tooltip.hide();
		this.tipLayer.batchDraw();
	};
	
	// WHEEL -----------------------------------------------------------------------------
   
	// Create ColourWheel View
    SoundWheel.prototype.createWheel = function(image) 
	{
		var cx = this.stage.getWidth() / 2;
		var cy = this.stage.getHeight() / 2;
		
		var wheel = new Kinetic.Circle({
			x: cx,
			y: cy,
			radius: this.radius,
			//fill: Kinetic.Util.getRandomColor(),
			fillPatternImage : image,
			fillPatternOffset : { x:-this.radius, y:-this.radius },
			stroke: 'black',
			strokeWidth: 4,
			shadowEnabled:true,
			shadowColor: 'black',
			shadowBlur: 12,
			shadowOffset: {x:0,y:1},
			shadowAlpha: 0.5,
			shadowOpacity: 0.5,
			id : 0
		});
			
		wheel.image = image;
		//wheel.cache();
		return wheel;
	};
	 
	// Create a new Sound Node
    SoundWheel.prototype.createNode = function( x, y ) 
	{
		if ( NodeFactory.getQuantity() === 0 ) 
		{
			this.rotator.reveal();
			this.bottomLayer.batchDraw();
		}
		return NodeFactory.create( x, y, NODE_RADIUS );
	};
		
	// remove this node from the system
    SoundWheel.prototype.removeNode = function( node ) 
	{
		NodeFactory.destroy( node );
		this.nodeLayer.batchDraw();
		if ( NodeFactory.getQuantity() < 1 )
		{
			this.rotator.hide();
			this.bottomLayer.batchDraw();
		}
	};
		
	// remove this node from the system
    SoundWheel.prototype.removeAllNodes = function() 
	{
		NodeFactory.destroyAll( );
		this.nodeLayer.batchDraw();
		this.feedbackText( 'Clear' );
	};
	
	// FEEDBACK ------------------------------------------------------------------------
	var interval, intervalB;
	SoundWheel.prototype.feedbackText = function( text, clearAfterTime ) 
	{
		var self = this;
		this.subHeading.setText( ' ' + text+ ' '  );
		this.feedback.getText().setText( text );
		this.textLayer.batchDraw();
		clearInterval( interval );
		console.log('feedbackText');
		if (clearAfterTime != false )
		{
			// call a 
			
			
			interval = setTimeout( function(){self.feedbackText( copy.h2,false); }, 2400 );
		}
	};
	SoundWheel.prototype.headingText = function( text, clearAfterTime ) 
	{
		var self = this;
		this.heading.setText( ' ' + text+ ' '  );
		this.textLayer.batchDraw();
		clearInterval( intervalB );
		if (clearAfterTime != false )
		{
			intervalB = setTimeout( function(){self.headingText( copy.h1,false); }, 2400 );
		}
	};
	
	SoundWheel.prototype.createTextField = function(  text, r, fontSize, colour, flip ) 
	{
		var w = this.stage.getWidth();
		var h = this.stage.getWidth();
		var scale = w/684;
		
		var path = "M ";
		if (!flip)
		{
			// ANTI - CLOCKWISE
			//path += ~~(w/2)+ " " + ~~(h/2);
			path += ~~(this.radius)+ " 0";
			//path += ~~(this.radius)+ " "+~~(this.radius);
			//path += ~~(r)+ " 0";
			//path += "0 0";
			path += " M "+(-1*r)+", 0";
			//path += " A "+r+","+r+" 0 1,0 "+(2*r)+",0";
			path += " A "+r+","+r+" 0 1,1 "+(-2*r)+",0";//////
			path += " A "+r+","+r+" 0 1,1 "+(2*r)+",0";
			//path += " z"; // close shapepath += ~~(w/2)+ " " + ~~(h/2);
			/*
			//path += "0 0";
			path += " m "+(-1*r)+", 0";
			path += " a "+r+","+r+" 0 1,1 "+(2*r)+",0";
			path += " a "+r+","+r+" 0 1,1 "+(-2*r)+",0";
			path += " z"; // close shape
			//M 243 243 m -194, 0 a 194,194 0 1,1 388,0 a 194,194 0 1,1 -388,0
			////path += " a "+r+","+r+" 0 1,0 "+(2*r)+",0";
			//path += " a "+r+","+r+" 0 1,0 "+(-2*r)+",0";
			*/
		}else{
			
			// CLOCKWISE
			path = " M "+ r +", 0";
			//path += " M "+(-1*r)+", 0";
			path += " A "+r+","+r+" 0 1,1 "+(2*r)+",0";
			path += " A "+r+","+r+" 0 1,1 "+(-2*r)+",0";//////
			//path += " A "+r+","+r+" 0 1,0 "+(2*r)+",0";
			path += " z"; // close shape
		}
		
		//console.log( path );
		var field = new Kinetic.TextPath({
		//var field = new Kinetic.CenteredTextPath({
			x: w/2,
			y: h/2,
			fill: colour || '#fff',
			fontSize: (fontSize * scale)>>0,
			fontFamily: config.font,
			listening : false,
			text: ' ' + text + ' ',
			data: path
		});
		return field;
	};
	
	SoundWheel.prototype.createFeedbackWidget = function(x,y) 
	{
		var feedbackLabel = new Kinetic.Label({
			x: x,
			y: y
		});

		var text = new Kinetic.Text({
			text: '',
			fontFamily: FONT_FAMILY,
			fontSize: 18,
			padding: 0,
			fill: 'white',
			listening : false,
			x: 0,
			y: 10
		});
		
		// move origin to bottom right
		feedbackLabel.add( text );
		return feedbackLabel;
	};
	
	// ROTATOR ----------------------------------------------------------------------
   
	SoundWheel.prototype.createRotator = function(x,y, radius ) 
	{
		var self = this;
		var size = 50;
		var rollAround = function( pos ){
			
			var nx = pos.x - x,
				ny = pos.y - y;
				
			// hypoteneuse = nx * nx + ny *ny;
			
			var theta = Math.atan2(nx, ny) ;// + (PI/2)
			var angle =  ( 360 - ( theta - ROTATOR_OFFSET) * DEGREES_TO_RADS) % 360;
			//console.log( theta * (180/Math.PI) );
			// on drag
			self.nodeLayer.rotation( angle );
			NodeFactory.updateAll();
			self.nodeLayer.batchDraw(  );
			
			rotator.rotation(angle);
			
			self.moveTip( rotator, size );
			self.showTip( (angle>>0)+" Degrees" );
			
			return {
				y:radius * Math.cos(theta) + y,
				x:radius * Math.sin(theta) + x
			};
		};
		
		// on youch Click startDrag drag, drag in Circle and rotate
		var rotator = new Kinetic.RegularPolygon({
			x: radius * Math.sin(ROTATOR_OFFSET) + x,
			y: radius * Math.cos(ROTATOR_OFFSET) + y,
			sides:6,
			lineJoin:'round',
			lineCap:'round',
			//offsetX:-radius,
			//offsetY:-radius,
			radius: size,
			opacity:0.5,
			fill: '#ffffff',
			draggable: true,
			stroke: 'black',
			strokeWidth: 3,
			id: 'rotator',
			dragBoundFunc: rollAround,
			dragDistance:1
		});
		
		rotator.on('mouseover mousemove', function(evt) {
			self.setCursor('pointer');
			//self.moveTip( rotator, 2 );
			//self.showTip( "Click to\nAlter Layout" );
			
		});
		rotator.on('mousedown touchstart', function(evt) {
			rotator.opacity( 1 );
		});
		
		rotator.on('mouseout mouseup touchend', function(evt) {
			self.setCursor('default');
			//self.hideTip( );
			rotator.opacity( 0.5 );
		});
		
		rotator.hide = function()
		{
			rotator.opacity( 0 );
		};
		
		rotator.reveal = function()
		{
			rotator.opacity( 0.5 );
		};
		
		// drag ritate Circle nodes!
		// 
			
			//this.bottomLayer.batchDraw();
		return rotator;
		
	};
	
	// CONSTRUCTOR ----------------------------------------------------------------------
   
	SoundWheel.prototype.append = function( element )
	{
		if ( typeof element === 'string' ) 
		{
			// convert element to an element if it is just a string...
			element = document.getElementById( element ) || document.getElementsByTagName( element ) || document.getElementsByName( element );
			
			// if an array...
			if ( Object.prototype.toString.call( element ) === '[object Array]' ) element = element[0];	
		}
		
		if (element)
		{	
			var fc = element.firstChild;
			while( fc ) {
				element.removeChild( fc );
				fc = element.firstChild;
			};
			
			// add goodness to DOM Element
			var elem = document.createElement( "div" );
			elem.id = 'soundwheel';
			
			element.appendChild( elem );
			return elem;
		}else{
			return false;
		}
	};
	
	//////////////////////////////////////////////////////////////////////////////////
	// Create a Sound Wheel Instance on element DOM node (or ID)
	// with a square size of 
	// and options of {}
	//////////////////////////////////////////////////////////////////////////////////
	SoundWheel.prototype.construct = function( element, size, options )
	{
		// Checks...
		
		// 1. Sizes & Arguments
		// internal vars
		size = size || 578;
		var radiusLength = size * config.sizeFactor;
		var half = size*0.5;
	
		// 2. Audio
		var dsp = this.createAudio();
		if ( dsp )
		{
			this.audioContext = dsp;
		}else{
			this.onFail( 'AudioContext not Available ;(' );
			return false;
		};
		
		// 3. Canvas exists and is available
		if (!!!window.CanvasRenderingContext2D)
		{
			this.onFail( 'Canvas is not available' );
			return false;
		}
		
		// 3. Place to Transclude / insert soundwheel to DOM
		this.container = this.append( element );
		if (!this.container)
		{
			this.onFail( 'Bad config ID set for DOM transclusion' );
			return false;
		};
		
		// BEGIN!
		
		// 4. Check to see if we can store data locally
		var hasLocalStorage = false;
		try {
			hasLocalStorage = 'localStorage' in window && window['localStorage'] !== null;
		} catch (e) {
			hasLocalStorage = false;
			
		}
		this.allowSaving = hasLocalStorage;
		
		
		// Create G U I 
		// FastLayer
		this.bottomLayer = new Kinetic.Layer();
		this.mainLayer = new Kinetic.Layer();
		this.nodeLayer = new Kinetic.Layer({
			x:half,
			y:half,
			offsetX:half,
			offsetY:half
		});
		this.tempNodeLayer = this.nodeLayer.clone();
	
		this.textLayer = new Kinetic.Layer();
		this.gadgets = new Kinetic.Layer();
		this.tipLayer = new Kinetic.Layer();
		
		// add our layers the stage
		this.stage = new Kinetic.Stage({
			container: 'soundwheel',
			width: size,
			height: size
		});
		
		this.stage
			.add( this.textLayer )
			.add(this.bottomLayer)
			.add( this.mainLayer )
			.add( this.gadgets )
			.add( this.nodeLayer )
			.add( this.tempNodeLayer )
			.add( this.tipLayer )
			
		;

		this.fullSize = size;
		this.halfSize = half;
		this.radius = radiusLength;
		this.margin = (size - (radiusLength*2))*0.5;
		
		this.recButton = this.createRecordButton( half + radiusLength, half + radiusLength );
		
		this.feedback = this.createFeedbackWidget(0, radiusLength+half);
		
		this.rotator = this.createRotator( half,half,radiusLength,half,half);
		this.rotator.hide();
		
		// create a new ColourWheel instance
		this.colourWheel  = new ColourWheel();
		this.colourWheel.construct('', radiusLength*2 , 0 );
		
		var volume = (!hasLocalStorage) ? 0.5 : localStorage.getItem( NAME_SPACE+"vol" ) || 0.5;
		
		NodeFactory.initialise( this, radiusLength, dsp, volume );
		
		return true;
	};
	
	// Inititialise
    SoundWheel.prototype.create = function() 
	{
		var self = this;
		var isMouseDown = false;
		var nodeHeld;
		
		var w = this.stage.getWidth();
		var h = this.stage.getWidth();
		var scale = w/684;
		var r = ~~(this.radius/2)+(13*scale);
		/*var path = "M ";
		
		//path += ~~(w/2)+ " " + ~~(h/2);
		path += ~~(this.radius)+ " 0";
		//path += ~~(this.radius)+ " "+~~(this.radius);
		//path += ~~(r)+ " 0";
		//path += "0 0";
		path += " M "+(-1*r)+", 0";
		//path += " A "+r+","+r+" 0 1,0 "+(2*r)+",0";
		path += " A "+r+","+r+" 0 1,1 "+(-2*r)+",0";//////
		path += " A "+r+","+r+" 0 1,1 "+(2*r)+",0";
		//path += " z"; // close shapepath += ~~(w/2)+ " " + ~~(h/2);
		
		//path += "0 0";
		path += " m "+(-1*r)+", 0";
		path += " a "+r+","+r+" 0 1,1 "+(2*r)+",0";
		path += " a "+r+","+r+" 0 1,1 "+(-2*r)+",0";
		path += " z"; // close shape
		//M 243 243 m -194, 0 a 194,194 0 1,1 388,0 a 194,194 0 1,1 -388,0
		////path += " a "+r+","+r+" 0 1,0 "+(2*r)+",0";
		//path += " a "+r+","+r+" 0 1,0 "+(-2*r)+",0";
	*/
		//console.log( path );
		this.heading = this.createTextField( copy.h1, r+4, 58, '#333' );
		this.subHeading = this.createTextField( copy.h2, r , 28, '#333', true );
		this.tooltip = this.createToolTip();
			
		/*
		path = " M "+ r +", 0";
		//path += " M "+(-1*r)+", 0";
		path += " A "+r+","+r+" 0 1,1 "+(2*r)+",0";
		path += " A "+r+","+r+" 0 1,1 "+(-2*r)+",0";//////
		//path += " A "+r+","+r+" 0 1,0 "+(2*r)+",0";
		path += " z"; // close shape
		
		this.subHeading = new Kinetic.CenteredTextPath({
			x: w/2,
			y: h/2,
			fill: '#444',
			fontSize: (28 * scale )>>0,
			fontFamily: config.font,
			text: ' H a r m o n i c s   G e n e r a t o r ',
			data: path
		});
		*/
		// now create an image Element...
		var image = new Image();
		image.onload = function()
		{ 
			var colourWheel = self.wheel = self.createWheel( image );
			colourWheel.opacity(0);
			colourWheel.scale( {x:0.8, y:0.8 } );
			//colourWheel.opacity(0.4);
			//colourWheel.rotate( 270 );
			
			self.subHeading.opacity(0);
			self.heading.opacity(0);
			
			self.bottomLayer.add( self.rotator );
			self.bottomLayer.batchDraw();
			
			// contentMouseover, contentMousemove, contentMouseout, contentMousedown, contentMouseup, contentClick, contentDblclick, contentTouchstart, contentTouchmove, contentTouchend, contentTap, and contentDblTap
			self.mainLayer.add( self.wheel );		
			self.mainLayer.batchDraw();	
			
			self.textLayer.add( self.feedback );
			self.textLayer.add( self.subHeading );		
			self.textLayer.add( self.heading );		
			self.textLayer.batchDraw();
			
			
			self.gadgets.add( self.recButton );
			self.gadgets.batchDraw();
			
			self.tipLayer.add( self.tooltip );		
			self.tipLayer.batchDraw();	
			
			// Animate in the intro...
			var tween = new Kinetic.Tween({
				node: self.heading,
				opacity: 1,
				duration: 2,
				easing: Kinetic.Easings.EaseInOut
			});
			//
			var tweenWheel = new Kinetic.Tween({
				node: self.wheel,
				opacity: 1,
				//rotation:360,
				scaleX:1,
				scaleY:1,
				duration: 0.65,
				easing: Kinetic.Easings.BackEaseOut
			});
			
			var tween2 = new Kinetic.Tween({
				node: self.subHeading,
				opacity: 1,
				duration: 3,
				easing: Kinetic.Easings.EaseInOut
			});
			
			
			// fade in heading 1 & 2 after 2 seconds
			setTimeout(function() {
				tweenWheel.play();
			}, 600);
			
			setTimeout(function() {
				tween.play();
			}, 1000);
			
			setTimeout(function() {
				tween2.play();
			}, 2000);
			
			
			self.wheel.on('mousedown', function(evt) {
				
				var mousePos = self.stage.getPointerPosition();
				var node = self.createNode( mousePos.x, mousePos.y );
				
				self.tempNodeLayer.add( node );	
				self.tempNodeLayer.batchDraw();
				
				//console.error( node.exportString() );
				
				isMouseDown = true;
				self.nodeHeld = node;
				node.startDrag();
			});
			

			self.wheel.on('mouseup', function(evt) {
				//layer.draw();
				//alert('out');
				isMouseDown = false;
				//self.nodeHeld.stopDrag();
				self.nodeHeld = undefined;
			});
			/*
			
			TouchEvent {metaKey: false, altKey: false, shiftKey: false, ctrlKey: false, changedTouches: TouchList…}
			altKey: false
			bubbles: true
			cancelBubble: false
			cancelable: true
			changedTouches: TouchList
			charCode: 0
			clipboardData: undefined
			ctrlKey: false
			currentTarget: null
			defaultPrevented: true
			detail: 0
			eventPhase: 0
			keyCode: 0
			layerX: -19
			layerY: -65
			metaKey: false
			pageX: 310
			pageY: 0
			returnValue: false
			shiftKey: false
			srcElement: canvas
			target: canvas
			targetNode: Kinetic.Circle
			targetTouches: TouchList
			timeStamp: 1395681455686
			touches: TouchList<<<<<<<<<<<<<<<<<<<<<<<<<<<<
			
			Touch
				clientX: 76
				clientY: 155
				identifier: 0
				pageX: 386
				pageY: 157
				screenX: 407
				screenY: 261
				target: canvas
				webkitForce: 1
				webkitRadiusX: 1
				webkitRadiusY: 1
				webkitRotationAngle: 0
			
			type: "touchstart"
			view: Window
			*/
			
			self.wheel.on('touchstart', function(e) {
				
				console.error( e.evt );
				var evt = e.evt;
				var touches = evt.touches;
				
				//var offsets = evt
				for ( var t =0, l = touches.length; t < l ; ++t )
				{
					var touch = touches[t];
					console.log(touch);
					// loop through fingers and attachEvent...
				
					var mousePos = { x:touch.clientX + evt.layerX, y:touch.clientY + evt.layerY };
					var colour = self.getColour( mousePos.x, mousePos.y );
					
					var node = self.createNode( mousePos.x, mousePos.y, colour, 0, true );
					self.nodeLayer.add( node );	
					self.nodeLayer.batchDraw();
					
					node.startDrag();
				}
			});
			
			/*
			
			
			self.wheel.on('touchend', function(evt) {
				
			});
			*/
			
			//self.wheel.on('mouseover mousemove touchmove', function(evt) {
			self.wheel.on('mouseover mousemove', function(evt) {
				
				var toolText =  "Click  Me";
			
				// we are holding a node?
				if ( isMouseDown )
				{
					var node = evt.targetNode;
					// drag node!
					if (node)
					{
						toolText = "node: " + node.getId() + ", color: " + node.getFill();
					} else {
						toolText = "xxx";
					}
				
				}else{
					
					self.setCursor('crosshair');
				
					toolText = "Click  Me";
				}	
				
				
				return;
					
				// update tooltip
				var mousePos = self.stage.getPointerPosition();
				self.moveTip( self.wheel, 20 , mousePos);
				self.showTip( toolText );
				
			}); 
			
			self.wheel.on('mouseout', function(evt) {
				//self.hideTip();
				self.setCursor('default');
			});
			
			self.onInitialised();
		};
		
		var bitmap = this.colourWheel.toBitmap();
		//var bitmap = this.colourWheel.toImage();
		image.src = bitmap;
		image.className += "debug";
		//image.src = '../images/colorwheel1.png';
		
		/*
		// 5. Attempt to load Stored data if exists...
		var savedData = this.load();
		if ( savedData )
		{
			
		};
		(
		*/
		
		Input.onKeyDown( this.onKeyPressed, this, false, true );
		Input.onKeyUp( this.onKeyReleased, this, false, true );
		Input.onMouseWheel( this.onMouseWheel, this, false, true );
		
		// attach to stage
		if (DEBUG) 
		{
			//this.container.createElement();
			//this.container.appendChild( image );
			this.container.parentNode.insertBefore( image );
		}
		
		// 
		this.onFrame();
	};

	
	SoundWheel.prototype.onInitialised = function() 
	{
		document.getElementsByTagName('body')[0].className+=' live';
	};
	
	SoundWheel.prototype.onMouseWheel = function( delta ) 
	{
		var quantity = (delta*0.05);
		var volume = ( NodeFactory.getVolume() < 0.1 ) ?  NodeFactory.getVolume()+ (delta*0.05) : NodeFactory.getVolume() +delta*0.01;
		
		this.setVolume( volume );
	};
	
	SoundWheel.prototype.onKeyPressed = function( code, shift, ctrl, alt ) 
	{
		
		// if code is ENTER -> Empty
		if ( code === 13 ) this.removeAllNodes();
		// ESCape
		else if ( code === 27 ) this.clearAllMemory();
		// Left Arrow Key
		else if ( code === 37) this.nodeLayer.rotate( -1 );
		// Up Arrow Key
		else if ( code === 38) NodeFactory.move( 1 );
		// Right Arrow Key
		else if ( code === 39) this.nodeLayer.rotate( 1 );
		// Down Arrow Key
		else if ( code === 40) NodeFactory.move( -1 );
		// Space Bar
		else if ( this.nodeHeld && code === 32 ) this.nodeHeld.setTimbre( this.nodeHeld.getTimbre()+1 );
		NodeFactory.updateAll();
		this.nodeLayer.batchDraw();
	};
	
	SoundWheel.prototype.onKeyReleased = function( code, shift, ctrl, alt, duration ) 
	{
		console.error('POP '+code);
		
		// if it is a number, load the associated PRESET
		if ( code > 46 && code < 58 ) this.loadPreset( code - 48 );
		
		// Space bar
		//else if ( code == 32) this.saveOrLoad();
		else if ( this.nodeHeld && code == 32) return;
		// Del or Backspace Undo
		else if ( code == 8 || code == 46 ) this.removeNode( NodeFactory.getLastNode() );
		// check to see if ctrl-z are being pressed
		else if ( code == 90 && ctrl ) this.removeNode( NodeFactory.getLastNode() );
		
		//
		else if ( code == 13 ) return;
		else if ( code == 27 ) return;
		else if ( code > 36 && code < 41 ) return;
		
		
		// all other keys!
		else if (shift||ctrl||alt) this.save( code );
		else if (duration > 500) this.save( code );
		else this.saveOrLoad( code );
		
		console.log( code, shift, ctrl, alt, duration );
	};
	
	SoundWheel.prototype.update = function( time ) 
	{
		//if ( time%2> 0 ) return;
		// NodeFactory.updateAll();
		
		if ( this.isRecording )
		{
			var duration = (time - this.recordStart);
			//this.recButton.getText().setText(timecode( duration ) );
			// blink...
			var smooth = (duration * 0.001)>>0;
			if ( smooth%2 === 0 )
			{
				this.recButton.icon.scale( { x:1.2, y:1.2} );
			}else{
				this.recButton.icon.scale( { x:1, y:1} );
			};//
			this.feedbackText( timecode( duration ) );
			this.gadgets.batchDraw();
		}
		//console.log('update ');
	};
	
	SoundWheel.prototype.onFrame = function() 
	{
		var self = this;
		this.update(Date.now());
		//
		//var rotation = this.nodeLayer.rotation();
		//console.log( 'frame'+rotation );
		//this.nodeLayer.rotate( 1 );
		//this.nodeLayer.batchDraw();
		//this.nodeLayer.draw();
		// loop through nodes and update each one
		
		// use the head and work down the chain...
		setTimeout( function(){ self.onFrame(); }, 30 );
		//requestAnimationFrame ( function(){ self.onFrame(); });
	};
	
	// Pass in the time that has elapsed
	SoundWheel.prototype.onFail = function( error )
	{
		this.error = String(error);
		//this.feedbackText( error );
	};
	
    SoundWheel.prototype.resize = function( size ) 
	{
		this.stage.width( size );
		this.stage.height( size );	
	};

	
    return SoundWheel;

})();