/*
 * Triangle solver
 * Copyright (c) 2011 Nayuki Minase
 */


/*
 * Handles the HTML input/output for solving a triangle.
 * This is the one and only entry point function called from the HTML code.
 */
function solve() {
	// Get input and solve
	var status, a, b, c, A, B, C;
	try {
		a = getNumber("sideAin");  b = getNumber("sideBin");  c = getNumber("sideCin");
		A = getNumber("angleAin"); B = getNumber("angleBin"); C = getNumber("angleCin");
		var answer = solveTriangle(a, b, c, A, B, C);
		a = answer[0]; b = answer[1]; c = answer[2];
		A = answer[3]; B = answer[4]; C = answer[5];
		status = answer[6];
	} catch (e) {
		status = e;
		a = b = c = A = B = C = "";
	}
	
	// Set status
	var statusElem = document.getElementById("status");
	removeAllChildren(statusElem);
	statusElem.appendChild(document.createTextNode(status));
	
	// Set numbers
	document.getElementById("sideAout").value = a.toString();
	document.getElementById("sideBout").value = b.toString();
	document.getElementById("sideCout").value = c.toString();
	document.getElementById("angleAout").value = A.toString();
	document.getElementById("angleBout").value = B.toString();
	document.getElementById("angleCout").value = C.toString();
}


/* Solver functions */

function solveTriangle(a, b, c, A, B, C) {
	var sides  = (a != null) + (b != null) + (c != null);  // Boolean to integer conversion
	var angles = (A != null) + (B != null) + (C != null);  // Boolean to integer conversion
	var status;
	
	if (sides == 0)
		throw "Give at least one side length";
	else if (sides + angles != 3)
		throw "Give exactly 3 pieces of information";
	
	else if (sides == 3) {
		status = "Side side side (SSS) case";
		A = solveAngle(b, c, a);
		B = solveAngle(c, a, b);
		C = solveAngle(a, b, c);
		
	} else if (angles == 2) {
		status = "Angle side angle (ASA) case";
		// Find missing angle
		if (A == null) A = 180 - B - C;
		if (B == null) B = 180 - C - A;
		if (C == null) C = 180 - A - B;
		// Use law of sines to find sides
		var ratio;  // side / sin(angle)
		if (a != null) ratio = a / Math.sin(degToRad(A));
		if (b != null) ratio = b / Math.sin(degToRad(B));
		if (c != null) ratio = c / Math.sin(degToRad(C));
		if (a == null) a = ratio * Math.sin(degToRad(A));
		if (b == null) b = ratio * Math.sin(degToRad(B));
		if (c == null) c = ratio * Math.sin(degToRad(C));
		
	} else if (A != null && a == null || B != null && b == null || C != null && c == null) {
		status = "Side angle side (SAS) case";
		if (a == null) a = solveSide(b, c, A);
		if (b == null) b = solveSide(c, a, B);
		if (c == null) c = solveSide(a, b, C);
		if (A == null) A = solveAngle(b, c, a);
		if (B == null) B = solveAngle(c, a, b);
		if (C == null) C = solveAngle(a, b, c);
		
	} else {
		status = "Side side angle (SSA) case - ";
		var knownSide, knownAngle, partialSide;
		if (a != null && A != null) { knownSide = a; knownAngle = A; }
		if (b != null && B != null) { knownSide = b; knownAngle = B; }
		if (c != null && C != null) { knownSide = c; knownAngle = C; }
		if (a != null && A == null) partialSide = a;
		if (b != null && B == null) partialSide = b;
		if (c != null && C == null) partialSide = c;
		var ratio = knownSide / Math.sin(degToRad(knownAngle));
		var temp = partialSide / ratio;  // sin(partialAngle)
		var partialAngle, unknownSide, unknownAngle;
		if (temp > 1)
			throw "Side side angle (SSA) - No solution";
		else if (temp == 1 || knownSide > partialSide) {
			status += "Unique solution";
			partialAngle = radToDeg(Math.asin(temp));
			unknownAngle = 180 - knownAngle - partialAngle;
			unknownSide = ratio * Math.sin(degToRad(unknownAngle));  // Law of sines
		} else {
			status += "Two solutions";
			var partialAngle0 = radToDeg(Math.asin(temp));
			var partialAngle1 = 180 - partialAngle0;
			var unknownAngle0 = 180 - knownAngle - partialAngle0;
			var unknownAngle1 = 180 - knownAngle - partialAngle1;
			var unknownSide0 = ratio * Math.sin(degToRad(unknownAngle0));  // Law of sines
			var unknownSide1 = ratio * Math.sin(degToRad(unknownAngle1));  // Law of sines
			partialAngle = partialAngle0 + " or " + partialAngle1;
			unknownAngle = unknownAngle0 + " or " + unknownAngle1;
			unknownSide = unknownSide0 + " or " + unknownSide1;
		}
		if (a != null && A == null) A = partialAngle;
		if (b != null && B == null) B = partialAngle;
		if (c != null && C == null) C = partialAngle;
		if (a == null && A == null) { a = unknownSide; A = unknownAngle; }
		if (b == null && B == null) { b = unknownSide; B = unknownAngle; }
		if (c == null && C == null) { c = unknownSide; C = unknownAngle; }
	}
	
	return [a, b, c, A, B, C, status];
}


function solveSide(a, b, C) {  // Returns side c
	return Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(degToRad(C)));
}

function solveAngle(a, b, c) {  // Returns angle C
	var temp = (a * a + b * b - c * c) / (2 * a * b);
	if (temp >= -1 && temp <= 1)
		return radToDeg(Math.acos(temp));
	else
		throw "No solution";
}


/* Input/output handling functions */

function getNumber(id) {
	var str = document.getElementById(id).value;
	if (str == "")
		return null;
	var result = parseFloat(str);
	if (!isFinite(result))
		throw "Not a real number";
	return result;
}


/* Trivial functions */

function degToRad(x) {
	return x / 180 * Math.PI;
}

function radToDeg(x) {
	return x / Math.PI * 180;
}

function removeAllChildren(node) {
	while (node.childNodes.length > 0)
		node.removeChild(node.firstChild);
}
