/* 
 * Triangle solver
 * Copyright (c) 2012 Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/triangle-solver-javascript
 */


// The main function, which handles the HTML input/output for solving a triangle.
function solve() {
	try {
		// Get input and solve
		var a = getInputNumber("sideAin");
		var b = getInputNumber("sideBin");
		var c = getInputNumber("sideCin");
		var A = getInputNumber("angleAin");
		var B = getInputNumber("angleBin");
		var C = getInputNumber("angleCin");
		var answer = solveTriangle(a, b, c, A, B, C);
		solution = answer.slice(0, 6);
		
		// Set outputs
		setElementText("status", answer[7]);
		var solution2 = false;
		function doOutput(nodeId, val) {
			if (typeof val == "object" && val.length == 2) {  // Array
				setElementText(nodeId, formatNumber(val[0]));
				setElementText(nodeId + "2", formatNumber(val[1]));
				solution2 = true;
			} else if (typeof val == "number") {
				setElementText(nodeId, formatNumber(val));
				setElementText(nodeId + "2", formatNumber(val));
			} else
				throw "Assertion error";
		}
		doOutput("sideAout" , answer[0]);
		doOutput("sideBout" , answer[1]);
		doOutput("sideCout" , answer[2]);
		doOutput("angleAout", answer[3]);
		doOutput("angleBout", answer[4]);
		doOutput("angleCout", answer[5]);
		doOutput("areaout"  , answer[6]);
		document.getElementById("formtable").className = solution2 ? "noborder" : "noborder nosolution2";
		
	} catch (e) {
		clearOutputs();
		setElementText("status", e);
	}
}


/* Solver functions */

