/* 
 * Tap to measure tempo
 * 
 * Copyright (c) 2021 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/tap-to-measure-tempo-javascript
 */

"use strict";


(function() {
	
	function initialize() {
		clearText("simple-beats");
		clearText("simple-position");
		clearText("simple-time");
		clearText("advanced-std-dev");
		clearText("advanced-offset");
		clearText("advanced-correlation");
		clearText("simple-last-dev");
		clearText("advanced-last-dev");
		clearText("simple-period");
		clearText("advanced-period");
		clearText("simple-tempo");
		clearText("advanced-tempo");
		
		var beatTimes = [];
		var xSum  = 0;
		var xxSum = 0;
		var ySum  = 0;
		var yySum = 0;
		var xySum = 0;
		var periodPrev = NaN;
		var aPrev = NaN;
		var bPrev = NaN;
		
		
		document.onkeydown = function() {
			// Add beat
			beatTimes.push(Date.now());
			var n = beatTimes.length;
			setText("simple-beats", n);
			
			// Coordinates for linear regression
			var x = n - 1;
			var y = beatTimes[n - 1] - beatTimes[0];
			setText("simple-time", (y / 1000).toFixed(3) + " s");
			
			// Regression cumulative variables
			xSum  += x;
			xxSum += x * x;
			ySum  += y;
			yySum += y * y;
			xySum += x * y;
			
			var tempo = 60000 * x / y;
			if (n < 8 || tempo < 190)
				setText("simple-position", "Bar " + Math.floor(x / 4) + " : Beat " + x % 4);
			else  // Two taps per beat
				setText("simple-position", "Bar " + Math.floor(x / 8) + " : Beat " + Math.floor(x / 2) % 4 + "." + x % 2 * 5);
			
			if (n >= 2) {
				// Period and tempo, simple
				var period = y / x;
				setText("simple-tempo", tempo.toFixed(2) + " BPM");
				setText("simple-period", period.toFixed(2) + " ms");
				
				// Advanced
				var xx = n * xxSum - xSum * xSum;
				var yy = n * yySum - ySum * ySum;
				var xy = n * xySum - xSum * ySum;
				var a = (n * xySum - xSum * ySum) / xx;  // Slope
				var b = (ySum * xxSum - xSum * xySum) / xx;  // Intercept
				setText("advanced-period", a.toFixed(3) + " ms");
				setText("advanced-offset", b.toFixed(2).replace(/-/, "\u2212") + " ms");
				setText("advanced-correlation", (xy * xy / (xx * yy)).toFixed(9));
				setText("advanced-tempo", (60000 / a).toFixed(3) + " BPM");
				
				// Deviations from prediction
				if (n >= 3) {
					var simpleLastDev = periodPrev * x - y;
					var advancedLastDev = aPrev * x + bPrev - y;
					setText("simple-last-dev"  , Math.abs(simpleLastDev).toFixed(1) + " ms " + (simpleLastDev < 0 ? "late" : "early"));
					setText("advanced-std-dev" , Math.sqrt(((yy - xy * xy / xx) / n) / (n - 2)).toFixed(2) + " ms");
					setText("advanced-last-dev", Math.abs(advancedLastDev).toFixed(1) + " ms " + (advancedLastDev < 0 ? "late" : "early"));
				}
				
				periodPrev = period;
				aPrev = a;
				bPrev = b;
			}
		};
		
		
		document.querySelector("#program button#done").onclick = function() {
			document.onkeydown = null;
			clearText("simple-position");
			clearText("simple-last-dev");
			clearText("advanced-last-dev");
		};
	}
	
	
	initialize();
	document.querySelector("#program button#reset").onclick = initialize;
	
	
	function setText(elemId, str) {
		document.getElementById(elemId).textContent = str;
	}
	
	function clearText(elemId) {
		setText(elemId, "");
	}
	
})();
