/* 
 * GCD calculator
 * 
 * Copyright (c) 2018 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/calculate-gcd-javascript
 */

"use strict";


namespace app {
	
	/*---- Preamble definitions ----*/
	
	function inputElem(id: string): HTMLInputElement {
		const result = document.getElementById(id);
		if (result instanceof HTMLInputElement)
			return result;
		throw "Assertion error";
	}
	
	const outputElem = inputElem("output");
	
	
	
	/*---- Entry points from HTML page ----*/
	
	export function doCalculate(): void {
		const xStr: string = inputElem("numberX").value;
		const yStr: string = inputElem("numberY").value;
		if (xStr == "" || yStr == "") {
			outputElem.value = "";
			return;
		}
		let xInt: Uint;
		let yInt: Uint;
		try {
			xInt = new Uint(xStr);
			yInt = new Uint(yStr);
		} catch (e) {
			outputElem.value = "Not an integer";
			return;
		}
		try {
			outputElem.value = xInt.gcd(yInt).toString();
		} catch (e) {
			outputElem.value = "Assertion error";
		}
	}
	
	
	let randomClicked: number = 0;
	
	export function doRandom(): void {
		randomClicked++;
		const limit: number = randomClicked / 10;
		const len: number = Math.floor(Math.random() * limit) + 1;
		function genRandom(): string {
			let result: string = "";
			for (let i = 0; i < len; i++)
				result += Math.floor(Math.random() * 10);
			return result.replace(/^0+(.)/g, "$1");
		}
		inputElem("numberX").value = genRandom();
		inputElem("numberY").value = genRandom();
		doCalculate();
	}
	
	
	
	/*---- Data structure and algorithms ----*/
	
	// An unsigned big integer represented in decimal (base 10).
	class Uint {
		
		private readonly digits: Array<number> = [];  // Little endian
		
		
		public constructor(val: string|Array<number>) {
			if (typeof val == "string") {
				if (!/^[0-9]+$/.test(val))
					throw "Invalid number string";
				for (const c of val)
					this.digits.push(parseInt(c, 10));
				this.digits.reverse();
			} else if (Array.isArray(val)) {
				if (val.length == 0)
					this.digits = [0];
				else
					this.digits = val.slice();
			} else
				throw "Invalid argument type";
			
			// Remove trailing zeros
			while (this.digits.length > 1 && this.digits[this.digits.length - 1] == 0)
				this.digits.pop();
			if (this.digits.length == 0)
				throw "Assertion error";
		}
		
		
		public isZero(): boolean {
			return this.digits.every(d => d == 0);
		}
		
		
		public isEven(): boolean {
			return this.digits[0] % 2 == 0;
		}
		
		
		public isLessThan(other: Uint): boolean {
			let result: boolean = false;
			const a: Array<number> = this .digits;
			const b: Array<number> = other.digits;
			for (let i = 0; i < a.length || i < b.length; i++) {
				const x: number = i < a.length ? a[i] : 0;
				const y: number = i < b.length ? b[i] : 0;
				if (x < y)
					result = true;
				if (x > y)
					result = false;
			}
			return result;
		}
		
		
		public subtract(other: Uint): Uint {
			let newDigits: Array<number> = [];
			let borrow: number = 0;
			const a: Array<number> = this .digits;
			const b: Array<number> = other.digits;
			for (let i = 0; i < a.length || i < b.length; i++) {
				const x: number = i < a.length ? a[i] : 0;
				const y: number = i < b.length ? b[i] : 0;
				const diff: number = x - y - borrow;
				borrow = -Math.floor(diff / 10);
				newDigits.push(diff + borrow * 10);
			}
			if (borrow > 0)
				throw "Negative result";
			return new Uint(newDigits);
		}
		
		
		// n must be in the range [0, 9].
		public multiply(n: number): Uint {
			let newDigits: Array<number> = [];
			let carry: number = 0;
			this.digits.forEach(digit => {
				const sum = digit * n + carry;
				newDigits.push(sum % 10);
				carry = Math.floor(sum / 10);
			});
			if (carry > 0)
				newDigits.push(carry);
			return new Uint(newDigits);
		}
		
		
		public divide2Exact(): Uint {
			if (!this.isEven())
				throw "Number is odd";
			const temp: Uint = this.multiply(5);
			let newDigits: Array<number> = temp.digits.slice();
			newDigits.shift();
			return new Uint(newDigits);
		}
		
		
		public gcd(other: Uint): Uint {
			let x: Uint = this;
			let y: Uint = other;
			let twos: number = 0;
			while (true) {  // Binary GCD algorithm
				if (x.isLessThan(y))
					[x, y] = [y, x];
				if (y.isZero())
					break;
				if (x.isEven() && y.isEven()) {
					x = x.divide2Exact();
					y = y.divide2Exact();
					twos++;
				} else if (x.isEven())
					x = x.divide2Exact();
				else if (y.isEven())
					y = y.divide2Exact();
				else
					x = x.subtract(y).divide2Exact();
			}
			for (let i = 0; i < twos; i++)
				x = x.multiply(2);
			return x;
		}
		
		
		public toString(): string {
			return this.digits.slice().reverse().map(d => d.toString()).join("");
		}
		
	}
	
}
