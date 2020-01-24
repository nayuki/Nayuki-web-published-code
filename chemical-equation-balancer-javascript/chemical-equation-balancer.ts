/* 
 * Chemical equation balancer
 * 
 * Copyright (c) 2020 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/chemical-equation-balancer-javascript
 */


/*---- Entry point functions from HTML GUI ----*/

const formulaElem = document.getElementById("inputFormula") as HTMLInputElement;


// Balances the given formula string and sets the HTML output on the page. Returns nothing.
function doBalance(): void {
	// Clear output
	const msgElem = document.getElementById("message") as HTMLElement;
	const balancedElem = document.getElementById("balanced") as HTMLElement;
	const codeOutElem  = document.getElementById("codeOutput") as HTMLElement;
	msgElem.textContent = "";
	while (balancedElem.firstChild !== null)
		balancedElem.removeChild(balancedElem.firstChild);
	while (codeOutElem.firstChild !== null)
		codeOutElem.removeChild(codeOutElem.firstChild);
	codeOutElem.textContent = " ";
	
	// Parse equation
	const formulaStr: string = formulaElem.value;
	let eqn: Equation;
	try {
		eqn = new Parser(formulaStr).parseEquation();
	} catch (e) {
		if (typeof e == "string") {  // Simple error message string
			msgElem.textContent = "Syntax error: " + e;
			
		} else if ("start" in e) {  // Error message object with start and possibly end character indices
			msgElem.textContent = "Syntax error: " + e.message;
			
			const start: number = e.start;
			let end: number = "end" in e ? e.end : e.start;
			while (end > start && [" ", "\t"].indexOf(formulaStr.charAt(end - 1)) != -1)
				end--;  // Adjust position to eliminate whitespace
			if (start == end)
				end++;
			
			codeOutElem.textContent += formulaStr.substring(0, start);
			if (end <= formulaStr.length) {
				codeOutElem.appendChild(createElem("u", formulaStr.substring(start, end)));
				codeOutElem.appendChild(document.createTextNode(formulaStr.substring(end, formulaStr.length)));
			} else
				codeOutElem.appendChild(createElem("u", " "));
			
		} else {
			msgElem.textContent = "Assertion error";
		}
		return;
	}
	
	try {
		let matrix: Matrix = buildMatrix(eqn);                   // Set up matrix
		solve(matrix);                                           // Solve linear system
		const coefs: Array<number> = extractCoefficients(matrix);  // Get coefficients
		checkAnswer(eqn, coefs);                                 // Self-test, should not fail
		balancedElem.appendChild(eqn.toHtml(coefs));             // Display balanced equation
	} catch (e) {
		msgElem.textContent = e.toString();
	}
}


// Sets the input box to the given formula string and balances it. Returns nothing.
function doDemo(formulaStr: string): void {
	formulaElem.value = formulaStr;
	doBalance();
}


const RANDOM_DEMOS: Array<string> = [
	"H2 + O2 = H2O",
	"Fe + O2 = Fe2O3",
	"NH3 + O2 = N2 + H2O",
	"C2H2 + O2 = CO2 + H2O",
	"C3H8O + O2 = CO2 + H2O",
	"Na + O2 = Na2O",
	"P4 + O2 = P2O5",
	"Na2O + H2O = NaOH",
	"Mg + HCl = MgCl2 + H2",
	"AgNO3 + LiOH = AgOH + LiNO3",
	"Pb + PbO2 + H^+ + SO4^2- = PbSO4 + H2O",
	"HNO3 + Cu = Cu(NO3)2 + H2O + NO",
	"KNO2 + KNO3 + Cr2O3 = K2CrO4 + NO",
	"AgNO3 + BaCl2 = Ba(NO3)2 + AgCl",
	"Cu(NO3)2 = CuO + NO2 + O2",
	"Al + CuSO4 = Al2(SO4)3 + Cu",
	"Na3PO4 + Zn(NO3)2 = NaNO3 + Zn3(PO4)2",
	"Cl2 + Ca(OH)2 = Ca(ClO)2 + CaCl2 + H2O",
	"CHCl3 + O2 = CO2 + H2O + Cl2",
	"H2C2O4 + MnO4^- = H2O + CO2 + MnO + OH^-",
	"H2O2 + Cr2O7^2- = Cr^3+ + O2 + OH^-",
	"KBr + KMnO4 + H2SO4 = Br2 + MnSO4 + K2SO4 + H2O",
	"K2Cr2O7 + KI + H2SO4 = Cr2(SO4)3 + I2 + H2O + K2SO4",
	"KClO3 + KBr + HCl = KCl + Br2 + H2O",
	"Ag + HNO3 = AgNO3 + NO + H2O",
	"P4 + OH^- + H2O = H2PO2^- + P2H4",
	"Zn + NO3^- + H^+ = Zn^2+ + NH4^+ + H2O",
	"ICl + H2O = Cl^- + IO3^- + I2 + H^+",
	"AB2 + AC3 + AD5 + AE7 + AF11 + AG13 + AH17 + AI19 + AJ23 = A + ABCDEFGHIJ",
];

