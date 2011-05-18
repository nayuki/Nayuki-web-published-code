/* Main functions, which are entry points from the HTML code */

function balance() {
	// Clear output
	var messageElem = document.getElementById("message");
	removeAllChildren(messageElem);
	var balancedElem = document.getElementById("balanced");
	removeAllChildren(balancedElem);
	
	try {
		var eqn = parse();  // Parse equation
		var matrix = buildMatrix(eqn);  // Set up matrix
		matrix.gaussJordanEliminate();  // Solve linear system
		var coefs = extractCoefficients(matrix);  // Get coefficients
		checkAnswer(eqn, coefs);
		balancedElem.appendChild(eqn.toHtml(coefs));  // Display balanced equation
	} catch (e) {
		messageElem.appendChild(document.createTextNode(e.toString()));
	}
}


function show(str) {
	document.getElementById("input").value = str;
	balance();
}


/* Main processing fuctions */

function parse() {
	var input = document.getElementById("input").value;
	var tokenizer = new Tokenizer(input);
	return parseEquation(tokenizer);
}


function buildMatrix(eqn) {
	var elems = eqn.getElements();
	var rows = elems.length + 1;
	var cols = eqn.getLeftSide().length + eqn.getRightSide().length + 1;
	var matrix = new Matrix(rows, cols);
	for (var i = 0; i < elems.length; i++) {
		var j = 0;
		for (var k = 0, lhs = eqn.getLeftSide() ; k < lhs.length; j++, k++)
			matrix.set(i, j,  lhs[k].countElement(elems[i]));
		for (var k = 0, rhs = eqn.getRightSide(); k < rhs.length; j++, k++)
			matrix.set(i, j, -rhs[k].countElement(elems[i]));
	}
	
	// Add an inhomogeneous equation
	matrix.set(rows - 1, 0, 1);
	matrix.set(rows - 1, cols - 1, 1);
	
	return matrix;
}


function extractCoefficients(matrix) {
	var rows = matrix.rowCount();
	var cols = matrix.columnCount();
	
	if (cols - 1 > rows || matrix.get(cols - 2, cols - 2) == 0)
		throw "No unique solution";
	
	var lcm = 1;
	for (var i = 0; i < cols - 1; i++)
		lcm = checkedMultiply(lcm / gcd(lcm, matrix.get(i, i)), matrix.get(i, i));
	
	var coefs = [];
	var allzero = true;
	for (var i = 0; i < cols - 1; i++) {
		var coef = checkedMultiply(lcm / matrix.get(i, i), matrix.get(i, cols - 1));
		coefs.push(coef);
		allzero &= coef == 0;
	}
	if (allzero)
		throw "No solution";  // Unique solution with all coefficients zero
	return coefs;
}


// Throws an exception if there's a problem, otherwise returns silently.
function checkAnswer(eqn, coefs) {
	if (coefs.length != eqn.getLeftSide().length + eqn.getRightSide().length)
		throw "Assertion error: Mismatched length";
	
	var allzero = true;
	for (var i = 0; i < coefs.length; i++) {
		var coef = coefs[i];
		if (typeof coef != "number" || isNaN(coef) || Math.floor(coef) != coef)
			throw "Assertion error: Not an integer";
		allzero &= coef == 0;
	}
	if (allzero)
		throw "Assertion error: Solution of all zeros";
	
	var elems = eqn.getElements();
	for (var i = 0; i < elems.length; i++) {
		var sum = 0;
		var j = 0;
		for (var k = 0, lhs = eqn.getLeftSide() ; k < lhs.length; j++, k++)
			sum = checkedAdd(sum, checkedMultiply(lhs[k].countElement(elems[i]),  coefs[j]));
		for (var k = 0, rhs = eqn.getRightSide(); k < rhs.length; j++, k++)
			sum = checkedAdd(sum, checkedMultiply(rhs[k].countElement(elems[i]), -coefs[j]));
		if (sum != 0)
			throw "Assertion error: Balance failed";
	}
}


