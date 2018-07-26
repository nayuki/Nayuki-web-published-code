/* 
 * Propositional sequent calculus prover
 * 
 * Copyright (c) 2018 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/propositional-sequent-calculus-prover
 */

"use strict";


function doProve(inputSequent) {
	document.getElementById("inputSequent").value = inputSequent;
	
	function clearChildren(node) {
		while (node.firstChild != null)
			node.removeChild(node.firstChild);
	}
	let msgElem     = document.getElementById("message");
	let codeOutElem = document.getElementById("codeOutput");
	let proofElem   = document.getElementById("proof");
	clearChildren(msgElem);
	clearChildren(codeOutElem);
	clearChildren(proofElem);
	
	let proof;
	try {
		let sequent = parseSequent(new Tokenizer(inputSequent));
		proof = prove(sequent);
		msgElem.appendChild(document.createTextNode("Proof:"));
		proofElem.appendChild(proof.toHtml());
		
	} catch (e) {
		if (typeof e == "string") {
			msgElem.appendChild(document.createTextNode("Error: " + e));
		} else if ("position" in e) {
			msgElem.appendChild(document.createTextNode("Syntax error: " + e.message));
			codeOutElem.appendChild(document.createTextNode(inputSequent.substring(0, e.position)));
			let highlight = document.createElement("u");
			if (e.position < inputSequent.length) {
				highlight.appendChild(document.createTextNode(inputSequent.substr(e.position, 1)));
				codeOutElem.appendChild(highlight);
				codeOutElem.appendChild(document.createTextNode(inputSequent.substring(e.position + 1, inputSequent.length)));
			} else {
				highlight.appendChild(document.createTextNode(" "));
				codeOutElem.appendChild(highlight);
			}
		} else {
			msgElem.appendChild(document.createTextNode("Error: " + e));
		}
	}
}


/* Data types */

class Tree {
	/* 
	 * Constructs a proof tree. Has zero, one, or two children.
	 *   sequent: The value at this node - either a sequent or the string "Fail".
	 *   left: Zeroth child tree or null.
	 *   right: First child tree or null. (Requires left to be not null.)
	 */
	constructor(sequent, left, right) {
		if (typeof sequent == "string" && sequent != "Fail" || left == null && right != null)
			throw "Invalid value";
		this.sequent = sequent;
		this.left = left;
		this.right = right;
	}
	
	// Returns a DOM node representing this proof tree.
	toHtml() {
		let ul = document.createElement("ul");
		let li = document.createElement("li");
		
		if (this.sequent == "Fail")
			li.textContent = this.sequent;
		else {
			this.sequent.toHtml().forEach(
				elem => li.appendChild(elem));
		}
		
		if (this.left != null)
			li.appendChild(this.left.toHtml());
		if (this.right != null)
			li.appendChild(this.right.toHtml());
		
		ul.appendChild(li);
		return ul;
	}
}


class Sequent {
	/* 
	 * Constructs a sequent.
	 *   left : Array of zero or more terms.
	 *   right: Array of zero or more terms.
	 */
	constructor(left, right) {
		this.left  = left .slice();
		this.right = right.slice();
	}
	
	getLeft() {
		return this.left.slice();
	}
	
	getRight() {
		return this.right.slice();
	}
	
	// Returns a string representation of this sequent, e.g.: "¬(A ∧ B) ⊦ C, D ∨ E".
	toString() {
		let s = "";
		if (this.left.length == 0)
			s += EMPTY;
		else
			s += this.left.map(t => t.toString()).join(", ");
		s += " " + TURNSTILE + " ";
		if (this.right.length == 0)
			s += EMPTY;
		else
			s += this.right.map(t => t.toString()).join(", ");
		return s;
	}
	
