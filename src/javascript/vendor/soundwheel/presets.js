var SoundWheel = SoundWheel || {};

SoundWheel.PRESETS = (

	function() {

		"use strict";
		
		var p = {};
		var pi2= Math.PI * 2;
		
		var generate = function( ratio, angle, colour, timbre )
		{
			return JSON.stringify({ 
				ratio : ratio, 
				angle : angle, 
				colour : colour, 
				timbre : timbre || 0 
			});
		};	
		
		// 
		p.k1 = [ generate( 0.9, pi2/2, {}, 0) ];
		p.k2 = [  ];
		p.k3 = [  ];
		p.k4 = [  ];
		p.k5 = [  ];
		p.k6 = [  ];
		p.k7 = [  ];
		p.k8 = [  ];
		p.k9 = [  ];

		console.log('Presets Loaded!' , p);
		
		return p;
	}()

);