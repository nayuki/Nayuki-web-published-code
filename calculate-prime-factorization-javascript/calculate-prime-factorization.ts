/* 
 * Calculate prime factorization
 * 
 * Copyright (c) 2025 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/calculate-prime-factorization-javascript
 */


namespace app {
	
	let container: HTMLElement = queryHtml("article .program-container");
	let numberElem: HTMLInputElement = queryInput("article .program-container #number");
	let previousInput: string = "";
	
	
	function initialize(): void {
		container.hidden = false;
	}
	
	setTimeout(initialize);
	
	
	export function doRandom(): void {
		numberElem.value = Math.floor(Math.pow(1000000, Math.random()) + 2).toString();
		doCalculate();
	}
	
	
	/* 
	 * Handles the HTML input/output for factoring an integer.
	 */
	export function doCalculate(): void {
		// Don't factor if input text didn't change
		const numberText: string = numberElem.value;
		if (numberText == previousInput)
			return;
		previousInput = numberText;
		
		// Clear outputs
		let [primeListOut, primePowerListOut] = container.querySelectorAll("output");
		primeListOut.textContent = "";
		let sup: HTMLElement = document.createElement("sup");
		sup.textContent = NBSP;  // Use spaces to prevent layout shift
		primePowerListOut.replaceChildren(NBSP, sup);
		
		if (!/^-?\d+$/.test(numberText)) {
			primeListOut.textContent = "Not an integer";
			return;
		}
		
		const n: number = parseInt(numberText, 10);
		if (n < 2)
			primeListOut.textContent = "Number out of range (< 2)";
		else if (n >= 9007199254740992)
			primeListOut.textContent = "Number too large";
		else {
			// Main case
			const factors: Array<number> = calcPrimeFactorList(n);
			primeListOut.textContent = "= " + factors.join(` ${TIMES} `);
			
			const factorPowers: Array<[number,number]> = toFactorPowerList(factors);
			if (factorPowers.length < factors.length) {
				primePowerListOut.replaceChildren("= ");
				factorPowers.forEach(([base, exp], i) => {
					if (i > 0)
						primePowerListOut.append(` ${TIMES} `);
					primePowerListOut.append(base.toString());
					if (exp > 1) {
						let sup: HTMLElement = primePowerListOut.appendChild(document.createElement("sup"));
						sup.textContent = exp.toString();
					}
				});
			}
		}
	}
	
	
	/* 
	 * Returns the list of (not necessarily unique) prime factors
	 * (in non-descending order) of the given integer. Examples:
	 * - calcPrimeFactorList(1) = [].
	 * - calcPrimeFactorList(7) = [7].
	 * - calcPrimeFactorList(60) = [2, 2, 3, 5].
	 */
	function calcPrimeFactorList(n: number): Array<number> {
		if (n < 1)
			throw new RangeError("Number is less than 1");
		let result: Array<number> = [];
		while (n != 1) {
			const factor: number = calcSmallestFactor(n);
			result.push(factor);
			n /= factor;
		}
		return result;
	}
	
	
	/* 
	 * Returns the smallest prime factor of the given integer. Examples:
	 * - calcSmallestFactor(2) = 2.
	 * - calcSmallestFactor(9) = 3.
	 * - calcSmallestFactor(35) = 5.
	 */
	function calcSmallestFactor(n: number): number {
		if (n < 2)
			throw new RangeError("Number is less than 2");
		if (n % 2 == 0)
			return 2;
		const end: number = Math.floor(Math.sqrt(n));
		for (let i = 3; i <= end; i += 2) {
			if (n % i == 0)
				return i;
		}
		return n;
	}
	
	
	/* 
	 * Given a non-empty list of non-descending numbers, this returns a list of
	 * pairs where in each pair, the initial element is a unique number from
	 * the input and the final element is the number of repeats. Examples:
	 * - toFactorPowerList([2, 2, 2]) = [[2, 3]].
	 * - toFactorPowerList([3, 5]) = [[3, 1], [5, 1]].
	 */
	function toFactorPowerList(factors: Array<number>): Array<[number,number]> {
		let result: Array<[number,number]> = [];
		let prevFactor: number = factors[0];
		let count: number = 1;
		for (const factor of factors.slice(1)) {
			if (factor == prevFactor)
				count++;
			else {
				result.push([prevFactor, count]);
				prevFactor = factor;
				count = 1;
			}
		}
		return result.concat([[prevFactor, count]]);
	}
	
	
	const TIMES: string = "\u00D7";  // Times sign
	const NBSP : string = "\u00A0";  // No-break space
	
}
