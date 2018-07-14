/* 
 * Chemical equation balancer
 * 
 * Copyright (c) 2018 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/chemical-equation-balancer-javascript
 */

"use strict";


/*---- Main functions, which are the entry points from the HTML code ----*/

// Balances the given formula string and sets the HTML output on the page. Returns nothing.
function balance(formulaStr) {
	// Clear output
	setMessage("");
	const balancedElem = document.getElementById("balanced");
	const codeOutElem  = document.getElementById("codeOutput");
	clearChildren(balancedElem);
	clearChildren(codeOutElem);
	appendText(" ", codeOutElem);
	
	// Parse equation
	let eqn;
	try {
		eqn = parse(formulaStr);
	} catch (e) {
		if (typeof e == "string") {  // Simple error message string
			setMessage("Syntax error: " + e);
			
		} else if ("start" in e) {  // Error message object with start and possibly end character indices
			setMessage("Syntax error: " + e.message);
			
			let start = e.start;
			let end = "end" in e ? e.end : e.start;
			while (end > start && (formulaStr.charAt(end - 1) == " " || formulaStr.charAt(end - 1) == "\t"))
				end--;  // Adjust position to eliminate whitespace
			if (start == end)
				end++;
			
			appendText(formulaStr.substring(0, start), codeOutElem);
			let highlight = createElem("u");
			if (end <= formulaStr.length) {
				appendText(formulaStr.substring(start, end), highlight);
				codeOutElem.appendChild(highlight);
				appendText(formulaStr.substring(end, formulaStr.length), codeOutElem);
			} else {
				appendText(" ", highlight);
				codeOutElem.appendChild(highlight);
			}
			
		} else {
			setMessage("Assertion error");
		}
		return;
	}
	
	try {
		let matrix = buildMatrix(eqn);                // Set up matrix
		solve(matrix);                                // Solve linear system
		let coefs = extractCoefficients(matrix);      // Get coefficients
		checkAnswer(eqn, coefs);                      // Self-test, should not fail
		balancedElem.appendChild(eqn.toHtml(coefs));  // Display balanced equation
	} catch (e) {
		setMessage(e.toString());
	}
}


// Sets the input box to the given formula string and balances it. Returns nothing.
function demo(formulaStr) {
	document.getElementById("inputFormula").value = formulaStr;
	balance(formulaStr);
}


