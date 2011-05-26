function solve() {
	try {
		var sideA = getNumber("sideAin");
		var sideB = getNumber("sideBin");
		var sideC = getNumber("sideCin");
		var angleA = getNumber("angleAin");
		var angleB = getNumber("angleBin");
		var angleC = getNumber("angleCin");
		var sidesgiven = 0;
		var anglesgiven = 0;
		if (sideA != null) sidesgiven++;
		if (sideB != null) sidesgiven++;
		if (sideC != null) sidesgiven++;
		if (angleA != null) anglesgiven++;
		if (angleB != null) anglesgiven++;
		if (angleC != null) anglesgiven++;
		if (sidesgiven == 0)
			throw "At least one side must be given";
		if (sidesgiven + anglesgiven != 3)
			throw "Exactly 3 givens are required";
		var trianglecase;
		
		if (sidesgiven == 3) {
			trianglecase = "Side side side (SSS)";
			angleA=solveAngle(sideB, sideC, sideA);
			angleB=solveAngle(sideC, sideA, sideB);
			angleC=solveAngle(sideA, sideB, sideC);
			
		} else if (anglesgiven == 2) {
			trianglecase = "Angle side angle (ASA)";
			if (angleA == null) angleA = 180 - angleB - angleC;
			if (angleB == null) angleB = 180 - angleC - angleA;
			if (angleC == null) angleC = 180 - angleA - angleB;
			var ratio;  // side / sin(angle)
			if (sideA != null) ratio = sideA / Math.sin(degToRad(angleA));
			if (sideB != null) ratio = sideB / Math.sin(degToRad(angleB));
			if (sideC != null) ratio = sideC / Math.sin(degToRad(angleC));
			if (sideA == null) sideA = ratio * Math.sin(degToRad(angleA));
			if (sideB == null) sideB = ratio * Math.sin(degToRad(angleB));
			if (sideC == null) sideC = ratio * Math.sin(degToRad(angleC));
			
		} else if (angleA != null && sideA == null || angleB != null && sideB == null || angleC != null && sideC == null) {
			trianglecase="Side angle side (SAS)";
			if (sideA == null) sideA = solveSide(sideB, sideC, angleA);
			if (sideB == null) sideB = solveSide(sideC, sideA, angleB);
			if (sideC == null) sideC = solveSide(sideA, sideB, angleC);
			if (angleA == null) angleA = solveAngle(sideB, sideC, sideA);
			if (angleB == null) angleB = solveAngle(sideC, sideA, sideB);
			if (angleC == null) angleC = solveAngle(sideA, sideB, sideC);
		
		} else {
			var knownside, knownangle;
			var partialside;
			if (sideA != null && angleA != null){ knownside = sideA; knownangle = angleA; }
			if (sideB != null && angleB != null){ knownside = sideB; knownangle = angleB; }
			if (sideC != null && angleC != null){ knownside = sideC; knownangle = angleC; }
			if (sideA != null && angleA == null) partialside = sideA;
			if (sideB != null && angleB == null) partialside = sideB;
			if (sideC != null && angleC == null) partialside = sideC;
			var ratio = knownside / Math.sin(degToRad(knownangle));
			var partialangle;
			var unknownside, unknownangle;
			if (partialside / ratio > 1) {
				trianglecase = "Side side angle (SSA) - No solution";
				partialangle = "No solution";
				unknownangle = "No solution";
				unknownside = "No solution";
			} else if (partialside / ratio == 1 || Math.asin(partialside / ratio) - degToRad(knownangle) < 0) {
				trianglecase = "Side side angle (SSA) - Unique solution";
				partialangle = radToDeg(Math.asin(partialside / ratio));
				unknownangle = 180 - knownangle - partialangle;
				unknownside = ratio * Math.sin(degToRad(unknownangle));
			} else {
				trianglecase = "Side side angle (SSA) - Two solutions";
				var partialangle0 = radToDeg(Math.asin(partialside / ratio));
				var unknownangle0 = 180 - knownangle - partialangle0;
				var unknownside0 = ratio * Math.sin(degToRad(unknownangle0));
				var partialangle1 = radToDeg(Math.PI - Math.asin(partialside / ratio));
				var unknownangle1 = 180 - knownangle - partialangle1;
				var unknownside1 = ratio * Math.sin(degToRad(unknownangle1));
				partialangle = partialangle0 + " or " + partialangle1;
				unknownangle = unknownangle0 + " or " + unknownangle1;
				unknownside = unknownside0 + " or " + unknownside1;
			}
			if (sideA != null && angleA == null) angleA = partialangle;
			if (sideB != null && angleB == null) angleB = partialangle;
			if (sideC != null && angleC == null) angleC = partialangle;
			if (sideA == null && angleA == null) { sideA = unknownside; angleA = unknownangle; }
			if (sideB == null && angleB == null) { sideB = unknownside; angleB = unknownangle; }
			if (sideC == null && angleC == null) { sideC = unknownside; angleC = unknownangle; }
		}
		
		document.getElementById("case").value = trianglecase;
		document.getElementById("sideAout").value = sideA;
		document.getElementById("sideBout").value = sideB;
		document.getElementById("sideCout").value = sideC;
		document.getElementById("angleAout").value = angleA;
		document.getElementById("angleBout").value = angleB;
		document.getElementById("angleCout").value = angleC;
		
	} catch(e) {
		alert(e);
		return;
	}
}


function solveSide(a, b, C) {  // Returns side c
	return Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(degToRad(C)));
}

function solveAngle(a, b, c) {  // Returns angle C
	var temp = (a * a + b * b - c * c) / (2 * a * b);
	if (temp >= -1 && temp <= 1)
		return radToDeg(Math.acos(temp));
	else
		return "No solution";
}

function getNumber(id) {
	var str = document.getElementById(id).value;
	if (str == "")
		return null;
	var result = parseFloat(str);
	if (!isFinite(result))
		throw "Not a real number";
	return result;
}

function degToRad(x) {
	return x / 180 * Math.PI;
}

function radToDeg(x) {
	return x / Math.PI * 180;
}
