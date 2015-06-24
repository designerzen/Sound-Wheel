
var NodeFactory = (function() {
	
	"use strict";
	
	// Constants
	var RADIUS = 200;
	var NODE_RADIUS = 20;
	
	var BIG = 1.2;
	var SMALL = 0.8;
	
	// linked list
	var head,
		tail,
		count;
		
	var soundWheel;
	
	var audioContext, gain;
	
	var convertColourToFrequency = function( tint )
	{
		//var octaveFrequencyRange:Number = octave*Ranges.getOctaveRange( octave );
		//var octaveBeginFrequency:Number = 100000;
		//var octaveEndFrequency:Number 	= octaveBeginFrequency+octaveFrequencyRange;

		//var f = Math.pow( 440, 2 )*( (tint.r+tint.g*tint.g+tint.b*tint.b*tint.b)*0.2 );
		//var f = Math.sqrt( (tint.r+tint.g*tint.g+tint.b*tint.b*tint.b)*0.05 , 2 );
		var f =  Math.sqrt( ((tint.r) + (255+tint.g*tint.g) + (255*255+tint.b*tint.b*tint.b))*0.5 );
		//var f = (0.001 * (( tint.r * 4 )+(tint.g *3 )*(tint.b)/(12*255)));
		//console.log( tint );
		return parseFloat( f );
	}
	
	var Factory = {};

	// PUBLIC METHODS ===========================================================
	
	Factory.getGain = function( )
	{
		return gain;
	};
	
	Factory.getLastNode = function( )
	{
		return tail;
	};
	
	Factory.getQuantity = function( )
	{
		return count;
	};
	
	Factory.getVolume = function( )
	{
		return gain.gain.value;
	};		
	
	Factory.setVolume = function( vol )
	{
		if ( vol < 0) vol = 0;
		else if ( vol > 1 ) vol = 1;
		gain.gain.value = vol;
	};

	Factory.initialise = function( soundWheelInstance, wheelRadius, audio, startVolume )
	{
		soundWheel = soundWheelInstance;
		RADIUS = wheelRadius;
		count = 0;
		audioContext = audio;
		gain = audio.createGain();
		gain.gain.value = startVolume || 0.5;
		gain.connect( audio.destination );	
	};
	
	
	Factory.updateAll = function( x, y, tint, radius )
	{
		var node = head;
		while (node)
		{
			node.update();
			node = node.next;
			
		}
	};
	Factory.move = function( ratio )
	{
		var node = head;
		while (node)
		{
			node.moveInOut( ratio );
			node = node.next;
			
		}
	};
	

	Factory.setTimbre = function( type )
	{
		var node = head;
		while (node)
		{
			node.setTimbre( type );
			node = node.next;
		}
	};
	

	// CREATE / DESTROY ===========================================================
	Factory.create = function( x, y, radius, timbre, temporary )
	{
		if ( typeof radius === undefined ) radius = NODE_RADIUS;
		
		var id = count++;
		var midX = soundWheel.stage.width() * 0.5;
		var midY = soundWheel.stage.height() * 0.5;
		var radius2 = RADIUS*RADIUS;
		var allowedLength = RADIUS + radius*2;
		var fence = allowedLength*allowedLength;
		var colour = soundWheel.getColour( x, y );
		var tint = "rgb("+colour.r+", "+colour.g+", "+colour.b+")";
		var hypoteneuse = 0;
		var scale = 1;
		
		var fenceIn = function( pos ){
			
			var nx = pos.x - midX,
				ny = pos.y - midY;
				
			hypoteneuse = nx * nx + ny *ny;
			
			if ( hypoteneuse > fence )
			{
				var theta = Math.atan2(nx, ny) ;// + (PI/2)
				return {
					y:allowedLength * Math.cos(theta) + midY,
					x:allowedLength * Math.sin(theta) + midX
				};
			}else{
				return pos;
			}
		};
		
		var circle = new Kinetic.Circle({
			x: x,
			y: y,
			//offsetX:-radius,
			//offsetY:-radius,
			radius: radius,
			fill: tint,
			draggable: true,
			stroke: 'black',
			strokeWidth: 2,
			id: id,
			dragBoundFunc: fenceIn,
			// // node starts dragging only if pointer moved more then 3 pixels
			dragDistance:0
		});
		
		var popOut = function( node ){
			var pos = node.getAbsolutePosition();
			node.moveTo( soundWheel.tempNodeLayer );
			node.setAbsolutePosition( pos );
			node.scale( {x:BIG,y:BIG } );
			soundWheel.tempNodeLayer.batchDraw();
			console.log( 'popIn out ', node );
		};
		var popIn = function( node ){
			// move node accordingly...
			var pos = node.getAbsolutePosition();
			node.moveTo( soundWheel.nodeLayer );
			node.setAbsolutePosition( pos );
			node.moveToTop();
			node.scale( {x:1,y:1} );
			
			soundWheel.tempNodeLayer.batchDraw();
			soundWheel.nodeLayer.batchDraw();
			console.log( 'popIn in ', node );
		};
		var getHypoteneuse = function(pos){
			var rx = pos.x - midX;
			var ry = pos.y - midY;
			hypoteneuse = (rx*rx) + (ry*ry);
			return hypoteneuse;
		};
		// lets save some artbitrary information in this Object...
		var frequency = convertColourToFrequency( colour );
		var attack = 10 / 1000,
			decay = 250 / 1000;
		
		
		// circular linked list...
		if (head === undefined) head = circle;
		
		circle.previous = tail;
		circle.next;
		
		if (tail) tail.next = circle;
		tail = circle;
			
			
			
		// “sine”, “square”, “sawtooth” or “triangle”
		circle.setTimbre = function( type ){
			
			if ( type > 3) type = 0;
			else if ( type < 0) type = 3;
			else if ( type === "sine" ) type = 0;
			else if ( type === "square" ) type = 1;
			else if ( type === "sawtooth" ) type = 2;
			else if ( type === "triangle" ) type = 3;
			
			circle.sineWave.type = type;
			
			console.log('Setting Timbre to '+type );
		}
		
		// “sine”, “square”, “sawtooth” or “triangle”
		circle.getTimbre = function(){
			switch(circle.sineWave.type)
			{
				case "sine" : return 0;
				case "square" : return 1;
				case "sawtooth" : return 2;
				case "triangle" : return 3;
			};
			//console.log('Getting Timbre '+circle.sineWave.type );
			return parseInt( circle.sineWave.type ) || 0;
		}
		
		circle.gain = audioContext.createGain();
		//circle.gain.value = 0.5;
		circle.gain.connect( gain );
		
		// Attack
		circle.gain.gain.setValueAtTime(0, audioContext.currentTime);
		circle.gain.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + attack);
		//circle.gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + decay );

		circle.sineWave = audioContext.createOscillator();
		circle.setTimbre( timbre || 0 ); // sine wave
		circle.sineWave.connect( circle.gain );
		circle.sineWave.frequency.value = frequency;
		
		//circle.sineWave.start( audioContext.currentTime );	
		circle.sineWave.start( 0 );	
		
		// create public methods Form the nodes...
		circle.update = function(){
			var pos = circle.getAbsolutePosition();
			colour = soundWheel.getColour( pos.x, pos.y );
			frequency = convertColourToFrequency( colour );
			tint = "rgb("+colour.r+", "+colour.g+", "+colour.b+")";
			circle.setFill( tint );
			circle.sineWave.frequency.value = frequency;
			//circle.sineWave.start( audioContext.currentTime );	
			// console.log( colour );
			return colour;
		};
		
		// create public methods Form the nodes...
		circle.kill = function(){
			circle.off('mouseover mousedown touchstart');
			circle.off('mouseout mouseup touchend');
			circle.off('dragstart dragmove dragend');
			circle.off('dblclick dbltap');
			circle.off('dragend');
			//node.off('mouseover mousedown touchstart mouseout mouseup touchend dragstart dragmove dragend');
		
			circle.sineWave.stop(audioContext.currentTime);
			circle.sineWave.disconnect( circle.gain );
			circle.gain.disconnect( gain );
			//circle.sineWave.destroy();
			circle.sineWave = undefined;
			circle.gain = undefined;
		};
		
		circle.exportString = function(){
			var pos = circle.getAbsolutePosition();
			var rx = pos.x - midX;
			var ry = pos.y - midY;
			var angle = Math.atan2(rx, ry);
			return { 
				ratio : hypoteneuse / radius2,
				angle : angle,
				colour : colour,
				timbre : circle.getTimbre()
			};
		};
		
		// move a node towards the centre of the wheel
		circle.moveInOut = function( ratio ){
			var pos = circle.position();
			var rx = pos.x - midX;
			var ry = pos.y - midY;
			var angle = Math.atan2(rx, ry);
			var length = Math.sqrt(hypoteneuse) + ratio;
			//
			//scale = ratio;
			//hypoteneuse = hypoteneuse * ratio;
			hypoteneuse = length * length;
			if (hypoteneuse > fence )hypoteneuse = fence;
			pos.x = length * Math.sin(angle)+midX;
			pos.y = length * Math.cos(angle)+midY;
			circle.position( pos );
		};
		
		
		// events
		// mouseover, mousemove, mouseout, mouseenter, mouseleave, mousedown, mouseup, 
		// click, dblclick, touchstart, touchmove, touchend, tap, dbltap, 
		// dragstart, dragmove, and dragend
		
		circle.on('mouseover', function(evt) {
			soundWheel.setCursor('pointer');
			soundWheel.moveTip( circle, radius );
			soundWheel.showTip( (frequency>>0) + "Hz" );
			evt.cancelBubble = true;
		});
		
		// on mousemove down mouseovermouseout
		circle.on('dragstart mousedown touchstart', function(evt) {
			soundWheel.setCursor('move');
			
			
			// update tooltip
			soundWheel.moveTip( circle, radius );
			soundWheel.showTip( (frequency>>0) + "Hz" );
				
			popOut( circle );
			evt.cancelBubble = true;
			
		});
		
		// DOUBLE clicks
		circle.on('dblclick dbltap', function(evt) {
			circle.setTimbre( circle.getTimbre()+1 );
		});
		
		circle.on('dragmove', function(evt) {
			
			var text = '';
			var pos = circle.getAbsolutePosition();
			colour = soundWheel.getColour( pos.x, pos.y );
			tint = "rgb("+colour.r+", "+colour.g+", "+colour.b+")";
			frequency = convertColourToFrequency( colour );
			
			/*
			console.log( pos );
			console.log( colour );
			console.log( tint );
			*/
			
			//if ( tint === "rgb(0, 0, 0)" )
			if ( hypoteneuse > radius2 )
			{
				// in the danger zone For removal...
				text = 'Remove';
				tint = "rgb(255, 0, 0)";
				soundWheel.setCursor('default');
				circle.scale( {x:SMALL,y:SMALL} );
				circle.sineWave.frequency.value = 1;
				
			}else{
				
				text = (frequency>>0) + "Hz";
				if ( circle.scale().x < BIG )
				{
					circle.scale( {x:BIG,y:BIG} );
					
				}
				soundWheel.setCursor('move');
				circle.sineWave.frequency.value = frequency;
			}
			
			circle.setFill( tint );
			soundWheel.tempNodeLayer.batchDraw();
			//soundWheel.nodeLayer.batchDraw();
					
			//console.log( tint );
			// update tooltip
			soundWheel.moveTip( circle, radius );
			soundWheel.showTip( text );
			
			evt.cancelBubble = true;
		});
		
		circle.on('dragend', function(evt) {
			
			var pos = circle.getAbsolutePosition();
			hypoteneuse = getHypoteneuse(pos);
			
			var ratio = hypoteneuse / radius2;
			//var pos = { x:circle.x, y:circle.y };
			if (ratio < 1)
			{
				colour = soundWheel.getColour( pos.x, pos.y );
				tint = "rgb("+colour.r+", "+colour.g+", "+colour.b+")";
				circle.setFill( tint );
				circle.opacity(1);
				soundWheel.setCursor('pointer');
			
			}else{
				//circle.setFill( 'ff0000');
				circle.opacity(0.5);
				soundWheel.removeNode( circle );
				soundWheel.hideTip();
				soundWheel.setCursor('default');
			}
			
			console.log('circle : drag end');
			
			soundWheel.tempNodeLayer.batchDraw();
			//soundWheel.nodeLayer.batchDraw();
			
			// -webkit-grab
			evt.cancelBubble = true;
		});
		
		circle.on('mouseup', function(evt) {
			soundWheel.hideTip();
			
			popIn( circle );
			//soundWheel.tempNodeLayer.batchDraw();
			//soundWheel.nodeLayer.batchDraw();
			
			console.log('circle : mouse up');
			
			soundWheel.setCursor('pointer');
			evt.cancelBubble = true;
		});
		
			
		circle.on('touchend', function(evt) {
			if (temporary) soundWheel.removeNode( circle );
			else popIn( circle );
			
			console.log('circle : touch end');
			
			soundWheel.hideTip();
			evt.cancelBubble = true;
		});
		
		
		// mouse up after dragging//
		circle.on('mouseout', function(evt) {
			
			console.log('circle : mouse out');
			
			//soundWheel.showTip( 'mouseout' );
			soundWheel.hideTip();
			circle.scale( {x:1,y:1} );
			soundWheel.nodeLayer.batchDraw();
			// soundWheel.setCursor('crosshair');
			evt.cancelBubble = true;
		});
		 
		return circle;
	};
	
	Factory.destroyAll = function(){
		var node = head;
		while (node)
		{
			var n = node;
			node = node.next;
			Factory.destroy( n );
			
		}
		count = 0;
	};
	
	Factory.destroy = function( node ){
		
		// TODO :
		// unlink then reset and store in an Array For use later
		console.log('removing node!',node);
		
		// now take this out of the linked lists...
		
		if ( head === node ) head = node.next;
		if ( tail === node ) tail = node.previous;
		
		var prev = node.previous;
		var next = node.next;
		
		if ( prev )
		{
			prev.next = next;
		}
		
		if (next)
		{
			next.previous = prev;
		}
		
		
		node.stopDrag();
		node.kill();
		node.destroy();
		node.remove();
		//node.previous = null;
		//node.next = null;
		node = null;
		
		count--;
	};
	
	// IMPORT / EXPORT ===========================================================
	
	Factory.toJSON = function( )
	{
		var data = [];
		var node = head;
		while (node)
		{
			data.push( node.exportString() );
			console.log( 'saving > ',node.exportString() );
			
			node = node.next;
		}
		// encode nodes!
		return JSON.stringify(data);
	};
	
	Factory.fromJSON = function( json )
	{
		// loop through JSON Array object and decipher
		var data = JSON.parse( json );
		var midX = soundWheel.stage.width() * 0.5;
		var midY = soundWheel.stage.height() * 0.5;
			
		// loop through array...
		for ( var i=0, l=data.length; i < l; ++i )
		{
			// ratio : hypoteneuse / RADIUS,
			// angle : angle,
			// colour : colour 
			var item = data[i];
			var angle = parseFloat( item.angle ),
				radius = RADIUS * parseFloat( item.ratio ),
				// now convert colour to position...
				y = radius * Math.cos(angle) + midY,
				x = radius * Math.sin(angle) + midX,
				colour = item.colour,
				timbre = item.timbre;
				
			console.log( 'adding > ',x,y,angle );
			if ( !isNaN(angle)) 
			{
				var node = soundWheel.createNode( x, y, NODE_RADIUS, timbre );
				soundWheel.nodeLayer.add( node );	
				
			}
		}
		soundWheel.nodeLayer.batchDraw();	
	};
	
	return Factory;

})();