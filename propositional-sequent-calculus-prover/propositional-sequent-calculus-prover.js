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
    var msgElem = document.getElementById("message");
    var codeOutElem = document.getElementById("codeOutput");
    var proofElem = document.getElementById("proof");
    clearChildren(msgElem);
    clearChildren(codeOutElem);
    clearChildren(proofElem);
    function appendText(node, text) {
        node.appendChild(document.createTextNode(text));
    }
    var proof;
    try {
        var seq = parseSequent(new Tokenizer(inputSequent));
        proof = prove(seq);
        appendText(msgElem, "Proof:");
        proofElem.appendChild(Tree.toHtml([proof]));
    }
    catch (e) {
        if (typeof e == "string") {
            appendText(msgElem, "Error: " + e);
        }
        else if ("position" in e) {
            appendText(msgElem, "Syntax error: " + e.message);
            appendText(codeOutElem, inputSequent.substring(0, e.position));
            var highlight = document.createElement("u");
            if (e.position < inputSequent.length) {
                appendText(highlight, inputSequent.substr(e.position, 1));
                codeOutElem.appendChild(highlight);
                appendText(codeOutElem, inputSequent.substring(e.position + 1, inputSequent.length));
            }
            else {
                appendText(highlight, " ");
                codeOutElem.appendChild(highlight);
            }
        }
        else {
            appendText(msgElem, "Error: " + e);
        }
    }
}
/* Data types */
var Tree = /** @class */ (function () {
    /*
     * Constructs a proof tree. Has zero, one, or two children.
     *   sequent: The value at this node - either a sequent or the string "Fail".
     *   left: Zeroth child tree or null.
     *   right: First child tree or null. (Requires left to be not null.)
     */
    function Tree(sequent) {
        var children = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            children[_i - 1] = arguments[_i];
        }
        if (typeof sequent == "string" && sequent != "Fail" || children.length > 2)
            throw "Invalid value";
        this.sequent = sequent;
        this.children = children;
    }
    Tree.toHtml = function (trees) {
        if (trees.length == 0)
            return document.createDocumentFragment();
        var ul = document.createElement("ul");
        trees.forEach(function (tree) {
            var li = document.createElement("li");
            if (tree.sequent === "Fail")
                li.textContent = "Fail";
            else {
                li.appendChild(tree.sequent.toHtml());
                li.appendChild(Tree.toHtml(tree.children));
                ul.appendChild(li);
            }
            ul.appendChild(li);
        });
        return ul;
    };
    return Tree;
}());
var Sequent = /** @class */ (function () {
    /*
     * Constructs a sequent.
     *   left : Array of zero or more terms.
     *   right: Array of zero or more terms.
     */
    function Sequent(left, right) {
        this.left = left;
        this.right = right;
    }
    // Returns a string representation of this sequent, e.g.: "¬(A ∧ B) ⊦ C, D ∨ E".
    Sequent.prototype.toString = function () {
        function formatTerms(terms) {
            if (terms.length == 0)
                return EMPTY;
            else
                return terms.map(function (t) { return t.toString(true); }).join(", ");
        }
        return formatTerms(this.left) + " " + TURNSTILE + " " + formatTerms(this.right);
    };
    // Returns an array of DOM nodes representing this sequent.
    // The reason that an array of nodes is returned is because the comma and turnstile are styled with extra spacing.
    Sequent.prototype.toHtml = function () {
        var result = document.createDocumentFragment();
        function appendText(text) {
            result.appendChild(document.createTextNode(text));
        }
        function appendSpan(text, clsName) {
            var elem = document.createElement("span");
            elem.textContent = text;
            elem.className = clsName;
            result.appendChild(elem);
        }
        if (this.left.length == 0)
            appendText(EMPTY);
        else {
            this.left.forEach(function (term, i) {
                if (i > 0)
                    appendSpan(", ", "comma");
                appendText(term.toString(true));
            });
        }
        appendSpan(" " + TURNSTILE + " ", "turnstile");
        if (this.right.length == 0)
            appendText(EMPTY);
        else {
            this.right.forEach(function (term, i) {
                if (i > 0)
                    appendSpan(", ", "comma");
                appendText(term.toString(true));
            });
        }
        return result;
    };
    return Sequent;
}());
var VarTerm = /** @class */ (function () {
    function VarTerm(name) {
        this.name = name;
    }
    VarTerm.prototype.toString = function (isRoot) {
        if (isRoot === void 0) { isRoot = false; }
        return this.name;
    };
    return VarTerm;
}());
var NotTerm = /** @class */ (function () {
    function NotTerm(child) {
        this.child = child;
    }
    NotTerm.prototype.toString = function (isRoot) {
        if (isRoot === void 0) { isRoot = false; }
        var s = NOT + this.child.toString();
        if (!isRoot)
            s = "(" + s + ")";
        return s;
    };
    return NotTerm;
}());
var AndTerm = /** @class */ (function () {
    function AndTerm(left, right) {
        this.left = left;
        this.right = right;
    }
    AndTerm.prototype.toString = function (isRoot) {
        if (isRoot === void 0) { isRoot = false; }
        var s = this.left.toString() + " " + AND + " " + this.right.toString();
        if (!isRoot)
            s = "(" + s + ")";
        return s;
    };
    return AndTerm;
}());
var OrTerm = /** @class */ (function () {
    function OrTerm(left, right) {
        this.left = left;
        this.right = right;
    }
    OrTerm.prototype.toString = function (isRoot) {
        if (isRoot === void 0) { isRoot = false; }
        var s = this.left.toString() + " " + OR + " " + this.right.toString();
        if (!isRoot)
            s = "(" + s + ")";
        return s;
    };
    return OrTerm;
}());
/* Sequent prover */
function prove(sequent) {
    var left = sequent.left.slice();
    var right = sequent.right.slice();
    // Try to find a variable that is common to both sides, to try to derive an axiom.
    // This uses a dumb O(n^2) algorithm, but can theoretically be sped up by a hash table or such.
    for (var _i = 0, left_1 = left; _i < left_1.length; _i++) {
        var lt = left_1[_i];
        if (lt instanceof VarTerm) {
            for (var _a = 0, right_1 = right; _a < right_1.length; _a++) {
                var rt = right_1[_a];
                if (rt instanceof VarTerm && rt.name == lt.name) {
                    if (left.length == 1 && right.length == 1) // Already in the form X ⊦ X
                        return new Tree(sequent);
                    var axiom = new Tree(new Sequent([lt], [rt]));
                    return new Tree(sequent, axiom);
                }
            }
        }
    }
    // Try to find an easy operator on left side
    for (var i = 0; i < left.length; i++) {
        var term = left[i];
        if (term instanceof NotTerm) {
            left.splice(i, 1);
            right.push(term.child);
            var seq = new Sequent(left, right);
            return new Tree(sequent, prove(seq));
        }
        else if (term instanceof AndTerm) {
            left.splice(i, 1, term.left, term.right);
            var seq = new Sequent(left, right);
            return new Tree(sequent, prove(seq));
        }
    }
    // Try to find an easy operator on right side
    for (var i = 0; i < right.length; i++) {
        var term = right[i];
        if (term instanceof NotTerm) {
            right.splice(i, 1);
            left.push(term.child);
            var seq = new Sequent(left, right);
            return new Tree(sequent, prove(seq));
        }
        else if (term instanceof OrTerm) {
            right.splice(i, 1, term.left, term.right);
            var seq = new Sequent(left, right);
            return new Tree(sequent, prove(seq));
        }
    }
    // Try to find a hard operator (OR on left side, AND on right side)
    for (var i = 0; i < left.length; i++) {
        var term = left[i];
        if (term instanceof OrTerm) {
            left.splice(i, 1, term.left);
            var seq0 = new Sequent(left, right);
            left = left.slice();
            left.splice(i, 1, term.right);
            var seq1 = new Sequent(left, right);
            return new Tree(sequent, prove(seq0), prove(seq1));
        }
    }
    for (var i = 0; i < right.length; i++) {
        var term = right[i];
        if (term instanceof AndTerm) {
            right.splice(i, 1, term.left);
            var seq0 = new Sequent(left, right);
            right = right.slice();
            right.splice(i, 1, term.right);
            var seq1 = new Sequent(left, right);
            return new Tree(sequent, prove(seq0), prove(seq1));
        }
    }
    // No operators remaining, and not an axiom
    return new Tree(sequent, new Tree("Fail"));
}
/* Parser functions */
function parseSequent(tok) {
    // Parse left side
    var lhs = [];
    for (var expectComma = false;;) {
        var next = tok.peek();
        if (next == TURNSTILE) {
            tok.consume(next);
            break;
        }
        else if (next == null)
            throw { message: "Comma or turnstile expected", position: tok.pos };
        else {
            if (expectComma) {
                if (next == ",")
                    tok.consume(next);
                else
                    throw { message: "Comma expected", position: tok.pos };
                if (tok.peek() == null)
                    throw { message: "Term expected", position: tok.pos };
            }
            else {
                if (tok.peek() != ",")
                    expectComma = true;
                else
                    throw { message: "Term or turnstile expected", position: tok.pos };
            }
            var term = parseTerm(tok);
            if (term != null)
                lhs.push(term);
        }
    }
    // Parse right side
    var rhs = [];
    for (var expectComma = false;;) {
        var next = tok.peek();
        if (next == null)
            break;
        else if (next == TURNSTILE)
            throw { message: "Turnstile not expected", position: tok.pos };
        else {
            if (expectComma) {
                if (next == ",")
                    tok.consume(next);
                else
                    throw { message: "Comma expected", position: tok.pos };
                if (tok.peek() == null)
                    throw { message: "Term expected", position: tok.pos };
            }
            else {
                if (tok.peek() != ",")
                    expectComma = true;
                else
                    throw { message: "Term or end expected", position: tok.pos };
            }
            var term = parseTerm(tok);
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
    var stack = []; // The stack consists of terms (variables/subexpressions) and strings (operators)
    function reduce() {
        while (true) {
            if (stack.length >= 2 && stack[stack.length - 2] == NOT) {
                var term = stack.pop();
                if (term === undefined)
                    throw "Assertion error";
                stack.pop(); // NOT
                stack.push(new NotTerm(term));
            }
            else if (stack.length >= 3 && stack[stack.length - 2] == AND) {
                var right = stack.pop();
                if (right === undefined)
                    throw "Assertion error";
                stack.pop(); // AND
                var left = stack.pop();
                if (left === undefined)
                    throw "Assertion error";
                stack.push(new AndTerm(left, right));
            }
            else
                break;
        }
    }
    function finalReduce() {
        while (true) {
            if (stack.length >= 3 && stack[stack.length - 2] == OR) {
                var right = stack.pop();
                if (right === undefined)
                    throw "Assertion error";
                stack.pop(); // OR
                var left = stack.pop();
                if (left === undefined)
                    throw "Assertion error";
                stack.push(new OrTerm(left, right));
            }
            else
                break;
        }
    }
    function checkBeforePushingUnary() {
        if (!(stack.length == 0 || typeof stack[stack.length - 1] == "string")) // Check that top item is not a term
            throw { message: "Unexpected item", position: tok.pos };
    }
    function checkBeforePushingBinary() {
        if (stack.length == 0 || typeof stack[stack.length - 1] == "string") // Check that top item is a term
            throw { message: "Unexpected item", position: tok.pos };
    }
    while (true) {
        var next = tok.peek();
        if (next == null || next == TURNSTILE || next == ",")
            break;
        else if (/^[A-Za-z][A-Za-z0-9]*$/.test(next)) { // Variable
            checkBeforePushingUnary();
            stack.push(new VarTerm(tok.take()));
            reduce();
        }
        else if (next == NOT) {
            checkBeforePushingUnary();
            stack.push(tok.take());
        }
        else if (next == AND) {
            checkBeforePushingBinary();
            stack.push(tok.take());
        }
        else if (next == OR) {
            checkBeforePushingBinary();
            if (stack.length >= 3 && stack[stack.length - 2] == OR) { // Precedence magic
                var right = stack.pop();
                if (right === undefined)
                    throw "Assertion error";
                stack.pop(); // OR
                var left = stack.pop();
                if (left === undefined)
                    throw "Assertion error";
                stack.push(new OrTerm(left, right));
            }
            stack.push(tok.take());
        }
        else if (next == "(") { // Subformula
            checkBeforePushingUnary();
            stack.push(tok.take());
        }
        else if (next == ")") {
            finalReduce();
            if (stack.length < 2 || stack[stack.length - 2] != "(")
                throw { message: "Binary operator without second operand", position: tok.pos };
            tok.consume(next);
            stack.splice(stack.length - 2, 1);
            reduce();
        }
        else if (next == EMPTY)
            throw { message: "Empty not expected", position: tok.pos };
        else
            throw "Assertion error";
    }
    finalReduce();
    if (stack.length == 1)
        return stack[0];
    else if (stack.length == 0)
        throw { message: "Blank term", position: tok.pos };
    else
        throw { message: "Binary operator without second operand", position: tok.pos };
}
/* Tokenizer object */
// Tokenizes a formula into a stream of token strings.
var Tokenizer = /** @class */ (function () {
    function Tokenizer(str) {
        this.pos = 0;
        this.str = str;
        this.skipSpaces();
    }
    // Returns the next token as a string, or null if the end of the token stream is reached.
    Tokenizer.prototype.peek = function () {
        if (this.pos == this.str.length) // End of stream
            return null;
        var match = /^([A-Za-z][A-Za-z0-9]*|[,()!&|>\u2205\u00AC\u2227\u2228\u22A6]| +)/.exec(this.str.substring(this.pos));
        if (match == null)
            throw { message: "Invalid symbol", position: this.pos };
        // Normalize notation
        var token = match[0];
        if (token == "!")
            token = NOT;
        else if (token == "&")
            token = AND;
        else if (token == "|")
            token = OR;
        else if (token == ">")
            token = TURNSTILE;
        return token;
    };
    // Returns the next token as a string and advances this tokenizer past the token.
    Tokenizer.prototype.take = function () {
        var result = this.peek();
        if (result == null)
            throw "Advancing beyond last token";
        this.pos += result.length;
        this.skipSpaces();
        return result;
    };
    // Takes the next token and checks that it matches the given string, or throws an exception.
    Tokenizer.prototype.consume = function (s) {
        if (this.take() != s)
            throw "Token mismatch";
    };
    Tokenizer.prototype.skipSpaces = function () {
        var match = /^[ \t]*/.exec(this.str.substring(this.pos));
        if (match === null)
            throw "Assertion error";
        this.pos += match[0].length;
    };
    return Tokenizer;
}());
/* Miscellaneous */
// Unicode character constants (because this script file's character encoding is unspecified)
var TURNSTILE = "\u22A6";
var EMPTY = "\u2205";
var NOT = "\u00AC";
var AND = "\u2227";
var OR = "\u2228";