	// Returns an array of DOM nodes representing this sequent.
	// The reason that an array of nodes is returned is because the comma and turnstile are styled with extra spacing.
	toHtml() {
		// Creates this kind of DOM node: <span class="className">text</span>
		function createSpan(text, className) {
			let span = document.createElement("span");
			span.textContent = text;
			span.className = className;
			return span;
		}
		
		let result = [];
		
		if (this.left.length == 0)
			result.push(document.createTextNode(EMPTY));
		else {
			this.left.forEach((term, i) => {
				if (i > 0)
					result.push(createSpan(", ", "comma"));
				result.push(document.createTextNode(term.toString()));
			});
		}
		
		result.push(createSpan(" " + TURNSTILE + " ", "turnstile"));
		
		if (this.right.length == 0)
			result.push(document.createTextNode(EMPTY));
		else {
			this.right.forEach((term, i) => {
				if (i > 0)
					result.push(createSpan(", ", "comma"));
				result.push(document.createTextNode(term.toString()));
			});
		}
		
		return result;
	}
}


class Term {
	/* 
	 * Constructs a term. Valid options:
	 * - type = "var", left = string name       , right = null
	 * - type = "NOT", left = sole argument term, right = null
	 * - type = "AND", left = left argument term, right = right argument term
	 * - type = "OR" , left = left argument term, right = right argument term
	 */
	constructor(type, left, right) {
		if (!(type == "var" || type == "NOT" || type == "AND" || type == "OR"))
			throw "Invalid type";
		if ((type == "var" || type == "NOT") && right != null || (type == "AND" || type == "OR") && right == null)
			throw "Invalid value";
		this.type = type;
		this.left = left;
		this.right = right;
	}
	
	getType() {
		return this.type;
	}
	
	getLeft() {
		return this.left;
	}
	
	getRight() {
		if (this.type == "var" || this.type == "NOT")
			throw "No such value";
		return this.right;
	}
	
	// Returns a string representation of this term, e.g.: "(A ∧ (¬B)) ∨ C".
	// isRoot is an argument for internal use only.
	toString(isRoot) {
		if (this.type == "var")
			return this.left;
		else {
			if (isRoot === undefined)
				isRoot = true;
			let s = isRoot ? "" : "(";
			if (this.type == "NOT")
				s += NOT + this.left.toString(false);
			else if (this.type == "AND")
				s += this.left.toString(false) + " " + AND + " " + this.right.toString(false);
			else if (this.type == "OR")
				s += this.left.toString(false) + " " + OR + " " + this.right.toString(false);
			else
				throw "Assertion error";
			s += isRoot ? "" : ")";
			return s;
		}
	}
}


/* Sequent prover */

function prove(sequent) {
	let left  = sequent.getLeft();
	let right = sequent.getRight();
	
	// Try to find a variable that is common to both sides, to try to derive an axiom.
	// This uses a dumb O(n^2) algorithm, but can theoretically be sped up by a hash table or such.
	for (let lt of left) {
		if (lt.getType() == "var") {
			let name = lt.getLeft();
			for (let rt of right) {
				if (rt.getType() == "var" && rt.getLeft() == name) {
					if (left.length > 1 || right.length > 1) {
						let axiom = new Tree(new Sequent([new Term("var", name)], [new Term("var", name)]), null, null);
						return new Tree(sequent, axiom, null);
					} else  // Already in the form X ⊦ X
						return new Tree(sequent, null, null);
				}
			}
		}
	}
	
	// Try to find an easy operator on left side
	for (let i = 0; i < left.length; i++) {
		let term = left[i];
		let type = term.getType();
		if (type == "NOT") {
			left.splice(i, 1);
			right.push(term.getLeft());
			let seq = new Sequent(left, right);
			return new Tree(sequent, prove(seq), null);
		} else if (type == "AND") {
			left.splice(i, 1, term.getLeft(), term.getRight());
			let seq = new Sequent(left, right);
			return new Tree(sequent, prove(seq), null);
		}
	}
	
	// Try to find an easy operator on right side
	for (let i = 0; i < right.length; i++) {
		let term = right[i];
		let type = term.getType();
		if (type == "NOT") {
			right.splice(i, 1);
			left.push(term.getLeft());
			let seq = new Sequent(left, right);
			return new Tree(sequent, prove(seq), null);
		} else if (type == "OR") {
			right.splice(i, 1, term.getLeft(), term.getRight());
			let seq = new Sequent(left, right);
			return new Tree(sequent, prove(seq), null);
		}
	}
	
	// Try to find a hard operator (OR on left side, AND on right side)
	for (let i = 0; i < left.length; i++) {
		let term = left[i];
		if (term.getType() == "OR") {
			left.splice(i, 1, term.getLeft());
			let seq0 = new Sequent(left, right);
			left = left.slice();
			left.splice(i, 1, term.getRight());
			let seq1 = new Sequent(left, right);
			return new Tree(sequent, prove(seq0), prove(seq1));
		}
	}
	for (let i = 0; i < right.length; i++) {
		let term = right[i];
		if (term.getType() == "AND") {
			right.splice(i, 1, term.getLeft());
			let seq0 = new Sequent(left, right);
			right = right.slice();
			right.splice(i, 1, term.getRight());
			let seq1 = new Sequent(left, right);
			return new Tree(sequent, prove(seq0), prove(seq1));
		}
	}
	
	// No operators remaining, and not an axiom
	return new Tree(sequent, new Tree("Fail", null, null), null, null);
}


