/*
 * Handles the HTML input/output for factoring an integer.
 */
function factor() {
	var n = parseFloat(document.getElementById("number").value);
	output = document.getElementById("output");
	while (output.childNodes.length > 0)
		output.removeChild(output.firstChild);
	
	function appendText(str) {
		output.appendChild(document.createTextNode(str));
	}
	
	if (!isInteger(n)) {
		appendText("Not an integer");
	} else if (n < 2) {
		appendText("Number out of range (< 2)");
	} else if (n > 9007199254740992) {
		appendText("Number too large (> 9007199254740992)");
	} else {  // Main case
		
		var factors = primeFactorList(n);
		var factorPowers = toFactorPowerList(factors);
		
		// Build prime factor list without powers
		var out = "";
		for (var i = 0; i < factors.length; i++) {
			if (out != "")
				out += " \u00D7 ";  // Times sign
			out += factors[i];
		}
		appendText(n + " = " + out);
		
		// Build prime factor list with powers in superscripts
		if (factorPowers.length < factors.length) {
			output.appendChild(document.createElement("br"));
			appendText(n + " = ");
			var head = true;
			for (var i = 0; i < factorPowers.length; i++) {
				if (head) head = false;
				else appendText(" \u00D7 ");  // Times sign
				
				appendText(factorPowers[i][0].toString());
				if (factorPowers[i][1] > 1) {
					var temp = document.createElement("sup");
					temp.appendChild(document.createTextNode(factorPowers[i][1].toString()));
					output.appendChild(temp);
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


function isInteger(x) {
	return !isNaN(x) && x == Math.floor(x);
}

function isNaN(x) {
	return x != x;
}