/* Chemical equation representation */

// A complete chemical equation. It has a left-hand side list of terms, and a right-hand side list of terms.
// For example: H2 + O2 -> H2O.
function Equation(lhs, rhs) {
	lhs = lhs.slice(0);  // Defensive copy
	rhs = rhs.slice(0);  // Defensive copy
	
	this.getLeftSide  = function() { return lhs.slice(0); }  // Defensive copy
	this.getRightSide = function() { return rhs.slice(0); }  // Defensive copy
	
	// Returns an array of the names all of the elements used in this equation.
	// The array represents a set, so the items are in an arbitrary order and no item is repeated.
	this.getElements = function() {
		var result = new Set();
		for (var i = 0; i < lhs.length; i++)
			lhs[i].getElements(result);
		for (var i = 0; i < rhs.length; i++)
			rhs[i].getElements(result);
		return result.toArray();
	}
	
	// Returns an HTML element representing this equation.
	// 'coefs' is an optional argument, which is a list of coefficients to match with the terms.
	this.toHtml = function(coefs) {
		if (coefs !== undefined && coefs.length != lhs.length + rhs.length)
			throw "Mismatched number of coefficients";
		var node = document.createElement("span");
		
		var initial = true;
		for (var i = 0; i < lhs.length; i++) {
			var coef = coefs !== undefined ? coefs[i] : 1;
			if (coef != 0) {
			if (initial) initial = false;
			else node.appendChild(document.createTextNode(" + "));
				if (coef != 1)
					node.appendChild(document.createTextNode(coef.toString().replace(/-/, MINUS)));
				node.appendChild(lhs[i].toHtml());
			}
		}
		
		node.appendChild(document.createTextNode(" \u2192 "));
		
		initial = true;
		for (var i = 0; i < rhs.length; i++) {
			var coef = coefs !== undefined ? coefs[lhs.length + i] : 1;
			if (coef != 0) {
			if (initial) initial = false;
			else node.appendChild(document.createTextNode(" + "));
				if (coef != 1)
					node.appendChild(document.createTextNode(coef.toString().replace(/-/, MINUS)));
				node.appendChild(rhs[i].toHtml());
			}
		}
		return node;
	}
}


// A term in a chemical equation. It has a list of groups or elements, and a charge.
// For example: H3O^+, or e^-.
function Term(items, charge) {
	if (items.length == 0 && charge != -1)
		throw "Invalid term";
	items = items.slice(0);  // Defensive copy
	
	this.getItems = function() { return items.slice(0); }  // Defensive copy
	
	this.getElements = function(result) {
		result.add("e");
		for (var i = 0; i < items.length; i++)
			items[i].getElements(result);
	}
	
	this.countElement = function(name) {
		if (name == "e") {
			return -charge;
		} else {
			var sum = 0;
			for (var i = 0; i < items.length; i++)
				sum = checkedAdd(sum, items[i].countElement(name));
			return sum;
		}
	}
	
	this.toHtml = function() {
		var node = document.createElement("span");
		if (items.length == 0 && charge == -1) {
			node.appendChild(document.createTextNode("e"));
			var sup = document.createElement("sup");
			sup.appendChild(document.createTextNode(MINUS));
			node.appendChild(sup);
		} else {
			for (var i = 0; i < items.length; i++)
				node.appendChild(items[i].toHtml());
			if (charge != 0) {
				var sup = document.createElement("sup");
				var s;
				if (Math.abs(charge) == 1) s = "";
				else s = Math.abs(charge).toString();
				if (charge > 0) s += "+";
				else s += MINUS;
				sup.appendChild(document.createTextNode(s));
				node.appendChild(sup);
			}
		}
		return node;
	}
}


