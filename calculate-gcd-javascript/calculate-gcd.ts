/* 
 * GCD calculator
 * 
 * Copyright (c) 2025 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/calculate-gcd-javascript
 */


namespace app {
	
	let container: HTMLElement = queryHtml("article .program-container");
	
	let inputAElem: HTMLInputElement = queryInput("article .program-container #number-a");
	let inputBElem: HTMLInputElement = queryInput("article .program-container #number-b");
	
	
	function initialize(): void {
		container.hidden = false;
	}
	
	setTimeout(initialize);
	
	
	/*---- Entry points from HTML page ----*/
	
	export function doCalculate(): void {
		// Clear outputs
		let gcdOut: HTMLElement = queryHtml("article .program-container output.gcd");
		let lcmOut: HTMLElement = queryHtml("article .program-container output.lcm");
		let eeaOut: HTMLElement = queryHtml("article .program-container output.eea tbody");
		gcdOut.textContent = "";
		lcmOut.textContent = "";
		eeaOut.replaceChildren();
		
		// Handle inputs
		const aStr: string = inputAElem.value;
		const bStr: string = inputBElem.value;
		if (aStr == "" || bStr == "")
			return;
		let a: bigint;
		let b: bigint;
		try {
			a = BigInt(aStr);
			b = BigInt(bStr);
			if (a < 0n || b < 0n)
				throw new RangeError();
		} catch {
			gcdOut.textContent = "Input needs to be positive integer or zero";
			return;
		}
		
		function addRow(i: number, q: bigint, r: bigint, x: bigint, y: bigint): void {
			let tr: HTMLElement = eeaOut.appendChild(document.createElement("tr"));
			for (const val of [i, q, "|", x, "\u00D7", a, "+", y, "\u00D7", b, "=", r]) {
				let td: HTMLElement = tr.appendChild(document.createElement("td"));
				td.textContent = val.toString().replace(/-/, "\u2212");
			}
		}
		
		// Calculate and render
		let r0: bigint = a, x0: bigint = 1n, y0: bigint = 0n;
		let r1: bigint = b, x1: bigint = 0n, y1: bigint = 1n;
		addRow(0, 0n, r0, x0, y0);
		addRow(1, 0n, r1, x1, y1);
		for (let i = 2; r1 != 0n; i++) {
			const q2: bigint = r0 / r1;
			const r2: bigint = r0 % r1;
			const x2: bigint = x0 - q2 * x1;
			const y2: bigint = y0 - q2 * y1;
			addRow(i, q2, r2, x2, y2);
			r0 = r1;  x0 = x1;  y0 = y1;
			r1 = r2;  x1 = x2;  y1 = y2;
		}
		gcdOut.textContent = r0.toString();
		lcmOut.textContent = a != 0n && b != 0n ? (a / r0 * b).toString() : "N/A";
	}
	
	
	let numRandomClicked: number = 0;
	
	export function doRandom(): void {
		numRandomClicked++;
		const limit: number = numRandomClicked / 10;
		const len: number = Math.floor(Math.random() * limit) + 1;
		for (let elem of [inputAElem, inputBElem]) {
			let s: string = "";
			for (let i = 0; i < len; i++)
				s += Math.floor(Math.random() * 10);
			elem.value = s.replace(/^0+(.)/g, "$1");
		}
		doCalculate();
	}
	
}
