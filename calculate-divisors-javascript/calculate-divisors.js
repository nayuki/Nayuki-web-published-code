/* 
 * Calculate divisors
 * 
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/calculate-divisors-javascript
 */

"use strict";


var app = new function() {
	
	var numberElem = document.getElementById("number");
	var lastInput = "";
	
	
	this.doRandom = function() {
		numberElem.value = Math.floor(Math.pow(1000, Math.random()) * 10).toString();
		this.doDivisors();
	};
	
	
	/* 
	 * Handles the HTML input/output for calculating the divisors of an integer.
	 */
	this.doDivisors = function() {
		// Don't calculate if input text didn't change
		var numberText = numberElem.value;
		if (numberText == lastInput)
			return;
		lastInput = numberText;
		
		var s;
		if (!/^-?\d+$/.test(numberText)) {
			s = "Not an integer";
		} else {
			var n = parseInt(numberText, 10);
			if (n < 1)
				s = "Number out of range (< 1)";
			else if (n >= 9007199254740992)
				s = "Number too large";
			else  // Main case
				s = listDivisors(n).join(", ");
		}
		document.getElementById("output").textContent = s;
	};
	
	
	/* 
	 * Returns the list of divisors (in ascending order) of the given integer.
	 * Examples:
	 * - listDivisors(1) = [1].
	 * - listDivisors(5) = [1, 5].
	 * - listDivisors(12) = [1, 2, 3, 4, 6, 12].
	 */
	function listDivisors(n) {
		if (n < 1)
			throw new RangeError("Argument error");
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
	
};