const RANDOM_DEMOS = [
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

let lastRandomIndex = -1;

function random() {
	let index;
	do {
		index = Math.floor(Math.random() * RANDOM_DEMOS.length);
		index = Math.max(Math.min(index, RANDOM_DEMOS.length - 1), 0);
	} while (RANDOM_DEMOS.length >= 2 && index == lastRandomIndex);
	lastRandomIndex = index;
	demo(RANDOM_DEMOS[index]);
}


/* Core number-processing fuctions */

// Returns a matrix based on the given equation object.
function buildMatrix(eqn) {
	let elems = eqn.getElements();
	let lhs = eqn.getLeftSide();
	let rhs = eqn.getRightSide();
	let matrix = new Matrix(elems.length + 1, lhs.length + rhs.length + 1);
	elems.forEach((elem, i) => {
		let j = 0;
		for (let k = 0; k < lhs.length; j++, k++)
			matrix.set(i, j,  lhs[k].countElement(elem));
		for (let k = 0; k < rhs.length; j++, k++)
			matrix.set(i, j, -rhs[k].countElement(elem));
	});
	return matrix;
}


function solve(matrix) {
	matrix.gaussJordanEliminate();
	
	// Find row with more than one non-zero coefficient
	let i;
	for (i = 0; i < matrix.rowCount() - 1; i++) {
		if (countNonzeroCoeffs(matrix, i) > 1)
			break;
	}
	if (i == matrix.rowCount() - 1)
		throw "All-zero solution";  // Unique solution with all coefficients zero
	
	// Add an inhomogeneous equation
	matrix.set(matrix.rowCount() - 1, i, 1);
	matrix.set(matrix.rowCount() - 1, matrix.columnCount() - 1, 1);
	
	matrix.gaussJordanEliminate();
}


function countNonzeroCoeffs(matrix, row) {
	let count = 0;
	for (let i = 0; i < matrix.columnCount(); i++) {
		if (matrix.get(row, i) != 0)
			count++;
	}
	return count;
}


function extractCoefficients(matrix) {
	const rows = matrix.rowCount();
	const cols = matrix.columnCount();
	
	if (cols - 1 > rows || matrix.get(cols - 2, cols - 2) == 0)
		throw "Multiple independent solutions";
	
	let lcm = 1;
	for (let i = 0; i < cols - 1; i++)
		lcm = checkedMultiply(lcm / gcd(lcm, matrix.get(i, i)), matrix.get(i, i));
	
	let coefs = [];
	let allzero = true;
	for (let i = 0; i < cols - 1; i++) {
		let coef = checkedMultiply(lcm / matrix.get(i, i), matrix.get(i, cols - 1));
		coefs.push(coef);
		allzero &= coef == 0;
	}
	if (allzero)
		throw "Assertion error: All-zero solution";
	return coefs;
}


// Throws an exception if there's a problem, otherwise returns silently.
function checkAnswer(eqn, coefs) {
	if (coefs.length != eqn.getLeftSide().length + eqn.getRightSide().length)
		throw "Assertion error: Mismatched length";
	
	let allzero = true;
	for (let coef of coefs) {
		if (typeof coef != "number" || isNaN(coef) || Math.floor(coef) != coef)
			throw "Assertion error: Not an integer";
		allzero &= coef == 0;
	}
	if (allzero)
		throw "Assertion error: All-zero solution";
	
	for (let elem of eqn.getElements()) {
		let sum = 0;
		let j = 0;
		for (let k = 0, lhs = eqn.getLeftSide() ; k < lhs.length; j++, k++)
			sum = checkedAdd(sum, checkedMultiply(lhs[k].countElement(elem),  coefs[j]));
		for (let k = 0, rhs = eqn.getRightSide(); k < rhs.length; j++, k++)
			sum = checkedAdd(sum, checkedMultiply(rhs[k].countElement(elem), -coefs[j]));
		if (sum != 0)
			throw "Assertion error: Incorrect balance";
	}
}


/*---- Chemical equation data types ----*/

// A complete chemical equation. It has a left-hand side list of terms and a right-hand side list of terms.
// For example: H2 + O2 -> H2O.
class Equation {
	private lhs: Array<Term>;
	private rhs: Array<Term>;
	
	public constructor(lhs, rhs) {
		// Make defensive copies
		this.lhs = lhs.slice();
		this.rhs = rhs.slice();
	}
	
	public getLeftSide () { return this.lhs.slice(); }
	public getRightSide() { return this.rhs.slice(); }
	
	// Returns an array of the names all of the elements used in this equation.
	// The array represents a set, so the items are in an arbitrary order and no item is repeated.
	public getElements() {
		let result = new Set();
		for (let item of this.lhs.concat(this.rhs))
			item.getElements(result);
		return Array.from(result);
	}
	
	// Returns an HTML element representing this equation.
	// 'coefs' is an optional argument, which is an array of coefficients to match with the terms.
	public toHtml(coefs) {
		if (coefs !== undefined && coefs.length != this.lhs.length + this.rhs.length)
			throw "Mismatched number of coefficients";
		
		// Creates this kind of DOM node: <span class="className">text</span>
		function createSpan(text, className) {
			let span = createElem("span", text);
			span.className = className;
			return span;
		}
		
		let node = createElem("span");
		
		let j = 0;
		function termsToHtml(terms) {
			let head = true;
			for (let term of terms) {
				let coef = coefs !== undefined ? coefs[j] : 1;
				if (coef != 0) {
					if (head) head = false;
					else node.appendChild(createSpan(" + ", "plus"));
					if (coef != 1)
						node.appendChild(createSpan(coef.toString().replace(/-/, MINUS), "coefficient"));
					node.appendChild(term.toHtml());
				}
				j++;
			}
		}
		
		termsToHtml(this.lhs);
		node.appendChild(createSpan(" " + RIGHT_ARROW + " ", "rightarrow"));
		termsToHtml(this.rhs);
		
		return node;
	}
}


// A term in a chemical equation. It has a list of groups or elements, and a charge.
// For example: H3O^+, or e^-.
class Term {
	private items: Array<ChemElem|Group>;
	private charge: number;
	
	public constructor(items, charge) {
		if (items.length == 0 && charge != -1)
			throw "Invalid term";  // Electron case
		this.items = items.slice();
		this.charge = charge;
	}
	
	public getItems() { return this.items.slice(); }
	
	public getElements(resultSet) {
		resultSet.add("e");
		for (let item of this.items)
			item.getElements(resultSet);
	}
	
	// Counts the number of times the given element (specified as a string) occurs in this term, taking groups and counts into account, returning an integer.
	public countElement(name) {
		if (name == "e") {
			return -this.charge;
		} else {
			let sum = 0;
			for (let item of this.items)
				sum = checkedAdd(sum, item.countElement(name));
			return sum;
		}
	}
	
	// Returns an HTML element representing this term.
	public toHtml() {
		let node = createElem("span");
		if (this.items.length == 0 && this.charge == -1) {
			appendText("e", node);
			node.appendChild(createElem("sup", MINUS));
		} else {
			for (let item of this.items)
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
	
	public constructor(items, count) {
		if (count < 1)
			throw "Assertion error: Count must be a positive integer";
		this.items = items.slice();
		this.count = count;
	}
	
	public getItems() { return this.items.slice(); }
	
	public getCount() { return this.count; }
	
	public getElements(resultSet) {
		for (let item of this.items)
			item.getElements(resultSet);
	}
	
	public countElement(name) {
		let sum = 0;
		for (let item of this.items)
			sum = checkedAdd(sum, checkedMultiply(item.countElement(name), this.count));
		return sum;
	}
	
	// Returns an HTML element representing this group.
	public toHtml() {
		let node = createElem("span");
		appendText("(", node);
		for (let item of this.items)
			node.appendChild(item.toHtml());
		appendText(")", node);
		if (this.count != 1)
			node.appendChild(createElem("sub", this.count.toString()));
		return node;
	}
}


// A chemical element.
// For example: Na, F2, Ace, Uuq6
class ChemElem {
	private name: string;
	private count: number;
	
	public constructor(name, count) {
		if (count < 1)
			throw "Assertion error: Count must be a positive integer";
		this.name = name;
		this.count = count;
	}
	
	public getName() { return this.name; }
	
	public getCount() { return this.count; }
	
	public getElements(resultSet) { resultSet.add(this.name); }
	
	public countElement(n) { return n == this.name ? this.count : 0; }
	
	// Returns an HTML element representing this element.
	public toHtml() {
		let node = createElem("span", this.name);
		if (this.count != 1)
			node.appendChild(createElem("sub", this.count.toString()));
		return node;
	}
}


/*---- Parser functions ----*/

// Parses the given formula string and returns an equation object, or throws an exception.
function parse(formulaStr) {
	let tokenizer = new Tokenizer(formulaStr);
	return parseEquation(tokenizer);
}


// Parses and returns an equation.
function parseEquation(tok) {
	let lhs = [parseTerm(tok)];
	while (true) {
		let next = tok.peek();
		if (next == "=") {
			tok.consume("=");
			break;
		} else if (next == null) {
			throw {message: "Plus or equal sign expected", start: tok.position()};
		} else if (next == "+") {
			tok.consume("+");
			lhs.push(parseTerm(tok));
		} else
			throw {message: "Plus expected", start: tok.position()};
	}
	
	let rhs = [parseTerm(tok)];
	while (true) {
		let next = tok.peek();
		if (next == null)
			break;
		else if (next == "+") {
			tok.consume("+");
			rhs.push(parseTerm(tok));
		} else
			throw {message: "Plus or end expected", start: tok.position()};
	}
	
	return new Equation(lhs, rhs);
}


// Parses and returns a term.
function parseTerm(tok) {
	let startPosition = tok.position();
	
	// Parse groups and elements
	let items = [];
	while (true) {
		let next = tok.peek();
		if (next == null)
			break;
		else if (next == "(")
			items.push(parseGroup(tok));
		else if (/^[A-Za-z][a-z]*$/.test(next))
			items.push(parseElement(tok));
		else
			break;
	}
	
	// Parse optional charge
	let charge = 0;
	let next = tok.peek();
	if (next != null && next == "^") {
		tok.consume("^");
		next = tok.peek();
		if (next == null)
			throw {message: "Number or sign expected", start: tok.position()};
		else
			charge = parseOptionalNumber(tok);
		
		next = tok.peek();
		if (next == "+")
			charge = +charge;  // No-op
		else if (next == "-")
			charge = -charge;
		else
			throw {message: "Sign expected", start: tok.position()};
		tok.take();  // Consume the sign
	}
	
	// Check if term is valid
	let elems = new Set();
	for (let item of items)
		item.getElements(elems);
	elems = Array.from(elems);  // List of all elements used in this term, with no repeats
	if (items.length == 0) {
		throw {message: "Invalid term - empty", start: startPosition, end: tok.position()};
	} else if (elems.indexOf("e") != -1) {  // If it's the special electron element
		if (items.length > 1)
			throw {message: "Invalid term - electron needs to stand alone", start: startPosition, end: tok.position()};
		else if (charge != 0 && charge != -1)
			throw {message: "Invalid term - invalid charge for electron", start: startPosition, end: tok.position()};
		// Tweak data
		items = [];
		charge = -1;
	} else {  // Otherwise, a term must not contain an element that starts with lowercase
		for (let elem of elems) {
			if (/^[a-z]+$/.test(elem))
				throw {message: 'Invalid element name "' + elem + '"', start: startPosition, end: tok.position()};
		}
	}
	
	return new Term(items, charge);
}


// Parses and returns a group.
function parseGroup(tok) {
	let startPosition = tok.position();
	tok.consume("(");
	let items = [];
	while (true) {
		let next = tok.peek();
		if (next == null)
			throw {message: "Element, group, or closing parenthesis expected", start: tok.position()};
		else if (next == "(")
			items.push(parseGroup(tok));
		else if (/^[A-Za-z][a-z]*$/.test(next))
			items.push(parseElement(tok));
		else if (next == ")") {
			tok.consume(")");
			if (items.length == 0)
				throw {message: "Empty group", start: startPosition, end: tok.position()};
			break;
		} else
			throw {message: "Element, group, or closing parenthesis expected", start: tok.position()};
	}
	
	return new Group(items, parseOptionalNumber(tok));
}


// Parses and returns an element.
function parseElement(tok) {
	let name = tok.take();
	if (!/^[A-Za-z][a-z]*$/.test(name))
		throw "Assertion error";
	return new ChemElem(name, parseOptionalNumber(tok));
}


// Parses a number if it's the next token, returning a non-negative integer, with a default of 1.
function parseOptionalNumber(tok) {
	let next = tok.peek();
	if (next != null && /^[0-9]+$/.test(next))
		return checkedParseInt(tok.take());
	else
		return 1;
}


/*---- Tokenizer object ----*/

// Tokenizes a formula into a stream of token strings.
class Tokenizer {
	private str: string;
	private i: number;
	
	public constructor(str) {
		this.str = str.replace(/\u2212/g, "-");
		this.i = 0;
		this.skipSpaces();
	}
	
	// Returns the index of the next character to tokenize.
	public position() {
		return this.i;
	}
	
	// Returns the next token as a string, or null if the end of the token stream is reached.
	public peek() {
		if (this.i == this.str.length)  // End of stream
			return null;
		
		let match = /^([A-Za-z][a-z]*|[0-9]+|[+\-^=()])/.exec(this.str.substring(this.i));
		if (match == null)
			throw {message: "Invalid symbol", start: this.i};
		return match[0];
	}
	
	// Returns the next token as a string and advances this tokenizer past the token.
	public take() {
		let result = this.peek();
		if (result == null)
			throw "Advancing beyond last token";
		this.i += result.length;
		this.skipSpaces();
		return result;
	}
	
	// Takes the next token and checks that it matches the given string, or throws an exception.
	public consume(s) {
		if (this.take() != s)
			throw "Token mismatch";
	}
	
	private skipSpaces() {
		let match = /^[ \t]*/.exec(this.str.substring(this.i));
		this.i += match[0].length;
	}
}


/*---- Matrix object ----*/

// A matrix of integers.
class Matrix {
	private rows: number;
	private cols: number;
	private cells: Array<Array<number>>;
	
	public constructor(rows, cols) {
		if (rows < 0 || cols < 0)
			throw "Illegal argument";
		this.rows = rows;
		this.cols = cols;
		
		// Initialize with zeros
		let row = [];
		for (let j = 0; j < cols; j++)
			row.push(0);
		this.cells = [];  // Main data (the matrix)
		for (let i = 0; i < rows; i++)
			this.cells.push(row.slice());
	}
	
	/* Accessor functions */
	
	public rowCount() { return this.rows; }
	public columnCount() { return this.cols; }
	
	// Returns the value of the given cell in the matrix, where r is the row and c is the column.
	public get(r, c) {
		if (r < 0 || r >= this.rows || c < 0 || c >= this.cols)
			throw "Index out of bounds";
		return this.cells[r][c];
	}
	
	// Sets the given cell in the matrix to the given value, where r is the row and c is the column.
	public set(r, c, val) {
		if (r < 0 || r >= this.rows || c < 0 || c >= this.cols)
			throw "Index out of bounds";
		this.cells[r][c] = val;
	}
	
	/* Private helper functions for gaussJordanEliminate() */
	
	// Swaps the two rows of the given indices in this matrix. The degenerate case of i == j is allowed.
	private swapRows(i, j) {
		if (i < 0 || i >= this.rows || j < 0 || j >= this.rows)
			throw "Index out of bounds";
		let temp = this.cells[i];
		this.cells[i] = this.cells[j];
		this.cells[j] = temp;
	}
	
	// Returns a new row that is the sum of the two given rows. The rows are not indices.
	// For example, addRow([3, 1, 4], [1, 5, 6]) = [4, 6, 10].
	private static addRows(x, y) {
		let z = [];
		for (let i = 0; i < x.length; i++)
			z.push(checkedAdd(x[i], y[i]));
		return z;
	}
	
	// Returns a new row that is the product of the given row with the given scalar. The row is is not an index.
	// For example, multiplyRow([0, 1, 3], 4) = [0, 4, 12].
	private static multiplyRow(x, c) {
		return x.map(val =>
			checkedMultiply(val, c));
	}
	
	// Returns the GCD of all the numbers in the given row. The row is is not an index.
	// For example, gcdRow([3, 6, 9, 12]) = 3.
	private static gcdRow(x) {
		let result = 0;
		for (let val of x)
			result = gcd(val, result);
		return result;
	}
	
	// Returns a new row where the leading non-zero number (if any) is positive, and the GCD of the row is 0 or 1.
	// For example, simplifyRow([0, -2, 2, 4]) = [0, 1, -1, -2].
	private static simplifyRow(x) {
		let sign = 0;
		for (let val of x) {
			if (val != 0) {
				sign = Math.sign(val);
				break;
			}
		}
		if (sign == 0)
			return x.slice();
		let g = Matrix.gcdRow(x) * sign;
		return x.map(val => val / g);
	}
	
	// Changes this matrix to reduced row echelon form (RREF), except that each leading coefficient is not necessarily 1. Each row is simplified.
	public gaussJordanEliminate() {
		// Simplify all rows
		let cells = this.cells = this.cells.map(Matrix.simplifyRow);
		
		// Compute row echelon form (REF)
		let numPivots = 0;
		for (let i = 0; i < this.cols; i++) {
			// Find pivot
			let pivotRow = numPivots;
			while (pivotRow < this.rows && cells[pivotRow][i] == 0)
				pivotRow++;
			if (pivotRow == this.rows)
				continue;
			let pivot = cells[pivotRow][i];
			this.swapRows(numPivots, pivotRow);
			numPivots++;
			
			// Eliminate below
			for (let j = numPivots; j < this.rows; j++) {
				let g = gcd(pivot, cells[j][i]);
				cells[j] = Matrix.simplifyRow(Matrix.addRows(Matrix.multiplyRow(cells[j], pivot / g), Matrix.multiplyRow(cells[i], -cells[j][i] / g)));
			}
		}
		
		// Compute reduced row echelon form (RREF), but the leading coefficient need not be 1
		for (let i = this.rows - 1; i >= 0; i--) {
			// Find pivot
			let pivotCol = 0;
			while (pivotCol < this.cols && cells[i][pivotCol] == 0)
				pivotCol++;
			if (pivotCol == this.cols)
				continue;
			let pivot = cells[i][pivotCol];
			
			// Eliminate above
			for (let j = i - 1; j >= 0; j--) {
				let g = gcd(pivot, cells[j][pivotCol]);
				cells[j] = Matrix.simplifyRow(Matrix.addRows(Matrix.multiplyRow(cells[j], pivot / g), Matrix.multiplyRow(cells[i], -cells[j][pivotCol] / g)));
			}
		}
	}
	
	// Returns a string representation of this matrix, for debugging purposes.
	public toString() {
		let result = "[";
		this.cells.forEach((row, i) => {
			if (i > 0)
				result += ",\n ";
			result += "[" + row.join(", ") + "]";
		});
		return result + "]";
	}
}


/*---- Math functions (especially checked integer operations) ----*/

const INT_MAX = 9007199254740992;  // 2^53

// Returns the given string parsed into a number, or throws an exception if the result is too large.
function checkedParseInt(str) {
	let result = parseInt(str, 10);
	if (isNaN(result))
		throw "Not a number";
	if (result <= -INT_MAX || result >= INT_MAX)
		throw "Arithmetic overflow";
	return result;
}

// Returns the sum of the given integers, or throws an exception if the result is too large.
function checkedAdd(x, y) {
	let z = x + y;
	if (z <= -INT_MAX || z >= INT_MAX)
		throw "Arithmetic overflow";
	return z;
}

// Returns the product of the given integers, or throws an exception if the result is too large.
function checkedMultiply(x, y) {
	let z = x * y;
	if (z <= -INT_MAX || z >= INT_MAX)
		throw "Arithmetic overflow";
	return z;
}


// Returns the greatest common divisor of the given integers.
function gcd(x, y) {
	if (typeof x != "number" || typeof y != "number" || isNaN(x) || isNaN(y))
		throw "Invalid argument";
	x = Math.abs(x);
	y = Math.abs(y);
	while (y != 0) {
		let z = x % y;
		x = y;
		y = z;
	}
	return x;
}


/*---- Miscellaneous ----*/

// Unicode character constants (because this script file's character encoding is unspecified)
const MINUS = "\u2212";        // Minus sign
const RIGHT_ARROW = "\u2192";  // Right arrow


// Sets the page's message element to the given string. Returns nothing.
function setMessage(str) {
	document.getElementById("message").textContent = str;
}


function createElem(tagName, text) {
	let result = document.createElement(tagName);
	if (text !== undefined)
		result.textContent = text;
	return result;
}


// Removes all the children of the given DOM node. Returns nothing.
function clearChildren(node) {
	while (node.firstChild != null)
		node.removeChild(node.firstChild);
}


// Creates a new text node with the given text and appends it to the given DOM node. Returns nothing.
function appendText(text, node) {
	node.appendChild(document.createTextNode(text));
}