let lastRandomIndex: number = -1;

function doRandom(): void {
	let index: number;
	do {
		index = Math.floor(Math.random() * RANDOM_DEMOS.length);
		index = Math.max(Math.min(index, RANDOM_DEMOS.length - 1), 0);
	} while (RANDOM_DEMOS.length >= 2 && index == lastRandomIndex);
	lastRandomIndex = index;
	doDemo(RANDOM_DEMOS[index]);
}



/*---- Text formula parser classes ----*/

class Parser {
	private tok: Tokenizer;
	
	public constructor(formulaStr: string) {
		this.tok = new Tokenizer(formulaStr);
	}
	
	// Parses and returns an equation.
	public parseEquation(): Equation {
		let lhs: Array<Term> = [this.parseTerm()];
		while (true) {
			const next: string|null = this.tok.peek();
			if (next == "+") {
				this.tok.consume(next);
				lhs.push(this.parseTerm());
			} else if (next == "=") {
				this.tok.consume(next);
				break;
			} else
				throw {message: "Plus or equal sign expected", start: this.tok.pos};
		}
		
		let rhs: Array<Term> = [this.parseTerm()];
		while (true) {
			const next: string|null = this.tok.peek();
			if (next === null)
				break;
			else if (next == "+") {
				this.tok.consume(next);
				rhs.push(this.parseTerm());
			} else
				throw {message: "Plus or end expected", start: this.tok.pos};
		}
		return new Equation(lhs, rhs);
	}
	
	
	// Parses and returns a term.
	private parseTerm(): Term {
		const startPos: number = this.tok.pos;
		
		// Parse groups and elements
		let items: Array<ChemElem|Group> = [];
		let electron = false;
		let next: string|null;
		while (true) {
			next = this.tok.peek();
			if (next == "(")
				items.push(this.parseGroup());
			else if (next == "e") {
				this.tok.consume(next);
				electron = true;
			} else if (next !== null && /^[A-Z][a-z]*$/.test(next))
				items.push(this.parseElement());
			else if (next !== null && /^[0-9]+$/.test(next))
				throw {message: "Invalid term - number not expected", start: this.tok.pos};
			else
				break;
		}
		
		// Parse optional charge
		let charge: number|null = null;
		if (next == "^") {
			this.tok.consume(next);
			next = this.tok.peek();
			if (next === null)
				throw {message: "Number or sign expected", start: this.tok.pos};
			else {
				charge = this.parseOptionalNumber();
				next = this.tok.peek();
			}
			
			if (next == "+")
				charge = +charge;  // No-op
			else if (next == "-")
				charge = -charge;
			else
				throw {message: "Sign expected", start: this.tok.pos};
			this.tok.take();  // Consume the sign
		}
		
		// Check and postprocess term
		if (electron) {
			if (items.length > 0)
				throw {message: "Invalid term - electron needs to stand alone", start: startPos, end: this.tok.pos};
			if (charge === null)  // Allow omitting the charge
				charge = -1;
			if (charge != -1)
				throw {message: "Invalid term - invalid charge for electron", start: startPos, end: this.tok.pos};
		} else {
			if (items.length == 0)
				throw {message: "Invalid term - empty", start: startPos, end: this.tok.pos};
			if (charge === null)
				charge = 0;
		}
		return new Term(items, charge);
	}
	
	
	// Parses and returns a group.
	private parseGroup(): Group {
		const startPos: number = this.tok.pos;
		this.tok.consume("(");
		let items: Array<ChemElem|Group> = [];
		while (true) {
			const next: string|null = this.tok.peek();
			if (next == "(")
				items.push(this.parseGroup());
			else if (next !== null && /^[A-Z][a-z]*$/.test(next))
				items.push(this.parseElement());
			else if (next == ")") {
				this.tok.consume(next);
				if (items.length == 0)
					throw {message: "Empty group", start: startPos, end: this.tok.pos};
				break;
			} else
				throw {message: "Element, group, or closing parenthesis expected", start: this.tok.pos};
		}
		return new Group(items, this.parseOptionalNumber());
	}
	
	
	// Parses and returns an element.
	private parseElement(): ChemElem {
		const name: string = this.tok.take();
		if (!/^[A-Z][a-z]*$/.test(name))
			throw "Assertion error";
		return new ChemElem(name, this.parseOptionalNumber());
	}
	
	
	// Parses a number if it's the next token, returning a non-negative integer, with a default of 1.
	private parseOptionalNumber(): number {
		const next: string|null = this.tok.peek();
		if (next !== null && /^[0-9]+$/.test(next))
			return checkedParseInt(this.tok.take());
		else
			return 1;
	}
}