/* Parser functions */

function parseSequent(tok) {
	let lhs = [];
	let rhs = [];
	
	// Parse left side
	let expectComma = false;
	while (true) {
		let next = tok.peek();
		if (next == TURNSTILE) {
			tok.consume(TURNSTILE);
			break;
		} else if (next == null)
			throw {message: "Comma or turnstile expected", position: tok.position()};
		else {
			if (expectComma) {
				if (next == ",")
					tok.consume(",");
				else
					throw {message: "Comma expected", position: tok.position()};
				if (tok.peek() == null)
					throw {message: "Term expected", position: tok.position()};
			} else {
				if (tok.peek() != ",")
					expectComma = true;
				else
					throw {message: "Term or turnstile expected", position: tok.position()};
			}
			let term = parseTerm(tok);
			if (term != null)
				lhs.push(term);
		}
	}
	
	// Parse right side
	expectComma = false;
	while (true) {
		let next = tok.peek();
		if (next == null)
			break;
		else if (next == TURNSTILE)
			throw {message: "Turnstile not expected", position: tok.position()};
		else {
			if (expectComma) {
				if (next == ",")
					tok.consume(",");
				else
					throw {message: "Comma expected", position: tok.position()};
				if (tok.peek() == null)
					throw {message: "Term expected", position: tok.position()};
			} else {
				if (tok.peek() != ",")
					expectComma = true;
				else
					throw {message: "Term or end expected", position: tok.position()};
			}
			let term = parseTerm(tok);
			if (term != null)
				rhs.push(term);
		}
	}
	
	return new Sequent(lhs, rhs);
}


