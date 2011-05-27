function solve() {
	var data;
	try {
		data = [getData("A"), getData("B"), getData("C")];
	} catch (e) {
		setStatus(e);
		return;
	}
	
	// Insertion sort. Having a side takes priority. Having an angle comes next.
	if (isBefore(data[1], data[0])) swap(data, 0, 1);
	if (isBefore(data[2], data[1])) swap(data, 1, 2);
	if (isBefore(data[1], data[0])) swap(data, 0, 1);
	
	var sidesGiven  = (data[0].side  != null) + (data[1].side  != null) + (data[2].side  != null);  // Boolean to integer conversion
	var anglesGiven = (data[0].angle != null) + (data[1].angle != null) + (data[2].angle != null);  // Boolean to integer conversion
	var status;
	if (sidesGiven == 0)
		status = "Give at least one side length";
	else if (sidesGiven + anglesGiven != 3)
		status = "Give exactly 3 pieces of information";
	
	else if (sidesGiven == 3) {
		status = "Side side side (SSS) case";
		for (var i = 0; i < 3; i++)
			data[i].angle = solveAngle(data[(i + 1) % 3].side, data[(i + 2) % 3].side, data[i].side);
		
	} else if (anglesGiven == 2) {
		status = "Angle side angle (ASA) case";
		if (data[0].angle == null) data[0].angle = 180 - data[1].angle - data[2].angle;  // ASA case
		if (data[2].angle == null) data[2].angle = 180 - data[0].angle - data[1].angle;  // AAS case
		// Use law of sines
		var ratio = data[0].side / Math.sin(degToRad(data[0].angle));
		data[1].side = ratio * Math.sin(degToRad(data[1].angle));
		data[2].side = ratio * Math.sin(degToRad(data[2].angle));
		
	} else if (data[2].angle != null) {
		status = "Side angle side (SAS) case";
		data[2].side = solveSide(data[0].side, data[1].side, data[2].angle);
		data[0].angle = solveAngle(data[1].side, data[2].side, data[0].side);
		data[1].angle = solveAngle(data[2].side, data[0].side, data[1].side);
		
	} else {
		status = "Side side angle (SSA) case - ";
		var ratio = data[0].side / Math.sin(degToRad(data[0].angle));
		var temp = data[1].side / ratio;  // sin(data[1].angle)
		if (temp > 1) {
			status += "No solution";
			data[0].side  = "";
			data[0].angle = "";
			data[1].side  = "";
		} else if (temp == 1 || data[0].side > data[1].side) {
			status += "Unique solution";
			data[1].angle = radToDeg(Math.asin(temp));
			data[2].angle = 180 - data[0].angle - data[1].angle;
			data[2].side = ratio * Math.sin(degToRad(data[2].angle));
		} else {
			status += "Two solutions";
			var partialAngle0 = radToDeg(Math.asin(temp));
			var partialAngle1 = 180 - partialAngle0;
			var unknownAngle0 = 180 - data[0].angle - partialAngle0;
			var unknownAngle1 = 180 - data[0].angle - partialAngle1;
			var unknownSide0 = ratio * Math.sin(degToRad(unknownAngle0));
			var unknownSide1 = ratio * Math.sin(degToRad(unknownAngle1));
			data[1].angle = partialAngle0 + " or " + partialAngle1;
			data[2].angle = unknownAngle0 + " or " + unknownAngle1;
			data[2].side = unknownSide0 + " or " + unknownSide1;
		}
	}
	
	for (var i = 0; i < 3; i++) {
		data[i].outputSide.value  = data[i].side;
		data[i].outputAngle.value = data[i].angle;
	}
	setStatus(status);
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
		return "No solution";
}


/* Input/output handling functions */

function getData(name) {
	var result = new Object();
	result.side  = getNumber("side"  + name + "in");
	result.angle = getNumber("angle" + name + "in");
	result.outputSide  = document.getElementById("side"  + name + "out");
	result.outputAngle = document.getElementById("angle" + name + "out");
	return result;
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

function isBefore(dataX, dataY) {
	if (dataX.side != null && dataY.side == null)
		return true;
	else if (dataX.side == null && dataY.side != null)
		return false;
	else if (dataX.angle != null && dataY.angle == null)
		return true;
	else if (dataX.angle == null && dataY.angle != null)
		return false;
	else
		return false;  // A tie
}

function setStatus(str) {
	var elem = document.getElementById("status");
	removeAllChildren(elem);
	elem.appendChild(document.createTextNode(str));
}


/* Trivial functions */

function degToRad(x) {
	return x / 180 * Math.PI;
}

function radToDeg(x) {
	return x / Math.PI * 180;
}

function swap(array, i, j) {
	var temp = array[i];
	array[i] = array[j];
	array[j] = temp;
}

function removeAllChildren(node) {
	while (node.childNodes.length > 0)
		node.removeChild(node.firstChild);
}
