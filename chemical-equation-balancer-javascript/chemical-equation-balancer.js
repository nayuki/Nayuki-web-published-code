/*
 * Chemical equation balancer (compiled from TypeScript)
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
    var msgElem = document.getElementById("message");
    var balancedElem = document.getElementById("balanced");
    var codeOutElem = document.getElementById("codeOutput");
    msgElem.textContent = "";
    clearChildren(balancedElem);
    clearChildren(codeOutElem);
    codeOutElem.textContent = " ";
    // Parse equation
    var eqn;
    try {
        eqn = new Parser(formulaStr).parseEquation();
    }
    catch (e) {
        if (typeof e == "string") { // Simple error message string
            msgElem.textContent = "Syntax error: " + e;
        }
        else if ("start" in e) { // Error message object with start and possibly end character indices
            msgElem.textContent = "Syntax error: " + e.message;
            var start = e.start;
            var end = "end" in e ? e.end : e.start;
            while (end > start && [" ", "\t"].indexOf(formulaStr.charAt(end - 1)) != -1)
                end--; // Adjust position to eliminate whitespace
            if (start == end)
                end++;
            codeOutElem.textContent += formulaStr.substr(0, start);
            if (end <= formulaStr.length) {
                codeOutElem.appendChild(createElem("u", formulaStr.substring(start, end)));
                codeOutElem.appendChild(document.createTextNode(formulaStr.substring(end, formulaStr.length)));
            }
            else
                codeOutElem.appendChild(createElem("u", " "));
        }
        else {
            msgElem.textContent = "Assertion error";
        }
        return;
    }
    try {
        var matrix = buildMatrix(eqn); // Set up matrix
        solve(matrix); // Solve linear system
        var coefs = extractCoefficients(matrix); // Get coefficients
        checkAnswer(eqn, coefs); // Self-test, should not fail
        balancedElem.appendChild(eqn.toHtml(coefs)); // Display balanced equation
    }
    catch (e) {
        msgElem.textContent = e.toString();
    }
}
// Sets the input box to the given formula string and balances it. Returns nothing.
function demo(formulaStr) {
    document.getElementById("inputFormula").value = formulaStr;
    balance(formulaStr);
}
var RANDOM_DEMOS = [
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
var lastRandomIndex = -1;
function random() {
    var index;
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
    var elems = eqn.getElements();
    var lhs = eqn.getLeftSide();
    var rhs = eqn.getRightSide();
    var matrix = new Matrix(elems.length + 1, lhs.length + rhs.length + 1);
    elems.forEach(function (elem, i) {
        var j = 0;
        for (var _i = 0, lhs_1 = lhs; _i < lhs_1.length; _i++) {
            var term = lhs_1[_i];
            matrix.set(i, j, term.countElement(elem));
            j++;
        }
        for (var _a = 0, rhs_1 = rhs; _a < rhs_1.length; _a++) {
            var term = rhs_1[_a];
            matrix.set(i, j, -term.countElement(elem));
            j++;
        }
    });
    return matrix;
}
function solve(matrix) {
    matrix.gaussJordanEliminate();
    // Find row with more than one non-zero coefficient
    var i;
    for (i = 0; i < matrix.rowCount() - 1; i++) {
        if (countNonzeroCoeffs(matrix, i) > 1)
            break;
    }
    if (i == matrix.rowCount() - 1)
        throw "All-zero solution"; // Unique solution with all coefficients zero
    // Add an inhomogeneous equation
    matrix.set(matrix.rowCount() - 1, i, 1);
    matrix.set(matrix.rowCount() - 1, matrix.columnCount() - 1, 1);
    matrix.gaussJordanEliminate();
}
function countNonzeroCoeffs(matrix, row) {
    var count = 0;
    for (var i = 0; i < matrix.columnCount(); i++) {
        if (matrix.get(row, i) != 0)
            count++;
    }
    return count;
}
function extractCoefficients(matrix) {
    var rows = matrix.rowCount();
    var cols = matrix.columnCount();
    if (cols - 1 > rows || matrix.get(cols - 2, cols - 2) == 0)
        throw "Multiple independent solutions";
    var lcm = 1;
    for (var i = 0; i < cols - 1; i++)
        lcm = checkedMultiply(lcm / gcd(lcm, matrix.get(i, i)), matrix.get(i, i));
    var coefs = [];
    var allzero = true;
    for (var i = 0; i < cols - 1; i++) {
        var coef = checkedMultiply(lcm / matrix.get(i, i), matrix.get(i, cols - 1));
        coefs.push(coef);
        allzero = allzero && coef == 0;
    }
    if (allzero)
        throw "Assertion error: All-zero solution";
    return coefs;
}
// Throws an exception if there's a problem, otherwise returns silently.
function checkAnswer(eqn, coefs) {
    if (coefs.length != eqn.getLeftSide().length + eqn.getRightSide().length)
        throw "Assertion error: Mismatched length";
    var allzero = true;
    for (var _i = 0, coefs_1 = coefs; _i < coefs_1.length; _i++) {
        var coef = coefs_1[_i];
        if (typeof coef != "number" || isNaN(coef) || Math.floor(coef) != coef)
            throw "Assertion error: Not an integer";
        allzero = allzero && coef == 0;
    }
    if (allzero)
        throw "Assertion error: All-zero solution";
    for (var _a = 0, _b = eqn.getElements(); _a < _b.length; _a++) {
        var elem = _b[_a];
        var sum = 0;
        var j = 0;
        for (var _c = 0, _d = eqn.getLeftSide(); _c < _d.length; _c++) {
            var term = _d[_c];
            sum = checkedAdd(sum, checkedMultiply(term.countElement(elem), coefs[j]));
            j++;
        }
        for (var _e = 0, _f = eqn.getRightSide(); _e < _f.length; _e++) {
            var term = _f[_e];
            sum = checkedAdd(sum, checkedMultiply(term.countElement(elem), -coefs[j]));
            j++;
        }
        if (sum != 0)
            throw "Assertion error: Incorrect balance";
    }
}
/*---- Chemical equation data types ----*/
// A complete chemical equation. It has a left-hand side list of terms and a right-hand side list of terms.
// For example: H2 + O2 -> H2O.
var Equation = /** @class */ (function () {
    function Equation(lhs, rhs) {
        // Make defensive copies
        this.lhs = lhs.slice();
        this.rhs = rhs.slice();
    }
    Equation.prototype.getLeftSide = function () { return this.lhs.slice(); };
    Equation.prototype.getRightSide = function () { return this.rhs.slice(); };
    // Returns an array of the names all of the elements used in this equation.
    // The array represents a set, so the items are in an arbitrary order and no item is repeated.
    Equation.prototype.getElements = function () {
        var result = new Set();
        for (var _i = 0, _a = this.lhs.concat(this.rhs); _i < _a.length; _i++) {
            var item = _a[_i];
            item.getElements(result);
        }
        return Array.from(result);
    };
    // Returns an HTML element representing this equation.
    // 'coefs' is an optional argument, which is an array of coefficients to match with the terms.
    Equation.prototype.toHtml = function (coefs) {
        if (coefs !== undefined && coefs.length != this.lhs.length + this.rhs.length)
            throw "Mismatched number of coefficients";
        // Creates this kind of DOM node: <span class="className">text</span>
        function createSpan(text, className) {
            var span = createElem("span", text);
            span.className = className;
            return span;
        }
        var node = createElem("span");
        var j = 0;
        function termsToHtml(terms) {
            var head = true;
            for (var _i = 0, terms_1 = terms; _i < terms_1.length; _i++) {
                var term = terms_1[_i];
                var coef = coefs !== undefined ? coefs[j] : 1;
                if (coef != 0) {
                    if (head)
                        head = false;
                    else
                        node.appendChild(createSpan(" + ", "plus"));
                    if (coef != 1)
                        node.appendChild(createSpan(coef.toString().replace(/-/, MINUS), "coefficient"));
                    node.appendChild(term.toHtml());
                }
                j++;
            }
        }
        termsToHtml(this.lhs);
        node.appendChild(createSpan(" \u2192 ", "rightarrow"));
        termsToHtml(this.rhs);
        return node;
    };
    return Equation;
}());
// A term in a chemical equation. It has a list of groups or elements, and a charge.
// For example: H3O^+, or e^-.
var Term = /** @class */ (function () {
    function Term(items, charge) {
        if (items.length == 0 && charge != -1)
            throw "Invalid term"; // Electron case
        this.items = items.slice();
        this.charge = charge;
    }
    Term.prototype.getElements = function (resultSet) {
        resultSet.add("e");
        for (var _i = 0, _a = this.items; _i < _a.length; _i++) {
            var item = _a[_i];
            item.getElements(resultSet);
        }
    };
    // Counts the number of times the given element (specified as a string) occurs in this term, taking groups and counts into account, returning an integer.
    Term.prototype.countElement = function (name) {
        if (name == "e") {
            return -this.charge;
        }
        else {
            var sum = 0;
            for (var _i = 0, _a = this.items; _i < _a.length; _i++) {
                var item = _a[_i];
                sum = checkedAdd(sum, item.countElement(name));
            }
            return sum;
        }
    };
    // Returns an HTML element representing this term.
    Term.prototype.toHtml = function () {
        var node = createElem("span");
        if (this.items.length == 0 && this.charge == -1) {
            node.textContent = "e";
            node.appendChild(createElem("sup", MINUS));
        }
        else {
            for (var _i = 0, _a = this.items; _i < _a.length; _i++) {
                var item = _a[_i];
                node.appendChild(item.toHtml());
            }
            if (this.charge != 0) {
                var s = void 0;
                if (Math.abs(this.charge) == 1)
                    s = "";
                else
                    s = Math.abs(this.charge).toString();
                if (this.charge > 0)
                    s += "+";
                else
                    s += MINUS;
                node.appendChild(createElem("sup", s));
            }
        }
        return node;
    };
    return Term;
}());
// A group in a term. It has a list of groups or elements.
// For example: (OH)3
var Group = /** @class */ (function () {
    function Group(items, count) {
        if (count < 1)
            throw "Assertion error: Count must be a positive integer";
        this.items = items.slice();
        this.count = count;
    }
    Group.prototype.getElements = function (resultSet) {
        for (var _i = 0, _a = this.items; _i < _a.length; _i++) {
            var item = _a[_i];
            item.getElements(resultSet);
        }
    };
    Group.prototype.countElement = function (name) {
        var sum = 0;
        for (var _i = 0, _a = this.items; _i < _a.length; _i++) {
            var item = _a[_i];
            sum = checkedAdd(sum, checkedMultiply(item.countElement(name), this.count));
        }
        return sum;
    };
    // Returns an HTML element representing this group.
    Group.prototype.toHtml = function () {
        var node = createElem("span", "(");
        for (var _i = 0, _a = this.items; _i < _a.length; _i++) {
            var item = _a[_i];
            node.appendChild(item.toHtml());
        }
        node.appendChild(document.createTextNode(")"));
        if (this.count != 1)
            node.appendChild(createElem("sub", this.count.toString()));
        return node;
    };
    return Group;
}());
// A chemical element.
// For example: Na, F2, Ace, Uuq6
var ChemElem = /** @class */ (function () {
    function ChemElem(name, count) {
        if (count < 1)
            throw "Assertion error: Count must be a positive integer";
        this.name = name;
        this.count = count;
    }
    ChemElem.prototype.getElements = function (resultSet) { resultSet.add(this.name); };
    ChemElem.prototype.countElement = function (n) { return n == this.name ? this.count : 0; };
    // Returns an HTML element representing this element.
    ChemElem.prototype.toHtml = function () {
        var node = createElem("span", this.name);
        if (this.count != 1)
            node.appendChild(createElem("sub", this.count.toString()));
        return node;
    };
    return ChemElem;
}());
/*---- Parser object ----*/
var Parser = /** @class */ (function () {
    function Parser(formulaStr) {
        this.tok = new Tokenizer(formulaStr);
    }
    // Parses and returns an equation.
    Parser.prototype.parseEquation = function () {
        var lhs = [this.parseTerm()];
        while (true) {
            var next = this.tok.peek();
            if (next == "=") {
                this.tok.consume("=");
                break;
            }
            else if (next == null) {
                throw { message: "Plus or equal sign expected", start: this.tok.position() };
            }
            else if (next == "+") {
                this.tok.consume("+");
                lhs.push(this.parseTerm());
            }
            else
                throw { message: "Plus expected", start: this.tok.position() };
        }
        var rhs = [this.parseTerm()];
        while (true) {
            var next = this.tok.peek();
            if (next == null)
                break;
            else if (next == "+") {
                this.tok.consume("+");
                rhs.push(this.parseTerm());
            }
            else
                throw { message: "Plus or end expected", start: this.tok.position() };
        }
        return new Equation(lhs, rhs);
    };
    // Parses and returns a term.
    Parser.prototype.parseTerm = function () {
        var startPosition = this.tok.position();
        // Parse groups and elements
        var items = [];
        while (true) {
            var next_1 = this.tok.peek();
            if (next_1 == null)
                break;
            else if (next_1 == "(")
                items.push(this.parseGroup());
            else if (/^[A-Za-z][a-z]*$/.test(next_1))
                items.push(this.parseElement());
            else
                break;
        }
        // Parse optional charge
        var charge = 0;
        var next = this.tok.peek();
        if (next != null && next == "^") {
            this.tok.consume("^");
            next = this.tok.peek();
            if (next == null)
                throw { message: "Number or sign expected", start: this.tok.position() };
            else
                charge = this.parseOptionalNumber();
            next = this.tok.peek();
            if (next == "+")
                charge = +charge; // No-op
            else if (next == "-")
                charge = -charge;
            else
                throw { message: "Sign expected", start: this.tok.position() };
            this.tok.take(); // Consume the sign
        }
        // Check if term is valid
        var elemSet = new Set();
        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
            var item = items_1[_i];
            item.getElements(elemSet);
        }
        var elems = Array.from(elemSet); // List of all elements used in this term, with no repeats
        if (items.length == 0) {
            throw { message: "Invalid term - empty", start: startPosition, end: this.tok.position() };
        }
        else if (elems.indexOf("e") != -1) { // If it's the special electron element
            if (items.length > 1)
                throw { message: "Invalid term - electron needs to stand alone", start: startPosition, end: this.tok.position() };
            else if (charge != 0 && charge != -1)
                throw { message: "Invalid term - invalid charge for electron", start: startPosition, end: this.tok.position() };
            // Tweak data
            items = [];
            charge = -1;
        }
        else { // Otherwise, a term must not contain an element that starts with lowercase
            for (var _a = 0, elems_1 = elems; _a < elems_1.length; _a++) {
                var elem = elems_1[_a];
                if (/^[a-z]+$/.test(elem))
                    throw { message: 'Invalid element name "' + elem + '"', start: startPosition, end: this.tok.position() };
            }
        }
        return new Term(items, charge);
    };
    // Parses and returns a group.
    Parser.prototype.parseGroup = function () {
        var startPosition = this.tok.position();
        this.tok.consume("(");
        var items = [];
        while (true) {
            var next = this.tok.peek();
            if (next == null)
                throw { message: "Element, group, or closing parenthesis expected", start: this.tok.position() };
            else if (next == "(")
                items.push(this.parseGroup());
            else if (/^[A-Za-z][a-z]*$/.test(next))
                items.push(this.parseElement());
            else if (next == ")") {
                this.tok.consume(")");
                if (items.length == 0)
                    throw { message: "Empty group", start: startPosition, end: this.tok.position() };
                break;
            }
            else
                throw { message: "Element, group, or closing parenthesis expected", start: this.tok.position() };
        }
        return new Group(items, this.parseOptionalNumber());
    };
    // Parses and returns an element.
    Parser.prototype.parseElement = function () {
        var name = this.tok.take();
        if (!/^[A-Za-z][a-z]*$/.test(name))
            throw "Assertion error";
        return new ChemElem(name, this.parseOptionalNumber());
    };
    // Parses a number if it's the next token, returning a non-negative integer, with a default of 1.
    Parser.prototype.parseOptionalNumber = function () {
        var next = this.tok.peek();
        if (next != null && /^[0-9]+$/.test(next))
            return checkedParseInt(this.tok.take());
        else
            return 1;
    };
    return Parser;
}());
/*---- Tokenizer object ----*/
// Tokenizes a formula into a stream of token strings.
var Tokenizer = /** @class */ (function () {
    function Tokenizer(str) {
        this.str = str.replace(/\u2212/g, "-");
        this.i = 0;
        this.skipSpaces();
    }
    // Returns the index of the next character to tokenize.
    Tokenizer.prototype.position = function () {
        return this.i;
    };
    // Returns the next token as a string, or null if the end of the token stream is reached.
    Tokenizer.prototype.peek = function () {
        if (this.i == this.str.length) // End of stream
            return null;
        var match = /^([A-Za-z][a-z]*|[0-9]+|[+\-^=()])/.exec(this.str.substring(this.i));
        if (match == null)
            throw { message: "Invalid symbol", start: this.i };
        return match[0];
    };
    // Returns the next token as a string and advances this tokenizer past the token.
    Tokenizer.prototype.take = function () {
        var result = this.peek();
        if (result == null)
            throw "Advancing beyond last token";
        this.i += result.length;
        this.skipSpaces();
        return result;
    };
    // Takes the next token and checks that it matches the given string, or throws an exception.
    Tokenizer.prototype.consume = function (s) {
        if (this.take() != s)
            throw "Token mismatch";
    };
    Tokenizer.prototype.skipSpaces = function () {
        var match = /^[ \t]*/.exec(this.str.substring(this.i));
        if (match === null)
            throw "Assertion error";
        this.i += match[0].length;
    };
    return Tokenizer;
}());
/*---- Matrix object ----*/
// A matrix of integers.
var Matrix = /** @class */ (function () {
    function Matrix(rows, cols) {
        if (rows < 0 || cols < 0)
            throw "Illegal argument";
        this.rows = rows;
        this.cols = cols;
        // Initialize with zeros
        var row = [];
        for (var j = 0; j < cols; j++)
            row.push(0);
        this.cells = []; // Main data (the matrix)
        for (var i = 0; i < rows; i++)
            this.cells.push(row.slice());
    }
    /* Accessor functions */
    Matrix.prototype.rowCount = function () { return this.rows; };
    Matrix.prototype.columnCount = function () { return this.cols; };
    // Returns the value of the given cell in the matrix, where r is the row and c is the column.
    Matrix.prototype.get = function (r, c) {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols)
            throw "Index out of bounds";
        return this.cells[r][c];
    };
    // Sets the given cell in the matrix to the given value, where r is the row and c is the column.
    Matrix.prototype.set = function (r, c, val) {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols)
            throw "Index out of bounds";
        this.cells[r][c] = val;
    };
    /* Private helper functions for gaussJordanEliminate() */
    // Swaps the two rows of the given indices in this matrix. The degenerate case of i == j is allowed.
    Matrix.prototype.swapRows = function (i, j) {
        if (i < 0 || i >= this.rows || j < 0 || j >= this.rows)
            throw "Index out of bounds";
        var temp = this.cells[i];
        this.cells[i] = this.cells[j];
        this.cells[j] = temp;
    };
    // Returns a new row that is the sum of the two given rows. The rows are not indices.
    // For example, addRow([3, 1, 4], [1, 5, 6]) = [4, 6, 10].
    Matrix.addRows = function (x, y) {
        var z = [];
        for (var i = 0; i < x.length; i++)
            z.push(checkedAdd(x[i], y[i]));
        return z;
    };
    // Returns a new row that is the product of the given row with the given scalar. The row is is not an index.
    // For example, multiplyRow([0, 1, 3], 4) = [0, 4, 12].
    Matrix.multiplyRow = function (x, c) {
        return x.map(function (val) {
            return checkedMultiply(val, c);
        });
    };
    // Returns the GCD of all the numbers in the given row. The row is is not an index.
    // For example, gcdRow([3, 6, 9, 12]) = 3.
    Matrix.gcdRow = function (x) {
        var result = 0;
        for (var _i = 0, x_1 = x; _i < x_1.length; _i++) {
            var val = x_1[_i];
            result = gcd(val, result);
        }
        return result;
    };
    // Returns a new row where the leading non-zero number (if any) is positive, and the GCD of the row is 0 or 1.
    // For example, simplifyRow([0, -2, 2, 4]) = [0, 1, -1, -2].
    Matrix.simplifyRow = function (x) {
        var sign = 0;
        for (var _i = 0, x_2 = x; _i < x_2.length; _i++) {
            var val = x_2[_i];
            if (val != 0) {
                sign = Math.sign(val);
                break;
            }
        }
        if (sign == 0)
            return x.slice();
        var g = Matrix.gcdRow(x) * sign;
        return x.map(function (val) { return val / g; });
    };
    // Changes this matrix to reduced row echelon form (RREF), except that each leading coefficient is not necessarily 1. Each row is simplified.
    Matrix.prototype.gaussJordanEliminate = function () {
        // Simplify all rows
        var cells = this.cells = this.cells.map(Matrix.simplifyRow);
        // Compute row echelon form (REF)
        var numPivots = 0;
        for (var i = 0; i < this.cols; i++) {
            // Find pivot
            var pivotRow = numPivots;
            while (pivotRow < this.rows && cells[pivotRow][i] == 0)
                pivotRow++;
            if (pivotRow == this.rows)
                continue;
            var pivot = cells[pivotRow][i];
            this.swapRows(numPivots, pivotRow);
            numPivots++;
            // Eliminate below
            for (var j = numPivots; j < this.rows; j++) {
                var g = gcd(pivot, cells[j][i]);
                cells[j] = Matrix.simplifyRow(Matrix.addRows(Matrix.multiplyRow(cells[j], pivot / g), Matrix.multiplyRow(cells[i], -cells[j][i] / g)));
            }
        }
        // Compute reduced row echelon form (RREF), but the leading coefficient need not be 1
        for (var i = this.rows - 1; i >= 0; i--) {
            // Find pivot
            var pivotCol = 0;
            while (pivotCol < this.cols && cells[i][pivotCol] == 0)
                pivotCol++;
            if (pivotCol == this.cols)
                continue;
            var pivot = cells[i][pivotCol];
            // Eliminate above
            for (var j = i - 1; j >= 0; j--) {
                var g = gcd(pivot, cells[j][pivotCol]);
                cells[j] = Matrix.simplifyRow(Matrix.addRows(Matrix.multiplyRow(cells[j], pivot / g), Matrix.multiplyRow(cells[i], -cells[j][pivotCol] / g)));
            }
        }
    };
    return Matrix;
}());
/*---- Math functions (especially checked integer operations) ----*/
var INT_MAX = 9007199254740992; // 2^53
// Returns the given string parsed into a number, or throws an exception if the result is too large.
function checkedParseInt(str) {
    var result = parseInt(str, 10);
    if (isNaN(result))
        throw "Not a number";
    if (result <= -INT_MAX || result >= INT_MAX)
        throw "Arithmetic overflow";
    return result;
}
// Returns the sum of the given integers, or throws an exception if the result is too large.
function checkedAdd(x, y) {
    var z = x + y;
    if (z <= -INT_MAX || z >= INT_MAX)
        throw "Arithmetic overflow";
    return z;
}
// Returns the product of the given integers, or throws an exception if the result is too large.
function checkedMultiply(x, y) {
    var z = x * y;
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
        var z = x % y;
        x = y;
        y = z;
    }
    return x;
}
/*---- Miscellaneous ----*/
// Unicode character constants (because this script file's character encoding is unspecified)
var MINUS = "\u2212"; // Minus sign
function createElem(tagName, text) {
    var result = document.createElement(tagName);
    if (text !== undefined)
        result.textContent = text;
    return result;
}
// Removes all the children of the given DOM node. Returns nothing.
function clearChildren(node) {
    while (node.firstChild != null)
        node.removeChild(node.firstChild);
}
// Polyfills, only valid for this application
if (!("sign" in Math))
    Math.sign = function (x) { return x > 0 ? 1 : (x < 0 ? -1 : 0); };
if (!("from" in Array)) {
    Array.from = function (set) {
        var result = [];
        set.forEach(function (obj) { return result.push(obj); });
        return result;
    };
}
