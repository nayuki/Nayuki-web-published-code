/*
 * Triangle solver
 * Copyright (c) 2011 Nayuki Minase
 */


/*
 * Handles the HTML input/output for solving a triangle.
 * This is the one and only entry point function called from the HTML code.
 */
function solve() {
	var status;
	var sideA, sideB, sideC;
	var angleA, angleB, angleC;
	try {
		sideA = getNumber("sideAin");
		sideB = getNumber("sideBin");
		sideC = getNumber("sideCin");
		angleA = getNumber("angleAin");
		angleB = getNumber("angleBin");
		angleC = getNumber("angleCin");
		var sidesGiven = (sideA != null) + (sideB != null) + (sideC != null);  // Boolean to integer conversion
		var anglesGiven = (angleA != null) + (angleB != null) + (angleC != null);  // Boolean to integer conversion
		
		if (sidesGiven == 0)
			throw "Give at least one side length";
		else if (sidesGiven + anglesGiven != 3)
			throw "Give exactly 3 pieces of information";
		
		else if (sidesGiven == 3) {
			status = "Side side side (SSS) case";
			angleA = solveAngle(sideB, sideC, sideA);
			angleB = solveAngle(sideC, sideA, sideB);
			angleC = solveAngle(sideA, sideB, sideC);
			
		} else if (anglesGiven == 2) {
			status = "Angle side angle (ASA) case";
			// Find missing angle
			if (angleA == null) angleA = 180 - angleB - angleC;
			if (angleB == null) angleB = 180 - angleC - angleA;
			if (angleC == null) angleC = 180 - angleA - angleB;
			// Use law of sines to find sides
			var ratio;  // side / sin(angle)
			if (sideA != null) ratio = sideA / Math.sin(degToRad(angleA));
			if (sideB != null) ratio = sideB / Math.sin(degToRad(angleB));
			if (sideC != null) ratio = sideC / Math.sin(degToRad(angleC));
			if (sideA == null) sideA = ratio * Math.sin(degToRad(angleA));
			if (sideB == null) sideB = ratio * Math.sin(degToRad(angleB));
			if (sideC == null) sideC = ratio * Math.sin(degToRad(angleC));
			
		} else if (angleA != null && sideA == null || angleB != null && sideB == null || angleC != null && sideC == null) {
			status = "Side angle side (SAS) case";
			if (sideA == null) sideA = solveSide(sideB, sideC, angleA);
			if (sideB == null) sideB = solveSide(sideC, sideA, angleB);
			if (sideC == null) sideC = solveSide(sideA, sideB, angleC);
			if (angleA == null) angleA = solveAngle(sideB, sideC, sideA);
			if (angleB == null) angleB = solveAngle(sideC, sideA, sideB);
			if (angleC == null) angleC = solveAngle(sideA, sideB, sideC);
			
		} else {
			status = "Side side angle (SSA) case - ";
			var knownSide, knownAngle, partialSide;
			if (sideA != null && angleA != null) { knownSide = sideA; knownAngle = angleA; }
			if (sideB != null && angleB != null) { knownSide = sideB; knownAngle = angleB; }
			if (sideC != null && angleC != null) { knownSide = sideC; knownAngle = angleC; }
			if (sideA != null && angleA == null) partialSide = sideA;
			if (sideB != null && angleB == null) partialSide = sideB;
			if (sideC != null && angleC == null) partialSide = sideC;
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
			if (sideA != null && angleA == null) angleA = partialAngle;
			if (sideB != null && angleB == null) angleB = partialAngle;
			if (sideC != null && angleC == null) angleC = partialAngle;
			if (sideA == null && angleA == null) { sideA = unknownSide; angleA = unknownAngle; }
			if (sideB == null && angleB == null) { sideB = unknownSide; angleB = unknownAngle; }
			if (sideC == null && angleC == null) { sideC = unknownSide; angleC = unknownAngle; }
		}
	} catch (e) {
		status = e;
		sideA = sideB = sideC = angleA = angleB = angleC = "";
	}
	
	// Set status
	var statusElem = document.getElementById("status");
	removeAllChildren(statusElem);
	statusElem.appendChild(document.createTextNode(status));
	
	document.getElementById("sideAout").value = sideA.toString();
	document.getElementById("sideBout").value = sideB.toString();
	document.getElementById("sideCout").value = sideC.toString();
	document.getElementById("angleAout").value = angleA.toString();
	document.getElementById("angleBout").value = angleB.toString();
	document.getElementById("angleCout").value = angleC.toString();
}


/* Solver functions */

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
