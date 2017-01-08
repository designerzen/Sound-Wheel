var ColourWheel = (function() {

	"use strict";

	// Math helpers
	var math = Math,
		sqrt = math.sqrt,
		atan2 = math.atan2;

	// Constants
	var PI = math.PI,
		PI2 = PI * 2,
		oneHundred = 100,
		two55 = 255;

	// Created a shorter version of the HSV to RGB conversion function in TinyColor
	// https://github.com/bgrins/TinyColor/blob/master/tinycolor.js
	var hsvToRgb = function (h, s, v)
	{
		h*=6;
		var i = ~~h,
			f = h - i,
			p = v * (1 - s),
			q = v * (1 - f * s),
			t = v * (1 - (1 - f) * s),
			mod = i % 6,
			r = [v, q, p, p, t, v][mod] * two55,
			g = [t, v, v, q, p, p][mod] * two55,
			b = [p, p, t, v, v, q][mod] * two55;

		return [r, g, b, "rgb("+ ~~r + "," + ~~g + "," + ~~b + ")"];
	};

	function ColourWheel()
	{

	}


	ColourWheel.prototype.construct = function( domElement, size, margin, seeThrough )
	{
		// TODO : Check to see if this is a canvas Element or a context...

		// is domElement a canvas?

		// is domElement a context?

		// is domElement a DOM element? append

		var c = document.createElement('canvas');

		// make sure we work in pixels!
		size = ~~( size || 400 );
		margin = typeof margin === undefined ? 10 : margin;

		this.canvas = c;
		this.context = c.getContext('2d');

		this.width = c.width = c.height = size;
		this.circleOffset = margin;
		this.diameter = size - this.circleOffset*2;
		this.radius = this.diameter / 2;
		this.radiusPlusOffset = this.radius + this.circleOffset;
		this.radiusSquared = this.radius * this.radius;

		this.imageData = this.context.createImageData( size, size );
		this.pixels = this.imageData.data;

		this.draw( size, this.radius, seeThrough );

		return c;
	};

	ColourWheel.prototype.draw = function( size, radius, square )
	{
		var halfSize = size * 0.5;
		var wheelPixel = this.circleOffset*4*this.width + this.circleOffset*4;

		// Load color wheel data into memory.
		for ( var y = 0; y < size; ++y )
		{
			for ( var x = 0; x < size; ++x )
			{
				var rx = x - radius,
					ry = y - radius,
					d = rx * rx + ry * ry,
					hue = (atan2(ry, rx) + PI) / PI2,
					saturation = sqrt(d) / radius,
					rgb = hsvToRgb( hue, saturation, 1 ),
					isInCircle =  d <= this.radiusSquared,
					alpha = isInCircle ? 255 : square ? 255 : 0;


				if (!isInCircle)
				{
					rgb[0] = rgb[1] = rgb[2] = 0;
				}

				// Print current color, but hide if outside the area of the circle
				this.pixels[ wheelPixel++ ] = rgb[0];
				this.pixels[ wheelPixel++ ] = rgb[1];
				this.pixels[ wheelPixel++ ] = rgb[2];
				this.pixels[ wheelPixel++ ] = alpha;
			}
		}


		// Is this rwally neccessary???
		this.context.putImageData(this.imageData, 0, 0);

		// console.log( d > radiusSquare, rgb );
	};

	ColourWheel.prototype.getHSV = function( x,y )
	{
		// Scope these locally so the compiler will minify the names.
		var theta = PI2 - atan2( x, y ) + ( PI * 0.5 ),
			d = x * x + y * y;

		// If the x/y is not in the circle, find angle between center and mouse point:
		//   Draw a line at that angle from center with the distance of radius
		//   Use that point on the circumference as the draggable location
		if (d > this.radiusSquared)
		{
			x = this.radius * math.cos(theta);
			y = this.radius * math.sin(theta);
			theta = atan2(y, x);
			d = x * x + y * y;
		}
		var hue = (theta+ PI ) / PI2, 		// Current hue (how many degrees along the circle)
			saturation = sqrt(d) / this.radius;	// Current saturation (how close to the middle)

		return { hue:hue, saturation:saturation, brightness:(oneHundred / oneHundred) };
	};

	ColourWheel.prototype.getPixelRGB = function( x,y, asObject )
	{
		// ensure that the x, y are TRUE integers...
		x = x >> 0;
		y = y >> 0;

		// TODO : find the pixel in the haystack/
		var wheelPixel = this.circleOffset*4*this.width + this.circleOffset*4;
		var position = 4 * (  x + (y* this.width) ) + wheelPixel;

		var pixel = [
			this.pixels[ position++ ],
			this.pixels[ position++ ],
			this.pixels[ position++ ]
		];

		//console.log( 'before 	',x,y,pixel );

		//var imageData = this.context.getImageData( x, y, 1, 1 );	// update preview color
		//pixel = imageData.data;
		//console.log( 'after 	',x,y,pixel );

		if (asObject===true)
		{
			return { r:pixel[0], g:pixel[1], b:pixel[2] };
		} else{
			return "rgb("+pixel[0]+", "+pixel[1]+", "+pixel[2]+")";
		}
	};

	ColourWheel.prototype.toCoords = function( x,y )
	{
		// TODO : Determine the x and y coordinates from the colour...

		return { x:0, y:0 };
	};

	ColourWheel.prototype.getRGBHSV = function( x,y )
	{
		var HSV = this.getHSV( x,y );
		var RGB = hsvToRgb(
			HSV.hue,
			HSV.saturation,
			HSV.brightness
		);

		return {
			hue:HSV.hue,
			saturation:HSV.saturation,
			brightness:HSV.brightness,
			red:RGB[0],
			green:RGB[1],
			blue:RGB[2]
		};
	};

	ColourWheel.prototype.getRGB = function( x,y )
	{
		var HSV = this.getHSV( x,y );
		var selected = hsvToRgb(
			HSV.hue,
			HSV.saturation,
			oneHundred / oneHundred   		// 1
		);
		selected.pop();

		// [ red , green, blue ]
		return selected;
	};

	// x and y relative to canvas...
	ColourWheel.prototype.getColours = function( x,y )
	{
		var HSV = this.getHSV( x,y );
		var RGB = hsvToRgb(
			HSV.hue,
			HSV.saturation,
			HSV.brightness
		)[3];

		// rgb( xxx,xxx,xxx );
		return RGB;
	};

	// create an <img>
	ColourWheel.prototype.toBitmap = function( )
	{
		// Get the data-URL formatted image
		// Firefox supports PNG and JPEG.
		// Be aware the using "image/jpg"
		// will re-encode the image.
		var data = this.canvas.toDataURL("image/png");
		// trim off unneeded stuff
		data.replace(/^data:image\/(png|jpg);base64,/, "");
		return data;
	};

	// create an <img>
	ColourWheel.prototype.toImage = function( onComplete )
	{
		// now create an image Element...
		var image = new Image();
		image.onload = onComplete;
		image.src = this.toBitmap;	// now recreate image
	};

	/*
	// Handle manual calls + mousemove event handler + input change event handler all in one place.
	function redraw(e) {

		// Only process an actual change if it is triggered by the mousemove or mousedown event.
		// Otherwise e.pageX will be undefined, which will cause the result to be NaN, so it will fallback to the current value
		currentX = e.pageX - c.offsetLeft - radiusPlusOffset || currentX;
		currentY = e.pageY - c.offsetTop - radiusPlusOffset  || currentY;

		// Scope these locally so the compiler will minify the names.  Will manually remove the 'var' keyword in the minified version.
		var theta = atan2(currentY, currentX),
			d = currentX * currentX + currentY * currentY;

		// If the x/y is not in the circle, find angle between center and mouse point:
		//   Draw a line at that angle from center with the distance of radius
		//   Use that point on the circumference as the draggable location
		if (d > radiusSquared) {
			currentX = radius * math.cos(theta);
			currentY = radius * math.sin(theta);
			theta = atan2(currentY, currentX);
			d = currentX * currentX + currentY * currentY;
		}

		var selected = hsvToRgb(
			(theta + PI) / PI2,         // Current hue (how many degrees along the circle)
			sqrt(d) / radius,           // Current saturation (how close to the middle)
			input.value / oneHundred    // Current value (input type="range" slider value)
		)[3];

		return selected;
	};
	*/
	return ColourWheel;
})();
