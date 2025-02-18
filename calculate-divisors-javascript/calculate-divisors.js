/* 
 * Calculate divisors
 * 
 * Copyright (c) 2025 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/calculate-divisors-javascript
 */

"use strict";


const app = new function() {
	
	let container = document.querySelector("article .program-container");
	let numberElem = container.querySelector("#number");
	let previousInput = "";
	
	
	function initialize() {
		container.hidden = false;
	}
	
	setTimeout(initialize);
	
	
	this.doRandom = function() {
		numberElem.value = Math.floor(Math.pow(1000000, Math.random()) + 1).toString();
		this.doCalculate();
	};
	
	
	/* 
	 * Handles the HTML input/output for calculating the divisors of an integer.
	 */
	this.doCalculate = function() {
		// Don't calculate if input text didn't change
		const numberText = numberElem.value;
		if (numberText == previousInput)
			return;
		previousInput = numberText;
		
		let outputText;
		let divisors = [];
		if (!/^-?\d+$/.test(numberText))
			outputText = "Not an integer";
		else {
			const n = parseInt(numberText, 10);
			if (n < 1)
				outputText = "Number out of range (< 1)";
			else if (n >= 9007199254740992)
				outputText = "Number too large";
			else {  // Main case
				divisors = calcDivisors(n);
				outputText = divisors.join(", ");
			}
		}
		container.querySelector(".divisors").textContent = outputText;
		container.querySelector(".num-divisors").textContent = divisors.length.toString();
	};
	
	
	/* 
	 * Returns the list of divisors (in ascending order) of the given integer.
	 * Examples:
	 * - calcDivisors(1) = [1].
	 * - calcDivisors(5) = [1, 5].
	 * - calcDivisors(12) = [1, 2, 3, 4, 6, 12].
	 */
	function calcDivisors(n) {
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
