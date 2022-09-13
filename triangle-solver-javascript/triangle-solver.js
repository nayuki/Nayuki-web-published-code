/* 
 * Triangle solver
 * 
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/triangle-solver-javascript
 */

"use strict";


// The main function, which handles the HTML input/output for solving a triangle.
function doSolve() {
	function doOutput(nodeId, val, suffix) {
		if (typeof val == "object" && val.length == 2) {  // Array
			setElementText(nodeId, formatNumber(val[0]) + suffix);
			setElementText(nodeId + "2", formatNumber(val[1]) + suffix);
			twosoln = true;
		} else if (typeof val == "number") {
			setElementText(nodeId, formatNumber(val) + suffix);
			setElementText(nodeId + "2", formatNumber(val) + suffix);
		} else
			throw new Error("Assertion error");
	}
	
	try {
		// Get input and solve
		var a = getInputNumber("sideAin");
		var b = getInputNumber("sideBin");
		var c = getInputNumber("sideCin");
		var A = getInputNumber("angleAin");
		var B = getInputNumber("angleBin");
		var C = getInputNumber("angleCin");
		var answer = solveTriangle(a, b, c, A, B, C);
		solution = answer.slice(0, 6);  // Global variable for mouse hover
		
		// Set outputs
		setElementText("status", answer[7]);
		var twosoln = false;  // Is set to true by doOutput() if any answer item is a length-2 array
		doOutput("sideAout" , answer[0], "");
		doOutput("sideBout" , answer[1], "");
		doOutput("sideCout" , answer[2], "");
		doOutput("angleAout", answer[3], DEGREE);
		doOutput("angleBout", answer[4], DEGREE);
		doOutput("angleCout", answer[5], DEGREE);
		doOutput("areaout"  , answer[6], "");
		if (twosoln)
			document.getElementById("formtable").classList.remove("onesoln");
		else
			document.getElementById("formtable").classList.add("onesoln");
		
	} catch (e) {
		doClearOutputs();
		setElementText("status", e.message);
	}
}


/*---- Solver functions ----*/

// Given some sides and angles, this returns a tuple of 8 number/string values.
function solveTriangle(a, b, c, A, B, C) {
	var sides  = (a !== null) + (b !== null) + (c !== null);  // Boolean to integer conversion
	var angles = (A !== null) + (B !== null) + (C !== null);  // Boolean to integer conversion
	var area, status;
	
	if (sides + angles != 3)
		throw new RangeError("Give exactly 3 pieces of information");
	else if (sides == 0)
		throw new RangeError("Give at least one side length");
	
	else if (sides == 3) {
		status = "Side side side (SSS) case";
		if (a + b <= c || b + c <= a || c + a <= b)
			throw new RangeError(status + " - No solution");
		A = solveAngle(b, c, a);
		B = solveAngle(c, a, b);
		C = solveAngle(a, b, c);
		// Heron's formula
		var s = (a + b + c) / 2;
		area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
		
	} else if (angles == 2) {
		if (A === null && a !== null || B === null && b !== null || C === null && c !== null)
			status = "Angle side angle (ASA) case";
		else
			status = "Angle angle side (AAS) case";
		// Find missing angle
		if (A === null) A = 180 - B - C;
		if (B === null) B = 180 - C - A;
		if (C === null) C = 180 - A - B;
		if (A <= 0 || B <= 0 || C <= 0)
			throw new RangeError(status + " - No solution");
		var sinA = Math.sin(degToRad(A));
		var sinB = Math.sin(degToRad(B));
		var sinC = Math.sin(degToRad(C));
		// Use law of sines to find sides
		var ratio;  // side / sin(angle)
		if (a !== null) { ratio = a / sinA; area = a * ratio * sinB * sinC / 2; }
		if (b !== null) { ratio = b / sinB; area = b * ratio * sinC * sinA / 2; }
		if (c !== null) { ratio = c / sinC; area = c * ratio * sinA * sinB / 2; }
		if (a === null) a = ratio * sinA;
		if (b === null) b = ratio * sinB;
		if (c === null) c = ratio * sinC;
		
	} else if (A !== null && a === null || B !== null && b === null || C !== null && c === null) {
		status = "Side angle side (SAS) case";
		if (A !== null && A >= 180 || B !== null && B >= 180 || C !== null && C >= 180)
			throw new RangeError(status + " - No solution");
		if (a === null) a = solveSide(b, c, A);
		if (b === null) b = solveSide(c, a, B);
		if (c === null) c = solveSide(a, b, C);
		if (A === null) A = solveAngle(b, c, a);
		if (B === null) B = solveAngle(c, a, b);
		if (C === null) C = solveAngle(a, b, c);
		if (A !== null) area = b * c * Math.sin(degToRad(A)) / 2;
		if (B !== null) area = c * a * Math.sin(degToRad(B)) / 2;
		if (C !== null) area = a * b * Math.sin(degToRad(C)) / 2;
		
	} else {
		status = "Side side angle (SSA) case - ";
		var knownSide, knownAngle, partialSide;
		if (a !== null && A !== null) { knownSide = a; knownAngle = A; }
		if (b !== null && B !== null) { knownSide = b; knownAngle = B; }
		if (c !== null && C !== null) { knownSide = c; knownAngle = C; }
		if (a !== null && A === null) partialSide = a;
		if (b !== null && B === null) partialSide = b;
		if (c !== null && C === null) partialSide = c;
		if (knownAngle >= 180)
			throw new RangeError(status + "No solution");
		var ratio = knownSide / Math.sin(degToRad(knownAngle));
		var temp = partialSide / ratio;  // sin(partialAngle)
		var partialAngle, unknownSide, unknownAngle;
		if (temp > 1 || knownAngle >= 90 && knownSide <= partialSide)
			throw new RangeError(status + "No solution");
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
		if (a !== null && A === null) A = partialAngle;
		if (b !== null && B === null) B = partialAngle;
		if (c !== null && C === null) C = partialAngle;
		if (a === null && A === null) { a = unknownSide; A = unknownAngle; }
		if (b === null && B === null) { b = unknownSide; B = unknownAngle; }
		if (c === null && C === null) { c = unknownSide; C = unknownAngle; }
	}
	
	return [a, b, c, A, B, C, area, status];
}