// Tokenizes a formula into a stream of token strings.
class Tokenizer {
	private str: string;
	public pos: number;  // The index of the next character to tokenize.
	
	public constructor(str: string) {
		this.str = str.replace(/\u2212/g, "-");
		this.pos = 0;
		this.skipSpaces();
	}
	
	// Returns the next token as a string, or null if the end of the token stream is reached.
	public peek(): string|null {
		if (this.pos == this.str.length)  // End of stream
			return null;
		const match: RegExpExecArray|null = /^([A-Za-z][a-z]*|[0-9]+|[+\-^=()])/.exec(this.str.substring(this.pos));
		if (match === null)
			throw {message: "Invalid symbol", start: this.pos};
		return match[0];
	}
	
	// Returns the next token as a string and advances this tokenizer past the token.
	public take(): string {
		const result = this.peek();
		if (result === null)
			throw "Advancing beyond last token";
		this.pos += result.length;
		this.skipSpaces();
		return result;
	}
	
	// Takes the next token and checks that it matches the given string, or throws an exception.
	public consume(s: string): void {
		if (this.take() != s)
			throw "Token mismatch";
	}
	
	private skipSpaces(): void {
		const match: RegExpExecArray|null = /^[ \t]*/.exec(this.str.substring(this.pos));
		if (match === null)
			throw "Assertion error";
		this.pos += match[0].length;
	}
}



/*---- Chemical equation data types ----*/

// A complete chemical equation. It has a left-hand side list of terms and a right-hand side list of terms.
// For example: H2 + O2 -> H2O.
class Equation {
	public leftSide : Array<Term>;
	public rightSide: Array<Term>;
	
	public constructor(lhs: Array<Term>, rhs: Array<Term>) {
		// Make defensive copies
		this.leftSide  = lhs.slice();
		this.rightSide = rhs.slice();
	}
	
	// Returns an array of the names all of the elements used in this equation.
	// The array represents a set, so the items are in an arbitrary order and no item is repeated.
	public getElements(): Array<string> {
		const result = new Set<string>();
		for (const item of this.leftSide.concat(this.rightSide))
			item.getElements(result);
		return Array.from(result);
	}
	
	// Returns an HTML element representing this equation.
	// 'coefs' is an optional argument, which is an array of coefficients to match with the terms.
	public toHtml(coefs?: Array<number>): DocumentFragment {
		if (coefs !== undefined && coefs.length != this.leftSide.length + this.rightSide.length)
			throw "Mismatched number of coefficients";
		
		let node = document.createDocumentFragment();
		
		let j = 0;
		function termsToHtml(terms: Array<Term>): void {
			let head = true;
			for (const term of terms) {
				const coef = coefs !== undefined ? coefs[j] : 1;
				if (coef != 0) {
					if (head)
						head = false;
					else
						node.appendChild(createSpan("plus", " + "));
					if (coef != 1) {
						let span = createSpan("coefficient", coef.toString().replace(/-/, MINUS));
						if (coef < 0)
							span.classList.add("negative");
						node.appendChild(span);
					}
					node.appendChild(term.toHtml());
				}
				j++;
			}
		}
		
		termsToHtml(this.leftSide );
		node.appendChild(createSpan("rightarrow", " \u2192 "));
		termsToHtml(this.rightSide);
		
		return node;
	}
}


// A term in a chemical equation. It has a list of groups or elements, and a charge.
// For example: H3O^+, or e^-.
class Term {
	private items: Array<ChemElem|Group>;
	private charge: number;
	
	public constructor(items: Array<ChemElem|Group>, charge: number) {
		if (items.length == 0 && charge != -1)
			throw "Invalid term";  // Electron case
		this.items = items.slice();
		this.charge = charge;
	}
	