// A group in a term. It has a list of groups or elements.
// For example: (OH)3
function Group(items, count) {
	if (count < 1)
		throw "Count must be a positive integer";
	items = items.slice(0);  // Defensive copy
	
	this.getItems = function() { return items.slice(0); }  // Defensive copy
	
	this.getCount = function() { return count; }
	
	this.getElements = function(result) {
		for (var i = 0; i < items.length; i++)
			items[i].getElements(result);
	}
	
	this.countElement = function(name) {
		var sum = 0;
		for (var i = 0; i < items.length; i++)
			sum = checkedAdd(sum, checkedMultiply(items[i].countElement(name), count));
		return sum;
	}
	
	this.toHtml = function() {
		var node = document.createElement("span");
		node.appendChild(document.createTextNode("("));
		for (var i = 0; i < items.length; i++)
			node.appendChild(items[i].toHtml());
		node.appendChild(document.createTextNode(")"));
		if (count != 1) {
			var sub = document.createElement("sub");
			sub.appendChild(document.createTextNode(count.toString()));
			node.appendChild(sub);
		}
		return node;
	}
}


// A chemical element.
// For example: N2, Uuq6, Ace
function Element(name, count) {
	if (count < 1)
		throw "Count must be a positive integer";
	
	this.getName = function() { return name; }
	
	this.getCount = function() { return count; }
	
	this.getElements = function(result) { result.add(name); }
	
	this.countElement = function(n) { return n == name ? count : 0; }
	
	this.toHtml = function() {
		var node = document.createElement("span");
		node.appendChild(document.createTextNode(name));
		if (count != 1) {
			var sub = document.createElement("sub");
			sub.appendChild(document.createTextNode(count.toString()));
			node.appendChild(sub);
		}
		return node;
	}
}


/* Parser functions */

function parseEquation(tok) {
	var lhs = [];
	var rhs = [];
	
	lhs.push(parseTerm(tok));
	while (true) {
		var next = tok.peek();
		if (next == "=")
			break;
		if (next == null)
			throw "Equal sign expected";
		if (tok.take() != "+")
			throw "Plus expected";
		lhs.push(parseTerm(tok));
	}
	
	if (tok.take() != "=")
		throw "Assertion error";
	
	rhs.push(parseTerm(tok));
	while (true) {
		var next = tok.peek();
		if (next == null)
			break;
		if (tok.take() != "+")
			throw "Plus expected";
		rhs.push(parseTerm(tok));
	}
	
	return new Equation(lhs, rhs);
}


function parseTerm(tok) {
	var items = [];
	while (true) {
		var next = tok.peek();
		if (next == null)
			break;
		else if (next == "(")
			items.push(parseGroup(tok));
		else if (/^[A-Za-z][a-z]*$/.test(next))
			items.push(parseElement(tok));
		else
			break;
	}
	
	var charge = 0;
	var next = tok.peek();
	if (next != null && next == "^") {
		tok.take();  // Consume "^"
		next = tok.take();
		if (next == null)
			throw "Number or sign expected";
		else if (/^[0-9]+$/.test(next)) {
			charge = checkedParseInt(next, 10);
			next = tok.take();
		} else
			charge = 1;
		
		if (next == null)
			throw "Sign expected";
		else if (next == "+");  // Charge is positive, do nothing
		else if (next == "-")
			charge = -charge;
		else
			throw "Sign expected";
	}
	
	var elems = new Set();
	for (var i = 0; i < items.length; i++)
		items[i].getElements(elems);
	elems = elems.toArray();
	if (elems.indexOf("e") != -1) {
		if (elems.length > 1 || !(charge == 0 || charge == -1))
			throw "Invalid term";
		items = [];
		charge = -1;
	} else {
		for (var i = 0; i < elems.length; i++) {
			if (/^[a-z]+$/.test(elems[i]))
				throw "Invalid element";
		}
	}
	
	return new Term(items, charge);
}