// Returns side c using law of cosines.
function solveSide(a, b, C) {
	C = degToRad(C);
	if (C > 0.001)
		return Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(C));
	else  // Explained in https://www.nayuki.io/page/numerically-stable-law-of-cosines
		return Math.sqrt((a - b) * (a - b) + a * b * C * C * (1 - C * C / 12));
}


// Returns angle C using law of cosines.
function solveAngle(a, b, c) {
	var temp = (a * a + b * b - c * c) / (2 * a * b);
	if (-1 <= temp && temp <= 0.9999999)
		return radToDeg(Math.acos(temp));
	else if (temp <= 1)  // Explained in https://www.nayuki.io/page/numerically-stable-law-of-cosines
		return radToDeg(Math.sqrt((c * c - (a - b) * (a - b)) / (a * b)));
	else
		throw new RangeError("No solution");
}


/*---- Input/output/GUI handling ----*/

// e.g. sideA is associated with sideAin, sideAout, and sideAout2. But area does not have an input.
var ioNames = ["sideA", "sideB", "sideC", "angleA", "angleB", "angleC", "area"];

// Either null, or an array of 6 items: [sideA, sideB, sideC, angleA, angleB, angleC].
// Each item is either a number or an array of 2 numbers.
var solution = null;


// Parses the number from the HTML form field with the given ID.
// Returns the number if it's positive and finite. Throws an exception if it's zero, negative, infinite, or NaN.
// Returns null if the field is blank.
function getInputNumber(elemId) {
	var str = document.getElementById(elemId).value;
	if (str == "")
		return null;
	var result = parseFloat(str);
	if (!isFinite(result))
		throw new Error("Invalid number");
	if (result <= 0)
		throw new Error("All inputs must be positive");
	return result;
}


function doClearOutputs() {
	solution = null;
	document.getElementById("formtable").classList.add("onesoln");
	for (const name of ioNames) {
		setElementText(name + "out" , "");
		setElementText(name + "out2", "");
	}
	setElementText("status", "");
}


var RECT_PADDED_SIZE = 0.0720;

// List of tuples (left, top, width, height). Values will be modified by initImageMap() to include padding.
var rectangles = [
	[0.4922, 0.4419, 0.0227, 0.0229],
	[0.1784, 0.1789, 0.0221, 0.0339],
	[0.6424, 0.1754, 0.0201, 0.0229],
	[0.3492, 0.0964, 0.0322, 0.0333],
	[0.7803, 0.3531, 0.0330, 0.0326],
	[0.1393, 0.3504, 0.0322, 0.0340],
];

function initImageMap() {
	var container = document.getElementById("diagramcontainer");
	var containerWidth = parseEm(container.style.width);
	rectangles.forEach(function(rect, i) {
		var elem = document.createElement("a");
		container.insertBefore(elem, container.querySelector("#hoveroutput"));
		elem.href = "#";
		elem.classList.add("letterhover");
		rect[0] -= (RECT_PADDED_SIZE - rect[2]) / 2;
		rect[1] -= (RECT_PADDED_SIZE - rect[3]) / 2;
		elem.style.left = rect[0] * containerWidth + "em";
		elem.style.top  = rect[1] * containerWidth + "em";
		elem.style.width = elem.style.height = RECT_PADDED_SIZE * containerWidth + "em";
		
		elem.onmouseover = function() {
			if (solution === null)
				return;
			
			var suffix = 3 <= i && i < 6 ? DEGREE : "";
			var text;
			if (typeof solution[i] == "object")
				text = formatNumber(solution[i][0]) + suffix + " or\n" + formatNumber(solution[i][1]) + suffix;
			else
				text = formatNumber(solution[i]) + suffix;
			setElementText("hoveroutput", text);
			
			// Set hover element style
			var hovelem = document.getElementById("hoveroutput");
			hovelem.style.display = "block";
			hovelem.style.left = rect[0] * containerWidth + "em";
			hovelem.style.bottom = ((0.5 - rect[1]) * containerWidth + 0.5) + "em";
		};
		
		elem.onmouseout = function() {
			setElementText("hoveroutput", "");
			document.getElementById("hoveroutput").style.display = "none";
		};
		elem.onclick = function(ev) {
			ev.preventDefault();
			document.getElementById(ioNames[i] + "in").select();
		};
	});
}

setTimeout(initImageMap);


/*---- Simple functions ----*/

function setElementText(nodeId, str) {
	document.getElementById(nodeId).textContent = str;
}

function parseEm(str) {
	var match = /^(\d+(?:\.\d*)?)em$/.exec(str);
	if (match !== null)
		return parseFloat(match[1]);
	else
		throw new RangeError("Invalid unit");
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

var DEGREE = "\u00B0";