	public getElements(resultSet: Set<string>): void {
		resultSet.add("e");
		for (const item of this.items)
			item.getElements(resultSet);
	}
	
	// Counts the number of times the given element (specified as a string) occurs in this term, taking groups and counts into account, returning an integer.
	public countElement(name: string): number {
		if (name == "e") {
			return -this.charge;
		} else {
			let sum = 0;
			for (const item of this.items)
				sum = checkedAdd(sum, item.countElement(name));
			return sum;
		}
	}
	
	// Returns an HTML element representing this term.
	public toHtml(): HTMLElement {
		let node = createSpan("term");
		if (this.items.length == 0 && this.charge == -1) {
			node.textContent = "e";
			node.appendChild(createElem("sup", MINUS));
		} else {
			for (const item of this.items)
				node.appendChild(item.toHtml());
			if (this.charge != 0) {
				let s;
				if (Math.abs(this.charge) == 1) s = "";
				else s = Math.abs(this.charge).toString();
				if (this.charge > 0) s += "+";
				else s += MINUS;
				node.appendChild(createElem("sup", s));
			}
		}
		return node;
	}
}


// A group in a term. It has a list of groups or elements.
// For example: (OH)3
class Group {
	private items: Array<ChemElem|Group>;
	private count: number;
	
	public constructor(items: Array<ChemElem|Group>, count: number) {
		if (count < 1)
			throw "Assertion error: Count must be a positive integer";
		this.items = items.slice();
		this.count = count;
	}
	
	public getElements(resultSet: Set<string>): void {
		for (const item of this.items)
			item.getElements(resultSet);
	}
	
	public countElement(name: string): number {
		let sum = 0;
		for (const item of this.items)
			sum = checkedAdd(sum, checkedMultiply(item.countElement(name), this.count));
		return sum;
	}
	
	// Returns an HTML element representing this group.
	public toHtml(): HTMLElement {
		let node = createSpan("group", "(");
		for (const item of this.items)
			node.appendChild(item.toHtml());
		node.appendChild(document.createTextNode(")"));
		if (this.count != 1)
			node.appendChild(createElem("sub", this.count.toString()));
		return node;
	}
}


// A chemical element.
// For example: Na, F2, Ace, Uuq6
class ChemElem {
	public constructor(
			private name: string,
			private count: number) {
		if (count < 1)
			throw "Assertion error: Count must be a positive integer";
	}
	
	public getElements(resultSet: Set<string>): void {
		resultSet.add(this.name);
	}
	
	public countElement(n: string): number {
		return n == this.name ? this.count : 0;
	}
	
	// Returns an HTML element representing this element.
	public toHtml(): HTMLElement {
		let node = createSpan("element", this.name);
		if (this.count != 1)
			node.appendChild(createElem("sub", this.count.toString()));
		return node;
	}
}



/*---- Core number-processing fuctions ----*/

// A matrix of integers.
class Matrix {
	private cells: Array<Array<number>>;
	
	public constructor(
			public numRows: number,
			public numCols: number) {
		if (numRows < 0 || numCols < 0)
			throw "Illegal argument";
		
		// Initialize with zeros
		let row: Array<number> = [];
		for (let j = 0; j < numCols; j++)
			row.push(0);
		this.cells = [];  // Main data (the matrix)
		for (let i = 0; i < numRows; i++)
			this.cells.push(row.slice());
	}
	
	/* Accessor functions */
	
	// Returns the value of the given cell in the matrix, where r is the row and c is the column.
	public get(r: number, c: number): number {
		if (r < 0 || r >= this.numRows || c < 0 || c >= this.numCols)
			throw "Index out of bounds";
		return this.cells[r][c];
	}
	
	// Sets the given cell in the matrix to the given value, where r is the row and c is the column.
	public set(r: number, c: number, val: number): void {
		if (r < 0 || r >= this.numRows || c < 0 || c >= this.numCols)
			throw "Index out of bounds";
		this.cells[r][c] = val;
	}
	
	/* Private helper functions for gaussJordanEliminate() */
	
	// Swaps the two rows of the given indices in this matrix. The degenerate case of i == j is allowed.
	private swapRows(i: number, j: number): void {
		if (i < 0 || i >= this.numRows || j < 0 || j >= this.numRows)
			throw "Index out of bounds";
		const temp: Array<number> = this.cells[i];
		this.cells[i] = this.cells[j];
		this.cells[j] = temp;
	}
	
