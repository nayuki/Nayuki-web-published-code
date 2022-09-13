/* 
 * Number-theoretic transform demo (TypeScript)
 * 
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/number-theoretic-transform-integer-dft
 */


namespace app {
	
	{  // Forward transform
		let inVecInput : HTMLInputElement = getInput("forward-transform-input-vector");
		let minModInput: HTMLInputElement = getInput("forward-transform-minimum-working-modulus");
		let rootInput  : HTMLInputElement = getInput("forward-transform-nth-root-of-unity");
		
		inVecInput .onkeydown = doCalculate;
		minModInput.onkeydown = doCalculate;
		rootInput  .onkeydown = doCalculate;
		
		getHtml("forward-transform-calculate").onclick = doCalculate;
		
		
		function doCalculate(e: Event): void {
			if (e instanceof KeyboardEvent && e.key != "Enter")
				return;
			
			let vecLenElem : HTMLElement = getHtml("forward-transform-vector-length");
			let modulusElem: HTMLElement = getHtml("forward-transform-chosen-modulus");
			let rootElem   : HTMLElement = getHtml("forward-transform-chosen-nth-root-of-unity");
			let outVecElem : HTMLElement = getHtml("forward-transform-output-vector");
			
			vecLenElem .textContent = "";
			modulusElem.textContent = "";
			rootElem   .textContent = "";
			outVecElem .textContent = "";
			
			let vec: Array<bigint>;
			try {
				vec = parseVector(inVecInput.value);
				vecLenElem.textContent = vec.length.toString();
			} catch (e) {
				if (e instanceof Error)
					vecLenElem.textContent = e.message;
				return;
			}
			
			let modulus: bigint;
			{
				let minMod: bigint;
				const s: string = minModInput.value;
				if (/^[0-9]+$/.test(s))
					minMod = BigInt(s);
				else if (s == "")
					minMod = max(vec) + 1n;
				else {
					modulusElem.textContent = "Invalid number syntax";
					return;
				}
				modulus = numbertheoretictransform.findModulus(vec.length, minMod);
				modulusElem.textContent = modulus.toString();
			}
			
			let root: bigint;
			{
				const s: string = rootInput.value;
				if (/^[0-9]+$/.test(s)) {
					root = BigInt(s);
					if (root >= modulus || !numbertheoretictransform.isPrimitiveRoot(root, BigInt(vec.length), modulus)) {
						rootElem.textContent = "Invalid root of unity";
						return;
					}
				} else if (s == "")
					root = numbertheoretictransform.findPrimitiveRoot(BigInt(vec.length), modulus - 1n, modulus);
				else {
					rootElem.textContent = "Invalid number syntax";
					return;
				}
				rootElem.textContent = root.toString();
			}
			
			vec = numbertheoretictransform.transform(vec, root, modulus);
			outVecElem.textContent = vectorToString(vec);
		}
	}
	
	
	{  // Inverse transform
		let inVecInput : HTMLInputElement = getInput("inverse-transform-input-vector");
		let minModInput: HTMLInputElement = getInput("inverse-transform-minimum-working-modulus");
		let rootInput  : HTMLInputElement = getInput("inverse-transform-nth-root-of-unity");
		
		inVecInput .onkeydown = doCalculate;
		minModInput.onkeydown = doCalculate;
		rootInput  .onkeydown = doCalculate;
		
		getHtml("inverse-transform-calculate").onclick = doCalculate;
		
		
		function doCalculate(e: Event): void {
			if (e instanceof KeyboardEvent && e.key != "Enter")
				return;
			
			let vecLenElem : HTMLElement = getHtml("inverse-transform-vector-length");
			let modulusElem: HTMLElement = getHtml("inverse-transform-chosen-modulus");
			let rootElem   : HTMLElement = getHtml("inverse-transform-chosen-nth-root-of-unity");
			let outVecElem0: HTMLElement = getHtml("inverse-transform-output-vector-unscaled");
			let outVecElem1: HTMLElement = getHtml("inverse-transform-output-vector-scaled");
			
			vecLenElem .textContent = "";
			modulusElem.textContent = "";
			rootElem   .textContent = "";
			outVecElem0.textContent = "";
			outVecElem1.textContent = "";
			
			let vec: Array<bigint>;
			try {
				vec = parseVector(inVecInput.value);
				vecLenElem.textContent = vec.length.toString();
			} catch (e) {
				if (e instanceof Error)
					vecLenElem.textContent = e.message;
				return;
			}
			
			let modulus: bigint;
			{
				let minMod: bigint;
				const s: string = minModInput.value;
				if (/^[0-9]+$/.test(s))
					minMod = BigInt(s);
				else if (s == "")
					minMod = max(vec) + 1n;
				else {
					modulusElem.textContent = "Invalid number syntax";
					return;
				}
				modulus = numbertheoretictransform.findModulus(vec.length, minMod);
				modulusElem.textContent = modulus.toString();
			}
			
			let root: bigint;
			{
				const s: string = rootInput.value;
				if (/^[0-9]+$/.test(s)) {
					root = BigInt(s);
					if (root >= modulus || !numbertheoretictransform.isPrimitiveRoot(root, BigInt(vec.length), modulus)) {
						rootElem.textContent = "Invalid root of unity";
						return;
					}
				} else if (s == "")
					root = numbertheoretictransform.findPrimitiveRoot(BigInt(vec.length), modulus - 1n, modulus);
				else {
					rootElem.textContent = "Invalid number syntax";
					return;
				}
				rootElem.textContent = root.toString();
			}
			
			vec = numbertheoretictransform.transform(vec, numbertheoretictransform.reciprocalMod(root, modulus), modulus);
			outVecElem0.textContent = vectorToString(vec);
			const scaler: bigint = numbertheoretictransform.reciprocalMod(BigInt(vec.length), modulus)
			outVecElem1.textContent = vectorToString(vec.map(x => x * scaler % modulus));
		}
	}
	
	
	{  // Circular convolution
		let inVec0Input: HTMLInputElement = getInput("circular-convolution-input-vector-0");
		let inVec1Input: HTMLInputElement = getInput("circular-convolution-input-vector-1");
		let minModInput: HTMLInputElement = getInput("circular-convolution-minimum-working-modulus");
		let rootInput  : HTMLInputElement = getInput("circular-convolution-nth-root-of-unity");
		
		inVec0Input.onkeydown = doCalculate;
		inVec1Input.onkeydown = doCalculate;
		minModInput.onkeydown = doCalculate;
		rootInput  .onkeydown = doCalculate;
		
		getHtml("circular-convolution-calculate").onclick = doCalculate;
		
		
		function doCalculate(e: Event): void {
			if (e instanceof KeyboardEvent && e.key != "Enter")
				return;
			
			let vecLenElem   : HTMLElement = getHtml("circular-convolution-vector-length");
			let modulusElem  : HTMLElement = getHtml("circular-convolution-chosen-modulus");
			let rootElem     : HTMLElement = getHtml("circular-convolution-chosen-nth-root-of-unity");
			let transVec0Elem: HTMLElement = getHtml("circular-convolution-transformed-vector-0");
			let transVec1Elem: HTMLElement = getHtml("circular-convolution-transformed-vector-1");
			let multVecElem  : HTMLElement = getHtml("circular-convolution-pointwise-multiplied-vector");
			let outVecElem   : HTMLElement = getHtml("circular-convolution-output-vector");
			
			vecLenElem   .textContent = "";
			modulusElem  .textContent = "";
			rootElem     .textContent = "";
			transVec0Elem.textContent = "";
			transVec1Elem.textContent = "";
			multVecElem  .textContent = "";
			outVecElem   .textContent = "";
			
			let vec0: Array<bigint>;
			let vec1: Array<bigint>;
			try {
				vec0 = parseVector(inVec0Input.value);
				vec1 = parseVector(inVec1Input.value);
				if (vec0.length != vec1.length)
					throw new RangeError("Unequal vector lengths");
				vecLenElem.textContent = vec0.length.toString();
			} catch (e) {
				if (e instanceof Error)
					vecLenElem.textContent = e.message;
				return;
			}
			
			let modulus: bigint;
			{
				let minMod: bigint;
				const s: string = minModInput.value;
				if (/^[0-9]+$/.test(s))
					minMod = BigInt(s);
				else if (s == "") {
					minMod = max(vec0.concat(vec1));
					minMod = minMod * minMod * BigInt(vec0.length) + 1n;
				} else {
					modulusElem.textContent = "Invalid number syntax";
					return;
				}
				modulus = numbertheoretictransform.findModulus(vec0.length, minMod);
				modulusElem.textContent = modulus.toString();
			}
			
			let root: bigint;
			{
				const s: string = rootInput.value;
				if (/^[0-9]+$/.test(s)) {
					root = BigInt(s);
					if (root >= modulus || !numbertheoretictransform.isPrimitiveRoot(root, BigInt(vec0.length), modulus)) {
						rootElem.textContent = "Invalid root of unity";
						return;
					}
				} else if (s == "")
					root = numbertheoretictransform.findPrimitiveRoot(BigInt(vec0.length), modulus - 1n, modulus);
				else {
					rootElem.textContent = "Invalid number syntax";
					return;
				}
				rootElem.textContent = root.toString();
			}
			
			vec0 = numbertheoretictransform.transform(vec0, root, modulus);
			vec1 = numbertheoretictransform.transform(vec1, root, modulus);
			transVec0Elem.textContent = vectorToString(vec0);
			transVec1Elem.textContent = vectorToString(vec1);
			
			let vec = [];
			for (let i = 0; i < vec0.length; i++)
				vec.push(vec0[i] * vec1[i] % modulus);
			multVecElem.textContent = vectorToString(vec);
			
			vec = numbertheoretictransform.transform(vec, numbertheoretictransform.reciprocalMod(root, modulus), modulus);
			const scaler: bigint = numbertheoretictransform.reciprocalMod(BigInt(vec.length), modulus)
			outVecElem.textContent = vectorToString(vec.map(x => x * scaler % modulus));
		}
	}
	
	
	function parseVector(s: string): Array<bigint> {
		{
			const m: RegExpExecArray|null = /^\s*(.*?)\s*$/.exec(s);
			if (m === null)
				throw Error("Assertion error");
			s = m[1];
		}
		
		{
			const m: RegExpExecArray|null = /^\[\s*(.*?)\s*\]$/.exec(s);
			if (m !== null)
				s = m[1];
		}
		
		if (s.includes(","))
			s = s.replace(/\s*,\s*/g, ",");
		else
			s = s.replace(/\s+/g, ",");
		
		let result: Array<bigint> = [];
		for (const v of s.split(",")) {
			if (!/^[0-9]+$/.test(v))
				throw RangeError("Invalid vector syntax");
			result.push(BigInt(v));
		}
		return result;
	}
	
	
	function max(vec: Readonly<Array<bigint>>): bigint {
		if (vec.length == 0)
			throw new RangeError("Empty array");
		let result: bigint = vec[0];
		for (const x of vec) {
			if (x > result)
				result = x;
		}
		return result;
	}
	
	
	function vectorToString(vec: Readonly<Array<bigint>>): string {
		return "[" + vec.join(", ") + "]";
	}
	
	
	type Constructor<T> = { new(...args: Array<any>): T };
	
	function getElem<T>(id: string, type: Constructor<T>): T {
		const result: HTMLElement|null = document.getElementById(id);
		if (result instanceof type)
			return result;
		else if (result === null)
			throw new Error("Element not found");
		else
			throw new TypeError("Invalid element type");
	}
	
	
	function getInput(id: string): HTMLInputElement {
		return getElem(id, HTMLInputElement);
	}
	
	
	function getHtml(id: string): HTMLElement {
		return getElem(id, HTMLElement);
	}
	
}
