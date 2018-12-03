/* 
 * Factorize Gaussian integer
 * 
 * Copyright (c) 2018 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/factorize-gaussian-integer-javascript
 */

"use strict";


namespace app {
	
	/* 
	 * Handles the HTML input/output for factoring a Gaussian integer.
	 */
	export function doFactor(ev: Event|null): void {
		if (ev !== null)
			ev.preventDefault();
		
		let outElem = document.getElementById("factorization") as HTMLElement;
		while (outElem.firstChild != null)
			outElem.removeChild(outElem.firstChild);
		const input = (document.getElementById("number") as HTMLInputElement).value;
		if (/^\s*$/.test(input)) {  // Blank input
			outElem.textContent = NBSP;
			return;
		}
		
		// DOM helper function
		function appendTextNode(elem: HTMLElement, s: string): void {
			elem.appendChild(document.createTextNode(s));
		}
		
		// Formatting helper function
		function appendGaussianInteger(n: GaussianInteger): void {
			const s: string = n.toString();
			if (s.charAt(s.length - 1) != "i")
				appendTextNode(outElem, s);
			else {
				let varElem = document.createElement("var");
				varElem.textContent = "i";
				appendTextNode(outElem, s.substring(0, s.length - 1));
				outElem.appendChild(varElem);
			}
		}
		
		try {
			const num: GaussianInteger = GaussianInteger.parseString(input);
			const factorization: Array<GaussianInteger> = num.factorize();
			
			appendGaussianInteger(num);
			appendTextNode(outElem, " = ");
			factorization.forEach((factor, i) => {
				if (i > 0)
					appendTextNode(outElem, " ");
				appendTextNode(outElem, "(");
				appendGaussianInteger(factor);
				appendTextNode(outElem, ")");
			});
		} catch (e) {
			outElem.appendChild(document.createTextNode(e.toString()));
		}
	}
	
	
	export function doRandom(): void {
		function randInt(): number {
			return Math.floor(Math.random() * 2000) - 1000;
		}
		
		const type: number = Math.random();
		let str: string;
		if (type < 0.2)
			str = randInt().toString();
		else if (type < 0.3)
			str = randInt() + "i";
		else {
			const real = randInt();
			const imag = randInt();
			str = real + (imag >= 0 ? " + " : " - ") + Math.abs(imag) + "i";
		}
		(document.getElementById("number") as HTMLInputElement).value = str;
		doFactor(null);
	}
	
	
	
	class GaussianInteger {
		