function parseGroup(tok) {
	if (tok.take() != "(")
		throw "Assertion error";
	
	var items = [];
	while (true) {
		var next = tok.peek();
		if (next == null)
			throw "Element, group, or closing parenthesis expected";
		else if (next == "(")
			items.push(parseGroup(tok));
		else if (/^[A-Za-z][a-z]*$/.test(next))
			items.push(parseElement(tok));
		else if (next == ")")
			break;
		else
			throw "Element, group, or closing parenthesis expected";
	}
	
	if (tok.take() != ")")
		throw "Assertion error";
	
	var count = 1;
	var next = tok.peek();
	if (next != null && /^[0-9]+$/.test(next))
		count = checkedParseInt(tok.take(), 10);
	return new Group(items, count);
}


function parseElement(tok) {
	var name = tok.take();
	if (!/^[A-Za-z][a-z]*$/.test(name))
		throw "Assertion error";
	var next = tok.peek();
	var count = 1;
	if (next != null && /^[0-9]+$/.test(next))
		count = checkedParseInt(tok.take(), 10);
	return new Element(name, count);
}


/* Tokenizer object */

function Tokenizer(str) {
	var i = 0;
	
	this.getPosition = function() {
		return i;
	}
	
	this.peek = function() {
		if (i == str.length)
			return null;  // End of stream
		
		var match = /^([A-Za-z][a-z]*|[0-9]+| +|[+\-^=()])/.exec(str.substring(i));
		if (match == null)
			throw "Syntax error";
		
		var token = match[0];
		if (/^ +$/.test(token)) {  // Skip whitespace token
			i += token.length;
			token = this.peek();
		}
		return token;
	}
	
	this.take = function() {
		var result = this.peek();
		i += result.length;
		return result;
	}
}


/* Matrix object */