function solveTriangle(a, b, c, A, B, C) {
	var sides  = (a != null) + (b != null) + (c != null);  // Boolean to integer conversion
	var angles = (A != null) + (B != null) + (C != null);  // Boolean to integer conversion
	var area, status;
	
	if (sides + angles != 3)
		throw "Give exactly 3 pieces of information";
	else if (sides == 0)
		throw "Give at least one side length";
	
	else if (sides == 3) {
		status = "Side side side (SSS) case";
		if (a + b <= c || b + c <= a || c + a <= b)
			throw status + " - No solution";
		A = solveAngle(b, c, a);
		B = solveAngle(c, a, b);
		C = solveAngle(a, b, c);
		// Heron's formula
		var s = (a + b + c) / 2;
		area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
		
	} else if (angles == 2) {
		status = "Angle side angle (ASA) case";
		// Find missing angle
		if (A == null) A = 180 - B - C;
		if (B == null) B = 180 - C - A;
		if (C == null) C = 180 - A - B;
		if (A <= 0 || B <= 0 || C <= 0)
			throw status + " - No solution";
		var sinA = Math.sin(degToRad(A));
		var sinB = Math.sin(degToRad(B));
		var sinC = Math.sin(degToRad(C));
		// Use law of sines to find sides
		var ratio;  // side / sin(angle)
		if (a != null) { ratio = a / sinA; area = a * ratio * sinB * sinC / 2; }
		if (b != null) { ratio = b / sinB; area = b * ratio * sinC * sinA / 2; }
		if (c != null) { ratio = c / sinC; area = c * ratio * sinA * sinB / 2; }
		if (a == null) a = ratio * sinA;
		if (b == null) b = ratio * sinB;
		if (c == null) c = ratio * sinC;
		
	} else if (A != null && a == null || B != null && b == null || C != null && c == null) {
		status = "Side angle side (SAS) case";
		if (A != null && A >= 180 || B != null && B >= 180 || C != null && C >= 180)
			throw status + " - No solution";
		if (a == null) a = solveSide(b, c, A);
		if (b == null) b = solveSide(c, a, B);
		if (c == null) c = solveSide(a, b, C);
		if (A == null) A = solveAngle(b, c, a);
		if (B == null) B = solveAngle(c, a, b);
		if (C == null) C = solveAngle(a, b, c);
		if (A != null) area = b * c * Math.sin(degToRad(A)) / 2;
		if (B != null) area = c * a * Math.sin(degToRad(B)) / 2;
		if (C != null) area = a * b * Math.sin(degToRad(C)) / 2;
		
	} else {
		status = "Side side angle (SSA) case - ";
		var knownSide, knownAngle, partialSide;
		if (a != null && A != null) { knownSide = a; knownAngle = A; }
		if (b != null && B != null) { knownSide = b; knownAngle = B; }
		if (c != null && C != null) { knownSide = c; knownAngle = C; }
		if (a != null && A == null) partialSide = a;
		if (b != null && B == null) partialSide = b;
		if (c != null && C == null) partialSide = c;
		if (knownAngle >= 180)
			throw status + "No solution";
		var ratio = knownSide / Math.sin(degToRad(knownAngle));
		var temp = partialSide / ratio;  // sin(partialAngle)
		var partialAngle, unknownSide, unknownAngle;
		if (temp > 1 || knownAngle >= 90 && knownSide <= partialSide)
			throw status + "No solution";
		else if (temp == 1 || knownSide >= partialSide) {
			status += "Unique solution";
			partialAngle = radToDeg(Math.asin(temp));
			unknownAngle = 180 - knownAngle - partialAngle;
			unknownSide = ratio * Math.sin(degToRad(unknownAngle));  // Law of sines
			area = knownSide * partialSide * Math.sin(degToRad(unknownAngle)) / 2;
		} else {
			status += "Two solutions";
			var partialAngle0 = radToDeg(Math.asin(temp));
			var partialAngle1 = 180 - partialAngle0;
			var unknownAngle0 = 180 - knownAngle - partialAngle0;
			var unknownAngle1 = 180 - knownAngle - partialAngle1;
			var unknownSide0 = ratio * Math.sin(degToRad(unknownAngle0));  // Law of sines
			var unknownSide1 = ratio * Math.sin(degToRad(unknownAngle1));  // Law of sines
			partialAngle = [partialAngle0, partialAngle1];
			unknownAngle = [unknownAngle0, unknownAngle1];
			unknownSide = [unknownSide0, unknownSide1];
			area = [knownSide * partialSide * Math.sin(degToRad(unknownAngle0)) / 2,
			        knownSide * partialSide * Math.sin(degToRad(unknownAngle1)) / 2];
		}
		if (a != null && A == null) A = partialAngle;
		if (b != null && B == null) B = partialAngle;
		if (c != null && C == null) C = partialAngle;
		if (a == null && A == null) { a = unknownSide; A = unknownAngle; }
		if (b == null && B == null) { b = unknownSide; B = unknownAngle; }
		if (c == null && C == null) { c = unknownSide; C = unknownAngle; }
	}
	
	return [a, b, c, A, B, C, area, status];
}


function solveSide(a, b, C) {  // Returns side c using law of cosines
	return Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(degToRad(C)));
}

function solveAngle(a, b, c) {  // Returns angle C using law of cosines
	var temp = (a * a + b * b - c * c) / (2 * a * b);
	if (temp >= -1 && temp <= 1)
		return radToDeg(Math.acos(temp));
	else
		throw "No solution";
}


/* Input/output/GUI handling functions */

// e.g. sideA is associated with sideAin, sideAout, and sideAout2. But area does not have an input.
var ioNames = ["sideA", "sideB", "sideC", "angleA", "angleB", "angleC", "area"];

// Either null, or an array of 6 items: [sideA, sideB, sideC, angleA, angleB, angleC].
// Each item is either a number or an array of 2 numbers.
var solution = null;


// Parses the number from the HTML form field with the given ID. Trims leading and trailing whitespace.
// Returns the number if it's positive and finite. Throws an exception if it's zero, negative, infinite, or NaN.
// Returns null if the field is blank (after trimming).
function getInputNumber(elemId) {
	var str = document.getElementById(elemId).value.replace(/^\s+|\s+$/g, "");  // Trim whitespace
	if (str == "")
		return null;
	var result = parseFloat(str);
	if (!isFinite(result))
		throw "Invalid number";
	if (result <= 0)
		throw "All inputs must be positive";
	return result;
}


