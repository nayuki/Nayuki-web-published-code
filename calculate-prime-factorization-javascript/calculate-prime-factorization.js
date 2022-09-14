/* 
 * Calculate prime factorization
 * 
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/calculate-prime-factorization-javascript
 */

"use strict";


const app = new function() {
	
	let numberElem = document.getElementById("number");
	let lastInput = "";
	
	
	this.doRandom = function() {
		numberElem.value = Math.floor(Math.pow(1000, Math.random()) * 10).toString();
		this.doFactor();
	};
	
	
	/* 
	 * Handles the HTML input/output for factoring an integer.
	 */
	this.doFactor = function() {
		// Don't factor if input text didn't change
		const numberText = numberElem.value;
		if (numberText == lastInput)
			return;
		lastInput = numberText;
		
		// Reset output line 0
		let factorization0Elem = document.getElementById("factorization0");
		factorization0Elem.textContent = "";
		
		// Reset output line 1 with blank filler to prevent the page layout from bobbing up and down
		let outElem1 = document.getElementById("factorization1");
		clearChildren(outElem1);
		outElem1.textContent = NBSP;
		let temp = outElem1.appendChild(document.createElement("sup"));
		temp.textContent = NBSP;
		
		if (!/^-?\d+$/.test(numberText)) {
			factorization0Elem.textContent = "Not an integer";
			return;
		}
		
		function appendText(str) {
			outElem1.append(str);
		}
		
		const n = parseInt(numberText, 10);
		if (n < 2) {
			factorization0Elem.textContent = "Number out of range (< 2)";
		} else if (n >= 9007199254740992) {
			factorization0Elem.textContent = "Number too large";
		} else {
			// Main case
			const factors = primeFactorList(n);
			const factorPowers = toFactorPowerList(factors);
			
			// Build prime factor list without powers
			factorization0Elem.textContent = n + " = " + factors.join(" " + TIMES + " ");
			
			// Build prime factor list with powers in superscripts
			if (factorPowers.length < factors.length) {
				clearChildren(outElem1);
				
				appendText(n + " = ");
				factorPowers.forEach(function(factPow, i) {
					if (i != 0)
						appendText(" " + TIMES + " ");
					
					appendText(factPow[0].toString());
					if (factPow[1] > 1) {
						let temp = outElem1.appendChild(document.createElement("sup"));
						temp.textContent = factPow[1].toString();
					}
				});
			}
		}
	};
	
	
	/* 
	 * Returns the list of prime factors (in ascending order) of the given integer.
	 * Examples:
	 * - primeFactorList(1) = [].
	 * - primeFactorList(7) = [7].
	 * - primeFactorList(60) = [2, 2, 3, 5].
	 */
	function primeFactorList(n) {
		if (n < 1)
			throw new RangeError("Argument error");
		let result = [];
		while (n != 1) {
			const factor = smallestFactor(n);
			result.push(factor);
			n /= factor;
		}
		return result;
	}
	
	
	/* 
	 * Returns the smallest prime factor of the given integer.
	 * Examples:
	 * - smallestFactor(2) = 2.
	 * - smallestFactor(15) = 3.
	 */
	function smallestFactor(n) {
		if (n < 2)
			throw new RangeError("Argument error");
		if (n % 2 == 0)
			return 2;
		const end = Math.floor(Math.sqrt(n));
		for (let i = 3; i <= end; i += 2) {
			if (n % i == 0)
				return i;
		}
		return n;
	}
	
	
	/* 
	 * Returns the prime factorization as a list of factor-power pairs, from the
	 * given factor list. The given list must be in ascending order. Examples:
	 * - toFactorPowerList([2, 2, 2]) = [[2, 3]].
	 * - toFactorPowerList([3, 5]) = [[3, 1], [5, 1]].
	 */
	function toFactorPowerList(factors) {
		let result = [];
		let prevFactor = factors[0];
		let count = 1;
		for (const factor of factors.slice(1)) {
			if (factor == prevFactor) {
				count++;
			} else {
				result.push([prevFactor, count]);
				prevFactor = factor;
				count = 1;
			}
		}
		result.push([prevFactor, count]);
		return result;
	}
	
	
	function clearChildren(node) {
		while (node.firstChild !== null)
			node.removeChild(node.firstChild);
	}
	
	
	const TIMES = "\u00D7";  // Times sign
	const NBSP  = "\u00A0";  // No-break space
	
};
