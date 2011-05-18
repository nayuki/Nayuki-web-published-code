/*
 * Divisors calculator
 * Copyright (c) 2011 Nayuki Minase
 */


var lastInput = "";

/*
 * Handles the HTML input/output for calculating the divisors of an integer.
 * This is the one and only entry point function called from the HTML code.
 */
function divisors() {
	// Don't calculate if input text didn't change
	var numberText = document.getElementById("number").value;
	if (numberText == lastInput)
		return;
	lastInput = numberText;
	
	var output = document.getElementById("output");
	if (!/^-?\d+$/.test(numberText)) {
		output.value = "Not an integer";
		return;
	}
	
	var n = parseInt(numberText, 10);
	if (n < 1) {
		output.value = "Number out of range (< 1)";
	} else if (n >= 9007199254740992) {
		output.value = "Number too large";
	} else {
		// Main case
		var divisors = listDivisors(n);
		var out = "";
		for (var i = 0; i < divisors.length; i++) {
			if (out != "")
				out += ", ";
			out += divisors[i];
		}
		output.value = out;
	}
}


/*
 * Returns the list of divisors (in ascending order) of the given integer.
 * Examples:
 *   divisorList(1) = [1]
 *   divisorList(5) = [1, 5]
 *   divisorList(12) = [1, 2, 3, 4, 6, 12]
 */
function listDivisors(n) {
	if (n < 1)
		throw "Argument error";
	
	var small = [];
	var large = [];
	var end = Math.floor(Math.sqrt(n));
	for (var i = 1; i <= end; i++) {
		if (n % i == 0) {
			small.push(i);
			if (i * i != n)  // Don't include a square root twice
				large.push(n / i);
		}
	}
	large.reverse();
	return small.concat(large);
}
