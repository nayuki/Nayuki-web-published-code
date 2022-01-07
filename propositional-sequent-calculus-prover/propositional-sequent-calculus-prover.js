/*
 * Propositional sequent calculus prover (compiled from TypeScript)
 *
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/propositional-sequent-calculus-prover
 */
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
function doProve(inputSequent) {
    document.getElementById("inputSequent").value = inputSequent;
    function clearChildren(node) {
        while (node.firstChild !== null)
            node.removeChild(node.firstChild);
    }
    var msgElem = document.getElementById("message");
    var codeOutElem = document.getElementById("codeOutput");
    var proofElem = document.getElementById("proof");
    clearChildren(msgElem);
    clearChildren(codeOutElem);
    clearChildren(proofElem);
    try {
        var seq = parseSequent(new Tokenizer(inputSequent));
        var proof = prove(seq);
        msgElem.textContent = "Proof:";
        proofElem.appendChild(proof.toHtml());
    }
    catch (e) {
        if (e instanceof ParseError) {
            msgElem.textContent = "Syntax error: " + e.message;
            codeOutElem.textContent = inputSequent.substring(0, e.position);
            var highlight = codeOutElem.appendChild(document.createElement("u"));
            if (e.position < inputSequent.length) {
                highlight.textContent = inputSequent.substring(e.position, e.position + 1);
                codeOutElem.appendChild(document.createTextNode(inputSequent.substring(e.position + 1)));
            }
            else
                highlight.textContent = " ";
        }
        else if (e instanceof Error)
            msgElem.textContent = "Error: " + e.message;
        else
            msgElem.textContent = "Error: " + e;
    }
}
/* Data types */
var Tree = /** @class */ (function () {
    // Constructs a proof tree. Has zero, one, or two children.
    function Tree(
    // The value at this node - either a sequent or the string "Fail".
    sequent) {
        var children = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            children[_i - 1] = arguments[_i];
        }
        this.sequent = sequent;
        if (typeof sequent == "string" && sequent != "Fail" || children.length > 2)
            throw new RangeError("Invalid value");
        this.children = children;
    }
    Tree.prototype.toHtml = function () {
        var result = document.createElement("li");
        if (typeof this.sequent == "string")
            result.textContent = this.sequent;
        else
            result.appendChild(this.sequent.toHtml());
        var ul = document.createElement("ul");
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var subtree = _a[_i];
            result.appendChild(ul);
            ul.appendChild(subtree.toHtml());
        }
        return result;
    };
    return Tree;
}());
var Sequent = /** @class */ (function () {
    // Constructs a sequent.
    function Sequent(
    // Zero or more terms.
    left, 
    // Zero or more terms.
    right) {
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
            var elem = result.appendChild(document.createElement("span"));
            elem.textContent = text;
            elem.className = clsName;
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
            left[i] = term.left;
            var seq0 = new Sequent(left, right);
            left = left.slice();
            left[i] = term.right;
            var seq1 = new Sequent(left, right);
            return new Tree(sequent, prove(seq0), prove(seq1));
        }
    }
    for (var i = 0; i < right.length; i++) {
        var term = right[i];
        if (term instanceof AndTerm) {
            right[i] = term.left;
            var seq0 = new Sequent(left, right);
            right = right.slice();
            right[i] = term.right;
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
        else if (next === null)
            throw new ParseError("Comma or turnstile expected", tok.pos);
        else {
            if (expectComma) {
                if (next == ",")
                    tok.consume(next);
                else
                    throw new ParseError("Comma expected", tok.pos);
                if (tok.peek() === null)
                    throw new ParseError("Term expected", tok.pos);
            }
            else {
                if (tok.peek() != ",")
                    expectComma = true;
                else
                    throw new ParseError("Term or turnstile expected", tok.pos);
            }
            var term = parseTerm(tok);
            if (term !== null)
                lhs.push(term);
        }
    }
    // Parse right side
    var rhs = [];
    for (var expectComma = false;;) {
        var next = tok.peek();
        if (next === null)
            break;
        else if (next == TURNSTILE)
            throw new ParseError("Turnstile not expected", tok.pos);
        else {
            if (expectComma) {
                if (next == ",")
                    tok.consume(next);
                else
                    throw new ParseError("Comma expected", tok.pos);
                if (tok.peek() === null)
                    throw new ParseError("Term expected", tok.pos);
            }
            else {
                if (tok.peek() != ",")
                    expectComma = true;
                else
                    throw new ParseError("Term or end expected", tok.pos);
            }
            var term = parseTerm(tok);
            if (term !== null)
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
    function isTerm(x) {
        return typeof x != "string";
    }
    function reduce() {
        while (true) {
            if (stack.length >= 2 && stack[stack.length - 2] == NOT) {
                var term = stack.pop();
                stack.pop(); // NOT
                stack.push(new NotTerm(term));
            }
            else if (stack.length >= 3 && isTerm(stack[stack.length - 1]) && stack[stack.length - 2] == AND && isTerm(stack[stack.length - 3])) {
                var right = stack.pop();
                stack.pop(); // AND
                var left = stack.pop();
                stack.push(new AndTerm(left, right));
            }
            else
                break;
        }
    }
    function finalReduce() {
        while (stack.length >= 3 && isTerm(stack[stack.length - 1]) && stack[stack.length - 2] == OR && isTerm(stack[stack.length - 3])) {
            var right = stack.pop();
            stack.pop(); // OR
            var left = stack.pop();
            stack.push(new OrTerm(left, right));
        }
    }
    function checkBeforePushingUnary() {
        if (stack.length > 0 && isTerm(stack[stack.length - 1]))
            throw new ParseError("Unexpected item", tok.pos);
    }
    function checkBeforePushingBinary() {
        if (stack.length == 0 || !isTerm(stack[stack.length - 1]))
            throw new ParseError("Unexpected item", tok.pos);
    }
    while (true) {
        var next = tok.peek();
        if (next === null || next == TURNSTILE || next == ",")
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
            finalReduce();
            stack.push(tok.take());
        }
        else if (next == "(") { // Subformula
            checkBeforePushingUnary();
            stack.push(tok.take());
        }
        else if (next == ")") {
            finalReduce();
            if (stack.length < 2 || stack[stack.length - 2] != "(")
                throw new ParseError("Binary operator without second operand", tok.pos);
            tok.consume(next);
            stack.splice(stack.length - 2, 1);
            reduce();
        }
        else if (next == EMPTY)
            throw new ParseError("Empty not expected", tok.pos);
        else
            throw new Error("Assertion error");
    }
    finalReduce();
    if (stack.length == 1 && isTerm(stack[0]))
        return stack[0];
    else if (stack.length == 0)
        throw new ParseError("Blank term", tok.pos);
    else
        throw new ParseError("Expected more", tok.pos);
}
/* Tokenizer object */
// Tokenizes a formula into a stream of token strings.
var Tokenizer = /** @class */ (function () {
    function Tokenizer(str) {
        this.str = str;
        this.pos = 0;
        this.skipSpaces();
    }
    // Returns the next token as a string, or null if the end of the token stream is reached.
    Tokenizer.prototype.peek = function () {
        if (this.pos == this.str.length) // End of stream
            return null;
        var match = /^([A-Za-z][A-Za-z0-9]*|[,()!&|>\u2205\u00AC\u2227\u2228\u22A6]| +)/.exec(this.str.substring(this.pos));
        if (match === null)
            throw new ParseError("Invalid symbol", this.pos);
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
        if (result === null)
            throw new Error("Advancing beyond last token");
        this.pos += result.length;
        this.skipSpaces();
        return result;
    };
    // Takes the next token and checks that it matches the given string, or throws an exception.
    Tokenizer.prototype.consume = function (s) {
        if (this.take() != s)
            throw new Error("Token mismatch");
    };
    Tokenizer.prototype.skipSpaces = function () {
        var match = /^[ \t]*/.exec(this.str.substring(this.pos));
        if (match === null)
            throw new Error("Assertion error");
        this.pos += match[0].length;
    };
    return Tokenizer;
}());
var ParseError = /** @class */ (function (_super) {
    __extends(ParseError, _super);
    function ParseError(message, position) {
        var _this = _super.call(this, message) || this;
        _this.position = position;
        Object.setPrototypeOf(_this, ParseError.prototype); // ECMAScript 5 compatibility
        return _this;
    }
    return ParseError;
}(Error));
/* Miscellaneous */
// Unicode character constants (because this script file's character encoding is unspecified)
var TURNSTILE = "\u22A6";
var EMPTY = "\u2205";
var NOT = "\u00AC";
var AND = "\u2227";
var OR = "\u2228";