function clearOutputs() {
	solution = null;
	document.getElementById("formtable").className = "noborder nosolution2";
	for (var i = 0; i < ioNames.length; i++) {
		setElementText(ioNames[i] + "out" , "");
		setElementText(ioNames[i] + "out2", "");
	}
	setElementText("status", "");
}


var rectanglePadding = 8;

// Left, top, width, height
var rectangles = [
	[246,221,12,12],
	[ 89, 89,12,18],
	[321, 87,11,13],
	[176, 48,15,17],  // Tweaked for better aesthetics. True dimensions are [175,48,15,17]
	[391,176,16,17],
	[ 69,175,17,18]
];

function initImageMap() {
	var container = document.getElementById("diagramcontainer");
	for (var i = 0; i < rectangles.length; i++) {
		var rect = rectangles[i];
		var left   = rect[0] - rectanglePadding;
		var top    = rect[1] - rectanglePadding;
		var width  = rect[2] + rectanglePadding * 2;
		var height = rect[3] + rectanglePadding * 2;
		var elem = document.createElement("a");
		elem.className = "letterhover";
		elem.style.left   = left   + "px";
		elem.style.top    = top    + "px";
		elem.style.width  = width  + "px";
		elem.style.height = height + "px";
		elem.href = "#";
		function setEvents(index) {
			function hover() {
				if (solution == null)
					return;
				
				var text;
				if (typeof solution[index] == "object")
					text = formatNumber(solution[index][0]) + " or " + formatNumber(solution[index][1]);
				else
					text = formatNumber(solution[index]);
				setElementText("hoveroutput", text);
				
				// Set hover element style
				var elem = document.getElementById("hoveroutput");
				elem.style.display = "block";
				try {
					var compStyle = window.getComputedStyle(elem, null);
					var height = parsePixels(compStyle.getPropertyValue("height"))
					height    += parsePixels(compStyle.getPropertyValue("padding-top"));
					height    += parsePixels(compStyle.getPropertyValue("padding-bottom"));
					elem.style.top = rectangles[index][1] - height - rectanglePadding - 8 + "px";
					
					var temp = document.getElementById("diagramcontainer");
					var containerWidth = parsePixels(window.getComputedStyle(temp, null).getPropertyValue("width"));
					var bodyWidth = parsePixels(window.getComputedStyle(temp.parentNode, null).getPropertyValue("width"));
					elem.style.left = Math.round((bodyWidth - containerWidth) / 2) + rectangles[index][0] - rectanglePadding + "px";
				} catch (e) {
					elem.style.left = "0px";
					elem.style.top = "0px";
				}
			}
			
			function unhover(index) {
				setElementText("hoveroutput", "");
				document.getElementById("hoveroutput").style.display = "none";
			}
			
			elem.onmouseover = function() { hover(index); }
			elem.onmouseout = function() { unhover(index); }
			elem.onclick = function() {
				document.getElementById(ioNames[index] + "in").select();
				return false;
			}
		}
		setEvents(i);
		container.appendChild(elem);
	}
}


/* Simple functions */

function setElementText(nodeId, str) {
	var node = document.getElementById(nodeId);
	removeAllChildren(node);
	node.appendChild(document.createTextNode(str));
}

function removeAllChildren(node) {
	while (node.childNodes.length > 0)
		node.removeChild(node.firstChild);
}

function parsePixels(str) {
	var match = /^(\d+(?:\.\d*)?)px$/.exec(str);
	if (match != null)
		return parseFloat(match[1]);
	else
		throw "Invalid unit";
}

function formatNumber(x) {
	return x.toPrecision(9);
}

function degToRad(x) {
	return x / 180 * Math.PI;
}

function radToDeg(x) {
	return x / Math.PI * 180;
}


/* Initialization */

initImageMap();
