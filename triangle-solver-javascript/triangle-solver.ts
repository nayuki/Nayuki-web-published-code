/* 
 * Triangle solver (TypeScript)
 * 
 * Copyright (c) 2025 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/triangle-solver-javascript
 */


/*---- HTML elements ----*/

let tableElem: HTMLElement = queryHtml("article form table");
let sideAElems : [HTMLInputElement,[HTMLElement,HTMLElement]] = getIoElems("side-a" );
let sideBElems : [HTMLInputElement,[HTMLElement,HTMLElement]] = getIoElems("side-b" );
let sideCElems : [HTMLInputElement,[HTMLElement,HTMLElement]] = getIoElems("side-c" );
let angleAElems: [HTMLInputElement,[HTMLElement,HTMLElement]] = getIoElems("angle-a");
let angleBElems: [HTMLInputElement,[HTMLElement,HTMLElement]] = getIoElems("angle-b");
let angleCElems: [HTMLInputElement,[HTMLElement,HTMLElement]] = getIoElems("angle-c");
let areaOuts: [HTMLElement,HTMLElement] = getOutElems("area");
let statusOut: HTMLElement = queryHtml("article #status output");


function getIoElems(rowId: string): [HTMLInputElement,[HTMLElement,HTMLElement]] {
	return [queryInput(`article #${rowId} input`), getOutElems(rowId)];
}


function getOutElems(rowId: string): [HTMLElement,HTMLElement] {
	const [a, b] = document.querySelectorAll(`article #${rowId} output`);
	if (a instanceof HTMLElement && b instanceof HTMLElement)
		return [a, b];
	throw new TypeError();
}



/*---- Main entry point ----*/

let solutions: Array<SolvedTriangle> = [];


function doSolve(): void {
	/*-- Clear outputs --*/
	solutions = [];
	tableElem.classList.remove("at-least-1-solutions", "at-least-2-solutions");
	for (let elem of document.querySelectorAll("article output"))
		elem.textContent = "";
	
	/*-- Get inputs and solve --*/
	let status: string;
	try {
		// Returns the number if it's positive and finite, or null if the field is blank.
		// Throws an exception if it's zero, negative, infinite, or NaN.
		function parseNumber(input: HTMLInputElement): number|null {
			if (input.value == "")
				return null;
			const result: number = parseFloat(input.value);
			if (!isFinite(result))
				throw new RangeError("Invalid number");
			if (result <= 0)
				throw new RangeError("All inputs must be positive");
			return result;
		}
		
		const a: number|null = parseNumber(sideAElems [0]);
		const b: number|null = parseNumber(sideBElems [0]);
		const c: number|null = parseNumber(sideCElems [0]);
		const A: number|null = parseNumber(angleAElems[0]);
		const B: number|null = parseNumber(angleBElems[0]);
		const C: number|null = parseNumber(angleCElems[0]);
		[status, solutions] = solveTriangles(a, b, c, A, B, C);
		
	} catch (e) {
		if (!(e instanceof Error))
			throw new TypeError();
		statusOut.textContent = e.message;
		return;
	}
	
	/*-- Set outputs --*/
	function setOutputs(extractor: (t:SolvedTriangle)=>number, suffix: string, outputs: [HTMLElement,HTMLElement]): void {
		outputs.forEach((output, i) =>
			output.textContent = (i < solutions.length ? formatNumber(extractor(solutions[i])) + suffix : ""));
	}
	
	setOutputs(t => t.sideA , ""    , sideAElems [1]);
	setOutputs(t => t.sideB , ""    , sideBElems [1]);
	setOutputs(t => t.sideC , ""    , sideCElems [1]);
	setOutputs(t => t.angleA, DEGREE, angleAElems[1]);
	setOutputs(t => t.angleB, DEGREE, angleBElems[1]);
	setOutputs(t => t.angleC, DEGREE, angleCElems[1]);
	setOutputs(t => t.area  , ""    , areaOuts      );
	
	const EN_DASH: string = "\u2013";
	statusOut.textContent = status.charAt(0) + Array.from(status).map(c => ({"A":"angle","S":"side"})[c]).join(" ").substring(1) + ` (${status}) case`;
	if (solutions.length == 0)
		statusOut.textContent += ` ${EN_DASH} No solution`;
	else if (status == "SSA") {
		if (solutions.length == 1)
			statusOut.textContent += ` ${EN_DASH} Unique solution`;
		else if (solutions.length == 2)
			statusOut.textContent += ` ${EN_DASH} Two solutions`;
	}
	
	tableElem.classList.toggle("at-least-1-solutions", solutions.length >= 1);
	tableElem.classList.toggle("at-least-2-solutions", solutions.length >= 2);
}