	// Returns a new row that is the sum of the two given rows. The rows are not indices.
	// For example, addRow([3, 1, 4], [1, 5, 6]) = [4, 6, 10].
	private static addRows(x: Array<number>, y: Array<number>): Array<number> {
		let z: Array<number> = [];
		for (let i = 0; i < x.length; i++)
			z.push(checkedAdd(x[i], y[i]));
		return z;
	}
	
	// Returns a new row that is the product of the given row with the given scalar. The row is is not an index.
	// For example, multiplyRow([0, 1, 3], 4) = [0, 4, 12].
	private static multiplyRow(x: Array<number>, c: number): Array<number> {
		return x.map(val =>
			checkedMultiply(val, c));
	}
	
	// Returns the GCD of all the numbers in the given row. The row is is not an index.
	// For example, gcdRow([3, 6, 9, 12]) = 3.
	private static gcdRow(x: Array<number>): number {
		let result = 0;
		for (const val of x)
			result = gcd(val, result);
		return result;
	}
	
	// Returns a new row where the leading non-zero number (if any) is positive, and the GCD of the row is 0 or 1.
	// For example, simplifyRow([0, -2, 2, 4]) = [0, 1, -1, -2].
	private static simplifyRow(x: Array<number>): Array<number> {
		let sign = 0;
		for (const val of x) {
			if (val != 0) {
				sign = Math.sign(val);
				break;
			}
		}
		if (sign == 0)
			return x.slice();
		const g: number = Matrix.gcdRow(x) * sign;
		return x.map(val => val / g);
	}
	
	// Changes this matrix to reduced row echelon form (RREF), except that each leading coefficient is not necessarily 1. Each row is simplified.
	public gaussJordanEliminate(): void {
		// Simplify all rows
		let cells: Array<Array<number>> = this.cells = this.cells.map(Matrix.simplifyRow);
		
		// Compute row echelon form (REF)
		let numPivots = 0;
		for (let i = 0; i < this.numCols; i++) {
			// Find pivot
			let pivotRow = numPivots;
			while (pivotRow < this.numRows && cells[pivotRow][i] == 0)
				pivotRow++;
			if (pivotRow == this.numRows)
				continue;
			const pivot = cells[pivotRow][i];
			this.swapRows(numPivots, pivotRow);
			numPivots++;
			
			// Eliminate below
			for (let j = numPivots; j < this.numRows; j++) {
				const g = gcd(pivot, cells[j][i]);
				cells[j] = Matrix.simplifyRow(Matrix.addRows(Matrix.multiplyRow(cells[j], pivot / g), Matrix.multiplyRow(cells[i], -cells[j][i] / g)));
			}
		}
		
		// Compute reduced row echelon form (RREF), but the leading coefficient need not be 1
		for (let i = this.numRows - 1; i >= 0; i--) {
			// Find pivot
			let pivotCol = 0;
			while (pivotCol < this.numCols && cells[i][pivotCol] == 0)
				pivotCol++;
			if (pivotCol == this.numCols)
				continue;
			const pivot = cells[i][pivotCol];
			
			// Eliminate above
			for (let j = i - 1; j >= 0; j--) {
				const g = gcd(pivot, cells[j][pivotCol]);
				cells[j] = Matrix.simplifyRow(Matrix.addRows(Matrix.multiplyRow(cells[j], pivot / g), Matrix.multiplyRow(cells[i], -cells[j][pivotCol] / g)));
			}
		}
	}
}


// Returns a matrix based on the given equation object.
function buildMatrix(eqn: Equation): Matrix {
	let elems: Array<string> = eqn.getElements();
	let lhs: Array<Term> = eqn.leftSide;
	let rhs: Array<Term> = eqn.rightSide;
	let matrix = new Matrix(elems.length + 1, lhs.length + rhs.length + 1);
	elems.forEach((elem, i) => {
		let j = 0;
		for (const term of lhs) {
			matrix.set(i, j,  term.countElement(elem));
			j++;
		}
		for (const term of rhs) {
			matrix.set(i, j, -term.countElement(elem));
			j++;
		}
	});
	return matrix;
}


function solve(matrix: Matrix): void {
	matrix.gaussJordanEliminate();
	
	function countNonzeroCoeffs(row: number): number {
		let count = 0;
		for (let i = 0; i < matrix.numCols; i++) {
			if (matrix.get(row, i) != 0)
				count++;
		}
		return count;
	}
	
	// Find row with more than one non-zero coefficient
	let i;
	for (i = 0; i < matrix.numRows - 1; i++) {
		if (countNonzeroCoeffs(i) > 1)
			break;
	}
	if (i == matrix.numRows - 1)
		throw "All-zero solution";  // Unique solution with all coefficients zero
	
	// Add an inhomogeneous equation
	matrix.set(matrix.numRows - 1, i, 1);
	matrix.set(matrix.numRows - 1, matrix.numCols - 1, 1);
	
	matrix.gaussJordanEliminate();
}


