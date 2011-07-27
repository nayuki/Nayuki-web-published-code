/*
 * Prime factorization calculator
 * Copyright (c) 2011 Nayuki Minase
 */


var TIMES = "\u00D7";  // Times sign
var NBSP  = "\u00A0";  // No-break space


var lastInput = "";

/*
 * Handles the HTML input/output for factoring an integer.
 * This is the one and only entry point function called from the HTML code.
 */
function factor() {
	// Don't factor if input text didn't change
	var numberText = document.getElementById("number").value;
	if (numberText == lastInput)
		return;
	lastInput = numberText;
	
	// Reset output line 0
	var outElem0 = document.getElementById("factorization0");
	removeAllChildren(outElem0);
	outElem0.appendChild(document.createTextNode(""));
	
	// Reset output line 1 with blank filler to prevent the page layout from bobbing up and down
	var outElem1 = document.getElementById("factorization1");
	removeAllChildren(outElem1);
	outElem1.appendChild(document.createTextNode(NBSP));
	var temp = document.createElement("sup");
	temp.appendChild(document.createTextNode(NBSP));
	outElem1.appendChild(temp);
	
	if (!/^-?\d+$/.test(numberText)) {
		outElem0.firstChild.data = "Not an integer";
		return;
	}
	
	var n = parseInt(numberText, 10);
	if (n < 2) {
		outElem0.firstChild.data = "Number out of range (< 2)";
	} else if (n >= 9007199254740992) {
		outElem0.firstChild.data = "Number too large";
	} else {
		// Main case
		var factors = primeFactorList(n);
		var factorPowers = toFactorPowerList(factors);
		
		// Build prime factor list without powers
		outElem0.firstChild.data = n + " = " + factors.join(" " + TIMES + " ");
		
		// Build prime factor list with powers in superscripts
		if (factorPowers.length < factors.length) {
			removeAllChildren(outElem1);
			
			function appendText(str) {
				outElem1.appendChild(document.createTextNode(str));
			}
			
			appendText(n + " = ");
			for (var i = 0; i < factorPowers.length; i++) {
				if (i != 0)
					appendText(" " + TIMES + " ");
				
				appendText(factorPowers[i][0].toString());
				if (factorPowers[i][1] > 1) {
					var temp = document.createElement("sup");
					temp.appendChild(document.createTextNode(factorPowers[i][1].toString()));
					outElem1.appendChild(temp);
				}
			}
		}
	}
}


/*
 * Returns the list of prime factors (in ascending order) of the given integer.
 * Examples:
 *   primeFactorList(1) = []
 *   primeFactorList(7) = [7]
 *   primeFactorList(60) = [2, 2, 3, 5]
 */
function primeFactorList(n) {
	if (n < 1)
		throw "Argument error";
	
	var result = [];
	while (n != 1) {
		var factor = smallestFactor(n);
		result.push(factor);
		n /= factor;
	}
	return result;
}


/*
 * Returns the smallest prime factor of the given integer.
 * Examples:
 *   smallestFactor(2) = 2
 *   smallestFactor(15) = 3
 */
function smallestFactor(n) {
	if (n < 2)
		throw "Argument error";
	
	if (n % 2 == 0)
		return 2;
	var end = Math.floor(Math.sqrt(n));
	for (var i = 3; i <= end; i += 2) {
		if (n % i == 0)
			return i;
	}
	return n;
}


/*
 * Returns the prime factorization as a list of factor-power pairs, from the given factor list. The given list must be in ascending order.
 * Examples:
 *   toFactorPowerList([2, 2, 2]) = [[2, 3]]
 *   toFactorPowerList([3, 5]) = [[3, 1], [5, 1]]
 */
function toFactorPowerList(factors) {
	var result = [];
	var factor = factors[0];
	var count = 1;
	for (var i = 1; i < factors.length; i++) {
		if (factors[i] == factor) {
			count++;
		} else {
			result.push([factor, count]);
			factor = factors[i];
			count = 1;
		}
	}
	result.push([factor, count]);
	return result;
}


function removeAllChildren(node) {
	while (node.childNodes.length > 0)
		node.removeChild(node.firstChild);
}