function formatNumber(x: number): string {
	return x.toPrecision(9);
}


const DEGREE: string = "\u00B0";



/*---- Solver functions ----*/

class SolvedTriangle {
	public constructor(
		public readonly sideA: number,
		public readonly sideB: number,
		public readonly sideC: number,
		public readonly angleA: number,
		public readonly angleB: number,
		public readonly angleC: number,
		public readonly area: number) {}
}


function solveTriangles(a: number|null, b: number|null, c: number|null, A: number|null, B: number|null, C: number|null): [string,Array<SolvedTriangle>] {
	
	function degToRad(x: number): number {
		return x / 180 * Math.PI;
	}
	
	function radToDeg(x: number): number {
		return x / Math.PI * 180;
	}
	
	// Returns side c using law of cosines.
	function solveSide(a: number, b: number, C: number): number {
		C = degToRad(C);
		if (C > 0.001)
			return Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(C));
		else  // Explained in https://www.nayuki.io/page/numerically-stable-law-of-cosines
			return Math.sqrt((a - b) * (a - b) + a * b * C * C * (1 - C * C / 12));
	}
	
	// Returns angle C using law of cosines.
	function solveAngle(a: number, b: number, c: number): number {
		const temp: number = (a * a + b * b - c * c) / (2 * a * b);
		if (-1 <= temp && temp <= 0.9999999)
			return radToDeg(Math.acos(temp));
		else if (temp <= 1)  // Explained in https://www.nayuki.io/page/numerically-stable-law-of-cosines
			return radToDeg(Math.sqrt((c * c - (a - b) * (a - b)) / (a * b)));
		else
			throw new RangeError("No solution");
	}
	
	function solveSss(x: number, y: number, z: number): Array<[number,number,number,number]> {
		if (x + y <= z || y + z <= x || z + x <= y)
			return [];
		const X: number = solveAngle(y, z, x);
		const Y: number = solveAngle(z, x, y);
		const Z: number = solveAngle(x, y, z);
		const s: number = (x + y + z) / 2;
		const area: number = Math.sqrt(s * (s - x) * (s - y) * (s - z));  // Heron's formula
		return [[X, Y, Z, area]];
	}
	
	function solveAsa(x: number, Y: number, Z: number): Array<[number,number,number,number]> {
		// Find missing angle
		const X: number = 180 - Y - Z;
		if (X <= 0)
			return [];
		// Use law of sines to find sides
		const sinX: number = Math.sin(degToRad(X));
		const sinY: number = Math.sin(degToRad(Y));
		const sinZ: number = Math.sin(degToRad(Z));
		const ratio: number = x / sinX;  // side / sin(angle)
		const y: number = ratio * sinY;
		const z: number = ratio * sinZ;
		const area: number = x * ratio * sinY * sinZ / 2;
		return [[y, z, X, area]];
	}
	
	function solveAas(x: number, X: number, Y: number): Array<[number,number,number,number]> {
		// Find missing angle
		const Z: number = 180 - X - Y;
		if (Z <= 0)
			return [];
		return solveAsa(x, Y, Z).map(([y, z, X, area]) => [y, z, Z, area]);
	}
	
	function solveSas(x: number, y: number, Z: number): Array<[number,number,number,number]> {
		if (Z >= 180)
			return [];
		const z: number = solveSide(x, y, Z);
		const X: number = solveAngle(y, z, x);
		const Y: number = solveAngle(z, x, y);
		const area: number = x * y * Math.sin(degToRad(Z)) / 2;
		return [[z, X, Y, area]];
	}
	
	function solveSsa(x: number, y: number, X: number): Array<[number,number,number,number]> {
		if (X >= 180)
			return [];
		// Law of sines
		const ratio: number = x / Math.sin(degToRad(X));
		const sinY: number = y / ratio;
		let Ys: Array<number> = [];
		if (sinY <= 1 && (X < 90 || x > y)) {
			Ys.push(radToDeg(Math.asin(sinY)));
			if (sinY < 1 && x < y)
				Ys.push(180 - Ys[0]);
		}
		return Ys.map(Y => {
			const Z: number = 180 - X - Y;
			const z: number = ratio * Math.sin(degToRad(Z));
			const area: number = x * y * Math.sin(degToRad(Z)) / 2;
			return [z, Y, Z, area];
		});
	}
	
	let stat: string;
	let area: number;
	let solns: Array<SolvedTriangle> = [];
	
	// There are (6 choose 3) = 20 cases where exactly 3 pieces of information are provided
	if      (a !== null && b !== null && c !== null && A === null && B === null && C === null) {  stat = "SSS";  for ([A, B, C, area] of solveSss(a, b, c)) solns.push(new SolvedTriangle(a, b, c, A, B, C, area));  }
	
	else if (a !== null && b === null && c === null && A === null && B !== null && C !== null) {  stat = "ASA";  for ([b, c, A, area] of solveAsa(a, B, C)) solns.push(new SolvedTriangle(a, b, c, A, B, C, area));  }
	else if (a === null && b !== null && c === null && A !== null && B === null && C !== null) {  stat = "ASA";  for ([c, a, B, area] of solveAsa(b, C, A)) solns.push(new SolvedTriangle(a, b, c, A, B, C, area));  }
	else if (a === null && b === null && c !== null && A !== null && B !== null && C === null) {  stat = "ASA";  for ([a, b, C, area] of solveAsa(c, A, B)) solns.push(new SolvedTriangle(a, b, c, A, B, C, area));  }
	
	else if (a !== null && b === null && c === null && A !== null && B !== null && C === null) {  stat = "AAS";  for ([b, c, C, area] of solveAas(a, A, B)) solns.push(new SolvedTriangle(a, b, c, A, B, C, area));  }
	else if (a !== null && b === null && c === null && A !== null && B === null && C !== null) {  stat = "AAS";  for ([c, b, B, area] of solveAas(a, A, C)) solns.push(new SolvedTriangle(a, b, c, A, B, C, area));  }
	else if (a === null && b !== null && c === null && A === null && B !== null && C !== null) {  stat = "AAS";  for ([c, a, A, area] of solveAas(b, B, C)) solns.push(new SolvedTriangle(a, b, c, A, B, C, area));  }
	else if (a === null && b !== null && c === null && A !== null && B !== null && C === null) {  stat = "AAS";  for ([a, c, C, area] of solveAas(b, B, A)) solns.push(new SolvedTriangle(a, b, c, A, B, C, area));  }
	else if (a === null && b === null && c !== null && A !== null && B === null && C !== null) {  stat = "AAS";  for ([a, b, B, area] of solveAas(c, C, A)) solns.push(new SolvedTriangle(a, b, c, A, B, C, area));  }
	else if (a === null && b === null && c !== null && A === null && B !== null && C !== null) {  stat = "AAS";  for ([b, a, A, area] of solveAas(c, C, B)) solns.push(new SolvedTriangle(a, b, c, A, B, C, area));  }
	
	else if (a !== null && b !== null && c === null && A === null && B === null && C !== null) {  stat = "SAS";  for ([c, A, B, area] of solveSas(a, b, C)) solns.push(new SolvedTriangle(a, b, c, A, B, C, area));  }
	else if (a === null && b !== null && c !== null && A !== null && B === null && C === null) {  stat = "SAS";  for ([a, B, C, area] of solveSas(b, c, A)) solns.push(new SolvedTriangle(a, b, c, A, B, C, area));  }
	else if (a !== null && b === null && c !== null && A === null && B !== null && C === null) {  stat = "SAS";  for ([b, C, A, area] of solveSas(c, a, B)) solns.push(new SolvedTriangle(a, b, c, A, B, C, area));  }
	
	else if (a !== null && b !== null && c === null && A !== null && B === null && C === null) {  stat = "SSA";  for ([c, B, C, area] of solveSsa(a, b, A)) solns.push(new SolvedTriangle(a, b, c, A, B, C, area));  }
	else if (a !== null && b !== null && c === null && A === null && B !== null && C === null) {  stat = "SSA";  for ([c, A, C, area] of solveSsa(b, a, B)) solns.push(new SolvedTriangle(a, b, c, A, B, C, area));  }
	else if (a === null && b !== null && c !== null && A === null && B !== null && C === null) {  stat = "SSA";  for ([a, C, A, area] of solveSsa(b, c, B)) solns.push(new SolvedTriangle(a, b, c, A, B, C, area));  }
	else if (a === null && b !== null && c !== null && A === null && B === null && C !== null) {  stat = "SSA";  for ([a, B, A, area] of solveSsa(c, b, C)) solns.push(new SolvedTriangle(a, b, c, A, B, C, area));  }
	else if (a !== null && b === null && c !== null && A === null && B === null && C !== null) {  stat = "SSA";  for ([b, A, B, area] of solveSsa(c, a, C)) solns.push(new SolvedTriangle(a, b, c, A, B, C, area));  }
	else if (a !== null && b === null && c !== null && A !== null && B === null && C === null) {  stat = "SSA";  for ([b, C, B, area] of solveSsa(a, c, A)) solns.push(new SolvedTriangle(a, b, c, A, B, C, area));  }
	
	else if (a === null && b === null && c === null && A !== null && B !== null && C !== null)  throw new RangeError("Give at least one side length");
	else  throw new RangeError("Give exactly 3 pieces of information");
	
	return [stat, solns];
}



