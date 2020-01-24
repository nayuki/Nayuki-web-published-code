/* 
 * Tap to measure tempo
 * 
 * Copyright (c) 2020 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/tap-to-measure-tempo-javascript
 */

"use strict";


var startTime;
var beatTimes;
var xsum, xxsum, ysum, yysum, xysum;
var periodprev, aprev, bprev;
var isDone;

init();


function init() {
	startTime = null;
	beatTimes = [];
	xsum  = 0;
	xxsum = 0;
	ysum  = 0;
	yysum = 0;
	xysum = 0;
	isDone = false;
	document.onkeydown = doBeat;
}


function doBeat() {
	if (!isDone)
		countBeat(Date.now());
	return true;
}


function countBeat(currTime) {
	// Coordinates for linear regression
	if (startTime === null)
		startTime = currTime;
	var x = beatTimes.length;
	var y = currTime - startTime;
	
	// Add beat
	beatTimes.push(y);
	var beatCount = beatTimes.length;
	setValue("simpleBeats", beatCount);
	setValue("simpleTime", (y / 1000).toFixed(3));
	
	// Regression cumulative variables
	xsum  += x;
	xxsum += x * x;
	ysum  += y;
	yysum += y * y;
	xysum += x * y;
	
	var tempo = 60000 * x / y;
	if (beatCount < 8 || tempo < 190)
		setValue("simplePosition", Math.floor(x / 4) + " : " + x % 4);
	else  // Two taps per beat
		setValue("simplePosition", Math.floor(x / 8) + " : " + Math.floor(x / 2) % 4 + "." + x % 2 * 5);
	
	if (beatCount >= 2) {
		// Period and tempo, simple
		var period = y / x;
		setValue("simpleTempo", tempo.toFixed(2));
		setValue("simplePeriod", period.toFixed(2));
		
		// Advanced
		var xx = beatCount * xxsum - xsum * xsum;
		var yy = beatCount * yysum - ysum * ysum;
		var xy = beatCount * xysum - xsum * ysum;
		var a = (beatCount * xysum - xsum * ysum) / xx;  // Slope
		var b = (ysum * xxsum - xsum * xysum) / xx;  // Intercept
		setValue("advancedPeriod", a.toFixed(3));
		setValue("advancedOffset", b.toFixed(3));
		setValue("advancedCorrelation", (xy * xy / (xx * yy)).toFixed(9));
		setValue("advancedTempo", (60000 / a).toFixed(3));
		
		// Deviations from prediction
		if (beatCount >= 3) {
			setValue("simpleLastDev"  , (periodprev * x - y).toFixed(1));
			setValue("advancedStdDev" , (Math.sqrt(((yy - xy * xy / xx) / beatCount) / (beatCount - 2))).toFixed(3));
			setValue("advancedLastDev", (aprev * x + bprev - y).toFixed(1));
		}
		
		periodprev = period;
		aprev = a;
		bprev = b;
	}
}


function done() {
	isDone = true;
	setValue("simplePosition" , "");
	setValue("simpleLastDev"  , "");
	setValue("advancedLastDev", "");
}


function setValue(elemId, val) {
	document.getElementById(elemId).value = val;
}
