/* 
 * Calculate divisors
 * 
 * Copyright (c) 2024 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/calculate-divisors-javascript
 */

"use strict";


const app = new function() {
	
	let numberElem = document.getElementById("number");
	let lastInput = "";
	
	
	this.doRandom = function() {
		numberElem.value = Math.floor(Math.pow(1000, Math.random()) * 10).toString();
		this.doDivisors();
	};
	
	
	/* 
	 * Handles the HTML input/output for calculating the divisors of an integer.
	 */
	this.doDivisors = function() {
		// Don't calculate if input text didn't change
		const numberText = numberElem.value;
		if (numberText == lastInput)
			return;
		lastInput = numberText;
		
		let s;
		if (!/^-?\d+$/.test(numberText)) {
			s = "Not an integer";
		} else {
			const n = parseInt(numberText, 10);
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
		let small = [];
		let large = [];
		const end = Math.floor(Math.sqrt(n));
		for (let i = 1; i <= end; i++) {
			if (n % i == 0) {
				small.push(i);
				if (i * i != n)  // Don't include a square root twice
					large.unshift(n / i);
			}
		}
		return small.concat(large);
	}
	
};
