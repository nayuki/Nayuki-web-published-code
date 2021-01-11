/* 
 * Calculate prime factorization
 * 
 * Copyright (c) 2021 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/calculate-prime-factorization-javascript
 */

"use strict";


var app = new function() {
	
	var numberElem = document.getElementById("number");
	var lastInput = "";
	
	
	this.doRandom = function() {
		numberElem.value = Math.floor(Math.pow(1000, Math.random()) * 10).toString();
		this.doFactor();
	};
	
	
	/* 
	 * Handles the HTML input/output for factoring an integer.
	 */
	this.doFactor = function() {
		// Don't factor if input text didn't change
		var numberText = numberElem.value;
		if (numberText == lastInput)
			return;
		lastInput = numberText;
		
		// Reset output line 0
		var factorization0Elem = document.getElementById("factorization0");
		factorization0Elem.textContent = "";
		
		// Reset output line 1 with blank filler to prevent the page layout from bobbing up and down
		var outElem1 = document.getElementById("factorization1");
		clearChildren(outElem1);
		outElem1.textContent = NBSP;
		var temp = outElem1.appendChild(document.createElement("sup"));
		temp.textContent = NBSP;
		
		if (!/^-?\d+$/.test(numberText)) {
			factorization0Elem.textContent = "Not an integer";
			return;
		}
		
		function appendText(str) {
			outElem1.appendChild(document.createTextNode(str));
		}
		
		var n = parseInt(numberText, 10);
		if (n < 2) {
			factorization0Elem.textContent = "Number out of range (< 2)";
		} else if (n >= 9007199254740992) {
			factorization0Elem.textContent = "Number too large";
		} else {
			// Main case
			var factors = primeFactorList(n);
			var factorPowers = toFactorPowerList(factors);
			
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
						var temp = outElem1.appendChild(document.createElement("sup"));
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
	 * - smallestFactor(2) = 2.
	 * - smallestFactor(15) = 3.
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
	 * Returns the prime factorization as a list of factor-power pairs, from the
	 * given factor list. The given list must be in ascending order. Examples:
	 * - toFactorPowerList([2, 2, 2]) = [[2, 3]].
	 * - toFactorPowerList([3, 5]) = [[3, 1], [5, 1]].
	 */
	function toFactorPowerList(factors) {
		var result = [];
		var prevFactor = factors[0];
		var count = 1;
		for (var i = 1; i < factors.length; i++) {
			if (factors[i] == prevFactor) {
				count++;
			} else {
				result.push([prevFactor, count]);
				prevFactor = factors[i];
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
	
	
	var TIMES = "\u00D7";  // Times sign
	var NBSP  = "\u00A0";  // No-break space
	
};