function extractCoefficients(matrix: Matrix): Array<number> {
	const rows: number = matrix.numRows;
	const cols: number = matrix.numCols;
	
	if (cols - 1 > rows || matrix.get(cols - 2, cols - 2) == 0)
		throw "Multiple independent solutions";
	
	let lcm = 1;
	for (let i = 0; i < cols - 1; i++)
		lcm = checkedMultiply(lcm / gcd(lcm, matrix.get(i, i)), matrix.get(i, i));
	
	let coefs: Array<number> = [];
	let allzero = true;
	for (let i = 0; i < cols - 1; i++) {
		const coef = checkedMultiply(lcm / matrix.get(i, i), matrix.get(i, cols - 1));
		coefs.push(coef);
		allzero = allzero && coef == 0;
	}
	if (allzero)
		throw "Assertion error: All-zero solution";
	return coefs;
}


// Throws an exception if there's a problem, otherwise returns silently.
function checkAnswer(eqn: Equation, coefs: Array<number>): void {
	if (coefs.length != eqn.leftSide.length + eqn.rightSide.length)
		throw "Assertion error: Mismatched length";
	
	let allzero = true;
	for (const coef of coefs) {
		if (typeof coef != "number" || isNaN(coef) || Math.floor(coef) != coef)
			throw "Assertion error: Not an integer";
		allzero = allzero && coef == 0;
	}
	if (allzero)
		throw "Assertion error: All-zero solution";
	
	for (const elem of eqn.getElements()) {
		let sum = 0;
		let j = 0;
		for (const term of eqn.leftSide) {
			sum = checkedAdd(sum, checkedMultiply(term.countElement(elem),  coefs[j]));
			j++;
		}
		for (const term of eqn.rightSide) {
			sum = checkedAdd(sum, checkedMultiply(term.countElement(elem), -coefs[j]));
			j++;
		}
		if (sum != 0)
			throw "Assertion error: Incorrect balance";
	}
}



/*---- Simple math functions ----*/

const INT_MAX: number = 9007199254740992;  // 2^53

// Returns the given string parsed into a number, or throws an exception if the result is too large.
function checkedParseInt(str: string): number {
	const result = parseInt(str, 10);
	if (isNaN(result))
		throw "Not a number";
	return checkOverflow(result);
}

// Returns the sum of the given integers, or throws an exception if the result is too large.
function checkedAdd(x: number, y: number): number {
	return checkOverflow(x + y);
}

// Returns the product of the given integers, or throws an exception if the result is too large.
function checkedMultiply(x: number, y: number): number {
	return checkOverflow(x * y);
}

// Throws an exception if the given integer is too large, otherwise returns it.
function checkOverflow(x: number): number {
	if (Math.abs(x) >= INT_MAX)
		throw "Arithmetic overflow";
	return x;
}


// Returns the greatest common divisor of the given integers.
function gcd(x: number, y: number): number {
	if (typeof x != "number" || typeof y != "number" || isNaN(x) || isNaN(y))
		throw "Invalid argument";
	x = Math.abs(x);
	y = Math.abs(y);
	while (y != 0) {
		const z = x % y;
		x = y;
		y = z;
	}
	return x;
}



/*---- Miscellaneous code ----*/

// Unicode character constants (because this script file's character encoding is unspecified)
const MINUS: string = "\u2212";  // Minus sign


// Returns a new DOM element with the given tag name, with the optional given text content.
function createElem(tagName: string, text?: string): HTMLElement {
	let result = document.createElement(tagName);
	if (text !== undefined)
		result.textContent = text;
	return result;
}


// Returns a new DOM node like this: <span class="cls">text</span>
function createSpan(cls: string, text?: string): HTMLElement {
	let result = createElem("span", text);
	result.className = cls;
	return result;
}


// Polyfills, only valid for this application
if (!("sign" in Math))
	(Math as any).sign = (x: number): number => x > 0 ? 1 : (x < 0 ? -1 : 0);
if (!("from" in Array)) {
	(Array as any).from = function<E>(set: Set<E>): Array<E> {
		let result: Array<E> = [];
		set.forEach(obj => result.push(obj));
		return result;
	};
}
