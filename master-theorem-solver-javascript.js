/* 
 * Master theorem solver (JavaScript)
 * 
 * Copyright (c) 2014 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * http://www.nayuki.io/page/master-theorem-solver
 */

"use strict";


var messagesDisabled = false;

function calc() {
	if (!messagesDisabled) {
		MathJax.Hub.Config({showProcessingMessages: false});
		messagesDisabled = true;
	}
	
	clearOutput();
	
	// Get input
	var aStr = document.getElementById("var-a").value;
	var bStr = document.getElementById("var-b").value;
	var kStr = document.getElementById("var-k").value;
	var iStr = document.getElementById("var-i").value;
	if (aStr == "" || bStr == "" || kStr == "" || iStr == "")
		return;
	
	// Check input and render the recurrence equation
	var a = parseFloat(aStr);
	var b = parseFloat(bStr);
	var k = parseFloat(kStr);
	var i = parseFloat(iStr);
	var recurrenceText;
	if (isNaN(a))
		recurrenceText = "Error: Invalid value for \\(a\\)";
	else if (isNaN(b))
		recurrenceText = "Error: Invalid value for \\(b\\)";
	else if (isNaN(k))
		recurrenceText = "Error: Invalid value for \\(k\\)";
	else if (isNaN(i))
		recurrenceText = "Error: Invalid value for \\(i\\)";
	else if (a <= 0)
		recurrenceText = "Error: \\(a\\) must be positive";
	else if (b <= 1)
		recurrenceText = "Error: \\(b\\) must be greater than 1";
	else if (k < 0)
		recurrenceText = "Error: \\(k\\) must be at least 0";
	else if (i < 0)
		recurrenceText = "Error: \\(i\\) must be at least 0";
	else
		recurrenceText = "\\(T(n) \\: = \\: " + (a != 1 ? a : "") + " \\: T(n" + (b != 1 ? " / " + b : "") + ") \\, + \\, \\Theta(" + formatPolyLog(k, i) + ").\\)";
	var recurrenceElem = document.getElementById("recurrence");
	recurrenceElem.appendChild(document.createTextNode(recurrenceText));
	MathJax.Hub.Queue(["Typeset", MathJax.Hub, recurrenceElem]);
	if (recurrenceText.substring(0, 6) == "Error:")
		return;
	
	var p = Math.log(a) / Math.log(b);
	var result = "\\(T(n) \\: \\in \\: \\Theta(";
	if (floatEquals(p, k))
		result += formatPolyLog(k, i + 1);
	else if (p < k)
		result += formatPolyLog(k, i);
	else if (p > k) {
		if (floatEquals(Math.round(p), p))
			result += formatPolyLog(Math.round(p), 0);
		else
			result += formatPolyLog("\\log_{" + b + "} " + a, 0) + ") \\approx \\Theta(" + formatPolyLog(p.toFixed(3), 0);
	} else
		result = null;
	if (result != null)
		result += ").\\)";
	else
		result = "Arithmetic error";
	
	var solutionElem = document.getElementById("solution");
	solutionElem.appendChild(document.createTextNode(result));
	MathJax.Hub.Queue(["Typeset", MathJax.Hub, solutionElem]);
}


function example(a, b, k, i) {
	document.getElementById("var-a").value = a + "";
	document.getElementById("var-b").value = b + "";
	document.getElementById("var-k").value = k + "";
	document.getElementById("var-i").value = i + "";
	calc();
	return false;
}


function clearOutput() {
	function removeAllChildren(node) {
		while (node.childNodes.length > 0)
			node.removeChild(node.firstChild);
	}
	removeAllChildren(document.getElementById("recurrence"));
	removeAllChildren(document.getElementById("solution"));
}


// Returns a natural TeX string for the polylogarithmic function n^k log^i n
function formatPolyLog(k, i) {
	var result = null;
	if (typeof k == "number") {
		if (k == 0 && i != 0)
			result = "";
		else if (k == 0 && i == 0)
			result = "1";
		else if (k == 0.5)
			result = "\\sqrt{n}";
		else if (k == 1)
			result = "n";
		else
			k = k.toString();
	}
	if (result != null);
	else if (typeof k == "string")
		result = "n^{" + k + "}";
	else
		throw "Invalid argument";
	
	if (i != 0) {
		if (result != "")
			result += " ";
		result += "\\log";
		if (i != 1)
			result += "^{" + i + "}";
		result += " n";
	}
	
	return result;
}


function floatEquals(x, y) {
	return Math.abs(x - y) < 1e-9;
}