// Parses and returns a term, or null if the leading token is the empty symbol.
function parseTerm(tok) {
	if (tok.peek() == EMPTY) {
		tok.consume(EMPTY);
		return null;
	}
	
	// Mutant LR parser with deferred reductions
	let stack = [];  // The stack consists of terms (variables/subexpressions) and strings (operators)
	
	function reduce() {
		while (true) {
			if (stack.length >= 2 && stack[stack.length - 2] == NOT) {
				let term = stack.pop();
				stack.pop();  // NOT
				stack.push(new Term("NOT", term));
			} else if (stack.length >= 3 && stack[stack.length - 2] == AND) {
				let right = stack.pop();
				stack.pop();  // AND
				let left = stack.pop();
				stack.push(new Term("AND", left, right));
			} else
				break;
		}
	}
	
	function finalReduce() {
		while (true) {
			if (stack.length >= 3 && stack[stack.length - 2] == OR) {
				let right = stack.pop();
				stack.pop();  // OR
				let left = stack.pop();
				stack.push(new Term("OR", left, right));
			} else
				break;
		}
	}
	
	function checkBeforePushingUnary() {
		if (!(stack.length == 0 || typeof stack[stack.length - 1] == "string"))  // Check that top item is not a term
			throw {message: "Unexpected item", position: tok.position()};
	}
	
	function checkBeforePushingBinary() {
		if (stack.length == 0 || typeof stack[stack.length - 1] == "string")  // Check that top item is a term
			throw {message: "Unexpected item", position: tok.position()};
	}
	
	while (true) {
		let next = tok.peek();
		if (next == null || next == TURNSTILE || next == ",")
			break;
		
		else if (/^[A-Za-z][A-Za-z0-9]*$/.test(next)) {  // Variable
			checkBeforePushingUnary();
			stack.push(new Term("var", tok.take()));
			reduce();
			
		} else if (next == NOT) {
			checkBeforePushingUnary();
			stack.push(tok.take());
			
		} else if (next == AND) {
			checkBeforePushingBinary();
			stack.push(tok.take());
			
		} else if (next == OR) {
			checkBeforePushingBinary();
			if (stack.length >= 3 && stack[stack.length - 2] == OR) {  // Precedence magic
				let right = stack.pop();
				stack.pop();  // OR
				let left = stack.pop();
				stack.push(new Term("OR", left, right));
			}
			stack.push(tok.take());
			
		} else if (next == "(") {  // Subformula
			checkBeforePushingUnary();
			stack.push(tok.take());
			
		} else if (next == ")") {
			finalReduce();
			if (stack.length < 2 || stack[stack.length - 2] != "(")
				throw {message: "Binary operator without second operand", position: tok.position()};
			tok.consume(")");
			stack.splice(stack.length - 2, 1);
			reduce();
		
		} else if (next == EMPTY)
			throw {message: "Empty not expected", position: tok.position()};
		else
			throw "Assertion error";
	}
	finalReduce();
	
	if (stack.length == 1)
		return stack[0];
	else if (stack.length == 0)
		throw {message: "Blank term", position: tok.position()};
	else
		throw {message: "Binary operator without second operand", position: tok.position()};
}


/* Tokenizer object */

// Tokenizes a formula into a stream of token strings.
class Tokenizer {
	constructor(str) {
		this.str = str;
		this.pos = 0;
		this.skipSpaces();
	}
	
	// Returns the index of the next character to tokenize.
	position() {
		return this.pos;
	}
	
	// Returns the next token as a string, or null if the end of the token stream is reached.
	peek() {
		if (this.pos == this.str.length)  // End of stream
			return null;
		
		let match = /^([A-Za-z][A-Za-z0-9]*|[,()!&|>\u2205\u00AC\u2227\u2228\u22A6]| +)/.exec(this.str.substring(this.pos));
		if (match == null)
			throw {message: "Invalid symbol", position: this.pos};
		
		// Normalize notation
		let token = match[0];
		if      (token == "!") token = NOT;
		else if (token == "&") token = AND;
		else if (token == "|") token = OR;
		else if (token == ">") token = TURNSTILE;
		return token;
	}
	
	// Returns the next token as a string and advances this tokenizer past the token.
	take() {
		let result = this.peek();
		if (result == null)
			throw "Advancing beyond last token";
		this.pos += result.length;
		this.skipSpaces();
		return result;
	}
	
	// Takes the next token and checks that it matches the given string, or throws an exception.
	consume(s) {
		if (this.take() != s)
			throw "Token mismatch";
	}
	
	skipSpaces() {
		let match = /^[ \t]*/.exec(this.str.substring(this.pos));
		this.pos += match[0].length;
	}
}


/* Miscellaneous */

// Unicode character constants (because this script file's character encoding is unspecified)
const TURNSTILE = "\u22A6";
const EMPTY     = "\u2205";
const NOT       = "\u00AC";
const AND       = "\u2227";
const OR        = "\u2228";
