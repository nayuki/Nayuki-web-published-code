/* 
 * Tap to measure tempo
 * Copyright (c) 2011 Nayuki Minase
 */


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
		countBeat(new Date().getTime());
	return true;
}


function countBeat(currTime) {
	// Coordinates for linear regression
	if (startTime == null)
		startTime = currTime;
	var x = beatTimes.length;
	var y = currTime - startTime;
	
	// Add beat
	beatTimes.push(y);
	var beatCount = beatTimes.length;
	setValue("simpleBeats", beatCount);
	setValue("simpleTime", floatToString(y / 1000, 3));
	
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
		setValue("simpleTempo", floatToString(tempo, 2));
		setValue("simplePeriod", floatToString(period, 2));
		
		// Advanced
		var xx = beatCount * xxsum - xsum * xsum;
		var yy = beatCount * yysum - ysum * ysum;
		var xy = beatCount * xysum - xsum * ysum;
		var a = (beatCount * xysum - xsum * ysum) / xx;  // Slope
		var b = (ysum * xxsum - xsum * xysum) / xx;  // Intercept
		setValue("advancedPeriod", floatToString(a, 3));
		setValue("advancedOffset", floatToString(b, 3));
		setValue("advancedCorrelation", floatToString(xy * xy / (xx * yy), 9));
		setValue("advancedTempo", floatToString(60000 / a, 3));
		
		// Deviations from prediction
		if (beatCount >= 3) {
			setValue("simpleLastDev"  , floatToString(periodprev * x - y, 1));
			setValue("advancedStdDev" , floatToString(Math.sqrt(((yy - xy * xy / xx) / beatCount) / (beatCount - 2)), 3));
			setValue("advancedLastDev", floatToString(aprev * x + bprev - y, 1));
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


// d: Number of decimal places
function floatToString(x, d) {
	if (x < 0)
		return "-" + floatToString(-x, d);
	var m = Math.pow(10, d);
	var tp = Math.round(x % 1 * m);
	var s = "";
	for (var i = 0; i < d; i++) {
		s = tp % 10 + s;
		tp = Math.floor(tp / 10);
	}
	return Math.floor(Math.round(x * m) / m) + "." + s;
}


function setValue(elemId, val) {
	document.getElementById(elemId).value = val;
}