/*---- Diagram hover ----*/

function initImageMap(): void {
	function parseEm(str: string): number {
		const match: RegExpExecArray|null = /^(\d+(?:\.\d*)?)em$/.exec(str);
		if (match !== null)
			return parseFloat(match[1]);
		else
			throw new RangeError("Invalid unit");
	}
	
	let container: HTMLElement = queryHtml("article #diagram-container");
	const containerWidth: number = parseEm(container.style.width);
	let hoverTextElem: HTMLElement = queryHtml("#diagram-container output");
	
	// Each entry is (left, top, width, height, extractor)
	const RECTANGLES: Array<[number,number,number,number,((t:SolvedTriangle)=>number)]> = [
		[0.4922, 0.4419, 0.0227, 0.0229, t => t.sideA ],
		[0.1784, 0.1789, 0.0221, 0.0339, t => t.sideB ],
		[0.6424, 0.1754, 0.0201, 0.0229, t => t.sideC ],
		[0.3492, 0.0964, 0.0322, 0.0333, t => t.angleA],
		[0.7803, 0.3531, 0.0330, 0.0326, t => t.angleB],
		[0.1393, 0.3504, 0.0322, 0.0340, t => t.angleC],
	];
	const RECT_PADDED_SIZE: number = 0.0720;
	
	RECTANGLES.forEach((rect, i) => {
		let highlightElem: HTMLAnchorElement = document.createElement("a");
		container.insertBefore(highlightElem, hoverTextElem);
		highlightElem.href = "#";
		highlightElem.style.left = (rect[0] - (RECT_PADDED_SIZE - rect[2]) / 2) * containerWidth + "em";
		highlightElem.style.top  = (rect[1] - (RECT_PADDED_SIZE - rect[3]) / 2) * containerWidth + "em";
		highlightElem.style.width = highlightElem.style.height = RECT_PADDED_SIZE * containerWidth + "em";
		
		const extractor: (t:SolvedTriangle)=>number = rect[4];
		highlightElem.onmouseover = () => {
			if (solutions.length == 0)
				return;
			
			const suffix: string = 3 <= i && i < 6 ? DEGREE : "";
			let text: string = formatNumber(extractor(solutions[0])) + suffix;
			if (solutions.length == 2 && extractor(solutions[0]) != extractor(solutions[1]))
				text += " or\n" + formatNumber(extractor(solutions[1])) + suffix;
			hoverTextElem.textContent = text;
			
			// Set hover element style
			hoverTextElem.hidden = false;
			hoverTextElem.style.left = rect[0] * containerWidth + "em";
			hoverTextElem.style.bottom = ((0.5 - rect[1]) * containerWidth + 0.5) + "em";
		};
		
		highlightElem.onmouseout = () => {
			hoverTextElem.textContent = "";
			hoverTextElem.hidden = true;
		};
		highlightElem.onclick = ev => {
			ev.preventDefault();
			[sideAElems, sideBElems, sideCElems, angleAElems, angleBElems, angleCElems][i][0].select();
		};
	});
}

setTimeout(initImageMap);