function Matrix(rows, cols) {
	// Initialize with zeros
	var cells = [];
	for (var i = 0; i < rows; i++) {
		var row = [];
		for (var j = 0; j < cols; j++)
			row.push(0);
		cells.push(row);
	}
	
	this.rowCount = function() { return rows; }
	this.columnCount = function() { return cols; }
	
	// Returns the value of the given cell in the matrix, where i is the row and j is the column.
	this.get = function(r, c) {
		if (r < 0 || r >= rows || c < 0 || c >= cols)
			throw "Index out of bounds";
		return cells[r][c];
	}
	
	// Sets the given cell in the matrix to the given value, where i is the row and j is the column.
	this.set = function(r, c, val) {
		if (r < 0 || r >= rows || c < 0 || c >= cols)
			throw "Index out of bounds";
		cells[r][c] = val;
	}
	
	// Swaps the two rows of the given indices in this matrix. Having i == j is allowed.
	function swapRows(i, j) {
		if (i < 0 || i >= rows || j < 0 || j >= rows)
			throw "Index out of bounds";
		var temp = cells[i];
		cells[i] = cells[j];
		cells[j] = temp;
	}
	
	// Returns a new row that is the product of the two given rows.
	// For example, addRow([3, 1, 4], [1, 5, 6]) = [4, 6, 10].
	function addRows(x, y) {
		var z = x.slice(0);
		for (var i = 0; i < z.length; i++)
			z[i] = checkedAdd(x[i], y[i]);
		return z;
	}
	
	// Returns a new row that is the product of the given row with the given scalar.
	// For example, multiplyRow([0, 1, 3], 4) = [0, 4, 12].
	function multiplyRow(x, c) {
		var y = x.slice(0);
		for (var i = 0; i < y.length; i++)
			y[i] = checkedMultiply(x[i], c);
		return y;
	}
	
	// Returns the GCD of all the numbers in the given row.
	// For example, gcdRow([3, 6, 9, 12]) = 3.
	function gcdRow(x) {
		var result = 0;
		for (var i = 0; i < x.length; i++)
			result = gcd(x[i], result);
		return result;
	}
	
	// Returns a new row where the leading non-zero number (if any) is positive, and the GCD of the row is 0 or 1.
	// For example, simplifyRow([0, -2, 2, 4]) = [0, 1, -1, -2].
	function simplifyRow(x) {
		var sign = 0;
		for (var i = 0; i < x.length; i++) {
			if (x[i] > 0) {
				sign = 1;
				break;
			} else if (x[i] < 0) {
				sign = -1;
				break;
			}
		}
		var y = x.slice(0);
		if (sign == 0)
			return y;
		var g = gcdRow(x) * sign;
		for (var i = 0; i < y.length; i++)
			y[i] /= g;
		return y;
	}
	
	// Changes this matrix to reduced row echelon form, except that each leading coefficient is not necessarily 1. Each row is simplified.
	this.gaussJordanEliminate = function() {
		// Simplify all rows
		for (var i = 0; i < rows; i++)
			cells[i] = simplifyRow(cells[i]);
		
		// Compute row echelon form (REF)
		var numPivots = 0;
		for (var i = 0; i < cols; i++) {
			// Find pivot
			var pivotRow = numPivots;
			while (pivotRow < rows && cells[pivotRow][i] == 0)
				pivotRow++;
			if (pivotRow == rows)
				continue;
			var pivot = cells[pivotRow][i];
			swapRows(numPivots, pivotRow);
			numPivots++;
			
			// Eliminate below
			for (var j = numPivots; j < rows; j++) {
				var g = gcd(pivot, cells[j][i]);
				cells[j] = simplifyRow(addRows(multiplyRow(cells[j], pivot / g), multiplyRow(cells[i], -cells[j][i] / g)));
			}
		}
		
		// Compute reduced row echelon form (RREF), but the leading coefficient need not be 1
		for (var i = rows - 1; i >= 0; i--) {
			// Find pivot
			var pivotCol = 0;
			while (pivotCol < cols && cells[i][pivotCol] == 0)
				pivotCol++;
			if (pivotCol == cols)
				continue;
			var pivot = cells[i][pivotCol];
			
			// Eliminate above
			for (var j = i - 1; j >= 0; j--) {
				var g = gcd(pivot, cells[j][pivotCol]);
				cells[j] = simplifyRow(addRows(multiplyRow(cells[j], pivot / g), multiplyRow(cells[i], -cells[j][pivotCol] / g)));
			}
		}
	}
	
	// Returns a string representation of this matrix, for debugging purposes.
	this.toString = function() {
		var result = "[";
		for (var i = 0; i < rows; i++) {
			if (i != 0) result += "],\n";
			result += "[";
			for (var j = 0; j < cols; j++) {
				if (j != 0) result += ", ";
				result += cells[i][j];
			}
			result += "]";
		}
		return result + "]";
	}
}


/* Set object */

function Set() {
	var items = [];
	this.add = function(obj) { if (items.indexOf(obj) == -1) items.push(obj); }
	this.contains = function(obj) { return items.indexOf(obj) != -1; }
	this.toArray = function() { return items.slice(0); }  // Defensive copy
}


/* Math functions, miscellaneous */

var MINUS = "\u2212";

var INT_MAX = 9007199254740992;  // 2^53

function checkedParseInt(str) {
	var result = parseInt(str, 10);
	if (isNaN(result))
		throw "Not a number";
	if (result <= -INT_MAX || result >= INT_MAX)
		throw "Arithmetic overflow";
	return result;
}

function checkedAdd(x, y) {
	var z = x + y;
	if (z <= -INT_MAX || z >= INT_MAX)
		throw "Arithmetic overflow";
	return z;
}

function checkedMultiply(x, y) {
	var z = x * y;
	if (z <= -INT_MAX || z >= INT_MAX)
		throw "Arithmetic overflow";
	return z;
}


function gcd(x, y) {
	if (typeof x != "number" || typeof y != "number" || isNaN(x) || isNaN(y))
		throw "Invalid argument";
	x = Math.abs(x);
	y = Math.abs(y);
	while (y != 0) {
		var z = x % y;
		x = y;
		y = z;
	}
	return x;
}


function removeAllChildren(node) {
	while (node.childNodes.length > 0)
		node.removeChild(node.firstChild);
}