		constructor(
			public readonly real: number,
			public readonly imag: number) {}
		
		
		private norm(): number {
			return this.real * this.real + this.imag * this.imag;
		}
		
		
		private multiply(other: GaussianInteger): GaussianInteger {
			return new GaussianInteger(
				this.real * other.real - this.imag * other.imag,
				this.real * other.imag + this.imag * other.real);
		}
		
		
		private isDivisibleBy(re: number, im: number): boolean {
			const divisorNorm: number = re * re + im * im;
			return ( this.real * re + this.imag * im) % divisorNorm == 0 &&
			       (-this.real * im + this.imag * re) % divisorNorm == 0;
		}
		
		
		private divide(other: GaussianInteger): GaussianInteger {
			if (!this.isDivisibleBy(other.real, other.imag))
				throw "Cannot divide";
			return new GaussianInteger(
				( this.real * other.real + this.imag * other.imag) / other.norm(),
				(-this.real * other.imag + this.imag * other.real) / other.norm());
		}
		
		
		public factorize(): Array<GaussianInteger> {
			if (this.norm() <= 1)  // 0, 1, -1, i, -i
				return [this];
			
			let result: Array<GaussianInteger> = [];
			let temp: GaussianInteger = this;
			let check = new GaussianInteger(1, 0);
			while (temp.norm() > 1) {
				const factor = temp.findPrimeFactor();
				result.push(factor);
				temp = temp.divide(factor);
				check = check.multiply(factor);
			}
			check = check.multiply(temp);
			if (temp.norm() != 1 || check.real != this.real || check.imag != this.imag)
				throw "Assertion error";
			if (temp.real != 1)  // -1, i, -i
				result.push(temp);
			
			result.sort((x, y) => {
				if      (x.norm() < y.norm()) return -1;
				else if (x.norm() > y.norm()) return +1;
				else if (x.real > y.real) return -1;
				else if (x.real < y.real) return +1;
				else return 0;
			});
			return result;
		}
		
		
		private findPrimeFactor(): GaussianInteger {
			const norm: number = this.norm();
			if (norm % 2 == 0)
				return new GaussianInteger(1, 1);
			
			for (let i = 3, end = Math.floor(Math.sqrt(norm)); i <= end; i += 2) {  // Find factors of norm
				if (norm % i == 0) {
					if (i % 4 == 3)
						return new GaussianInteger(i, 0);
					else {
						for (let re = Math.floor(Math.sqrt(i)); re > 0; re--) {
							const im = Math.round(Math.sqrt(i - re * re));
							if (re * re + im * im == i && this.isDivisibleBy(re, im))
								return new GaussianInteger(re, im);
						}
					}
				}
			}
			
			// This number itself is prime. Rotate so that the argument is in [0, pi/2)
			let temp: GaussianInteger = this;
			while (temp.real < 0 || temp.imag < 0)
				temp = temp.multiply(new GaussianInteger(0, 1));
			return temp;
		}
		
		
		public toString(): string {
			if (this.real == 0 && this.imag == 0)
				return "0";
			else {
				let result: string = "";
				if (this.real != 0)
					result += this.real > 0 ? this.real : MINUS + (-this.real);
				if (this.imag != 0) {
					if (result == "")
						result += this.imag > 0 ? "" : MINUS;
					else
						result += this.imag > 0 ? " + " : ` ${MINUS} `;
					result += (Math.abs(this.imag) != 1 ? Math.abs(this.imag) : "") + "i";
				}
				return result;
			}
		}
		
		
		public static parseString(str: string): GaussianInteger {
			if (/\d\s+\d/.test(str))  // Spaces are not allowed between digits
				throw "Invalid number";
			str = str.replace(/\s+/g, "");  // Remove all whitespace
			str = str.replace(/\u2212/g, "-");
			str = str.replace(/j/g, "i");
			
			function checkedParseInt(s: string): number {
				const n = parseInt(s, 10);
				if (Math.abs(n) >= 67108864)
					throw "Number is too large";
				return n;
			}
			
			// Match one of the syntax cases
			let real: number, imag: number;
			let mat: RegExpExecArray|null;
			if ((mat = /^([+-]?\d+)$/.exec(str)) !== null) {  // e.g. 1, +0, -2
				real = checkedParseInt(mat[1]);
				imag = 0;
			} else if ((mat = /^([+-]?)(\d*)i$/.exec(str)) !== null) {  // e.g. i, 4i, -3i
				real = 0;
				imag = checkedParseInt(mat[1] + (mat[2] != "" ? mat[2] : "1"));
			} else if ((mat = /^([+-]?\d+)([+-])(\d*)i$/.exec(str)) !== null) {  // e.g. 1+2i, -3-4i, +5+i
				real = checkedParseInt(mat[1]);
				imag = checkedParseInt(mat[2] + (mat[3] != "" ? mat[3] : "1"));
			} else if ((mat = /^([+-]?)(\d*)i([+-]\d+)$/.exec(str)) !== null) {  // e.g. 2i+1, -4i-3, +i+5
				real = checkedParseInt(mat[3]);
				imag = checkedParseInt(mat[1] + (mat[2] != "" ? mat[2] : "1"));
			} else
				throw "Invalid number";
			return new GaussianInteger(real, imag);
		}
		
	}
	
	
	const MINUS = "\u2212";
	const NBSP  = "\u00A0";
	
}
