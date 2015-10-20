/* 
 * Factorize Gaussian integer
 * 
 * Copyright (c) 2015 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * http://www.nayuki.io/page/factorize-gaussian-integer-javascript
 */

"use strict";


/* 
 * Handles the HTML input/output for factoring a Gaussian integer.
 */
function factor() {
	var outElem = document.getElementById("factorization");
	while (outElem.firstChild != null)
		outElem.removeChild(outElem.firstChild);
	var input = document.getElementById("number").value;
	if (/^\s*$/.test(input)) {
		outElem.appendChild(document.createTextNode(NBSP));
		return;
	}
	
	function appendTextNode(elem, str) {
		elem.appendChild(document.createTextNode(str));
	}
	
	function appendGaussianInteger(n) {
		var s = n.toString();
		if (s.charAt(s.length - 1) != "i")
			appendTextNode(outElem, s);
		else {
			var varElem = document.createElement("var");
			appendTextNode(varElem, "i");
			appendTextNode(outElem, s.substr(0, s.length - 1));
			outElem.appendChild(varElem);
		}
	}
	
	try {
		var num = parseGaussianInteger(input);
		var factorization = num.factorize();
		
		appendGaussianInteger(num);
		appendTextNode(outElem, " = ");
		factorization.forEach(function(factor, i) {
			if (i > 0)
				appendTextNode(outElem, " ");
			appendTextNode(outElem, "(");
			appendGaussianInteger(factor);
			appendTextNode(outElem, ")");
		});
	} catch (e) {
		outElem.appendChild(document.createTextNode(e.toString()));
	}
}


function random() {
	function randInt() {
		return Math.floor(Math.random() * 2000) - 1000;
	}
	
	var type = Math.random();
	var str;
	if (type < 0.2)
		str = randInt();
	else if (type < 0.3)
		str = randInt() + "i";
	else {
		var real = randInt();
		var imag = randInt();
		str = real + (imag >= 0 ? " + " : " - ") + Math.abs(imag) + "i";
	}
	document.getElementById("number").value = str;
	factor();
}


function GaussianInteger(real, imag) {
	this.real = real;
	this.imag = imag;
	
	this.norm = function() {
		return real * real + imag * imag;
	};
	
	this.multiply = function(other) {
		return new GaussianInteger(real * other.real - imag * other.imag, real * other.imag + imag * other.real);
	};
	
	this.isDivisibleBy = function(re, im) {
		var norm = re * re + im * im;
		return (real * re + imag * im) % norm == 0 && (-real * im + imag * re) % norm == 0;
	};
	
	this.divide = function(other) {
		if (!this.isDivisibleBy(other.real, other.imag))
			throw "Cannot divide";
		return new GaussianInteger((real * other.real + imag * other.imag) / other.norm(), (-real * other.imag + imag * other.real) / other.norm());
	};
	
	this.factorize = function() {
		if (this.norm() <= 1)  // 0, 1, -1, i, -i
			return [this];
		
		var result = [];
		var temp = this;
		var check = new GaussianInteger(1, 0);
		while (temp.norm() > 1) {
			var factor = temp.findPrimeFactor();
			result.push(factor);
			temp = temp.divide(factor);
			check = check.multiply(factor);
		}
		check = check.multiply(temp);
		if (temp.norm() != 1 || check.real != real || check.imag != imag)
			throw "Assertion error";
		if (temp.real != 1)  // -1, i, -i
			result.push(temp);
		
		result.sort(function(x, y) {
			if      (x.norm() < y.norm()) return -1;
			else if (x.norm() > y.norm()) return +1;
			else if (x.real > y.real) return -1;
			else if (x.real < y.real) return +1;
			else return 0;
		});
		return result;
	};
	
	this.findPrimeFactor = function() {
		var norm = this.norm();
		if (norm % 2 == 0)
			return new GaussianInteger(1, 1);
		
		var end = Math.floor(Math.sqrt(norm));
		for (var i = 3; i <= end; i += 2) {  // Find factors of norm
			if (norm % i == 0) {
				if (i % 4 == 3)
					return new GaussianInteger(i, 0);
				else {
					for (var re = Math.floor(Math.sqrt(i)); re > 0; re--) {
						var im = Math.round(Math.sqrt(i - re * re));
						if (re * re + im * im == i && this.isDivisibleBy(re, im))
							return new GaussianInteger(re, im);
					}
				}
			}
		}
		
		// This number itself is prime. Rotate so that the argument is in [0, pi/2)
		var temp = this;
		while (temp.real < 0 || temp.imag < 0)
			temp = temp.multiply(new GaussianInteger(0, 1));
		return temp;
	};
	
	this.toString = function() {
		if (real == 0 && imag == 0)
			return "0";
		else {
			var result = "";
			if (real != 0)
				result += real > 0 ? real : MINUS + (-real);
			if (imag != 0) {
				if (result == "")
					result += imag > 0 ? "" : MINUS;
				else
					result += imag > 0 ? " + " : " " + MINUS + " ";
				result += (Math.abs(imag) != 1 ? Math.abs(imag) : "") + "i";
			}
			return result;
		}
	};
}


function parseGaussianInteger(str) {
	if (/\d\s+\d/.test(str))  // Spaces are not allowed between digits
		throw "Invalid number";
	str = str.replace(/\s+/g, "");  // Remove all whitespace
	str = str.replace(/\u2212/g, "-");
	str = str.replace(/j/g, "i");
	
	function checkedParseInt(s) {
		var n = parseInt(s, 10);
		if (Math.abs(n) >= 67108864)
			throw "Number is too large";
		return n;
	}
	
	// Match one of the syntax cases
	var real;
	var imag;
	var m;
	if ((m = /^([+-]?\d+)$/.exec(str)) != null) {  // e.g. 1, +0, -2
		real = checkedParseInt(m[1]);
		imag = 0;
	} else if ((m = /^([+-]?)(\d*)i$/.exec(str)) != null) {  // e.g. i, 4i, -3i
		real = 0;
		imag = checkedParseInt(m[1] + (m[2] != "" ? m[2] : "1"));
	} else if ((m = /^([+-]?\d+)([+-])(\d*)i$/.exec(str)) != null) {  // e.g. 1+2i, -3-4i, +5+i
		real = checkedParseInt(m[1]);
		imag = checkedParseInt(m[2] + (m[3] != "" ? m[3] : "1"));
	} else if ((m = /^([+-]?)(\d*)i([+-]\d+)$/.exec(str)) != null) {  // e.g. 2i+1, -4i-3, +i+5
		real = checkedParseInt(m[3]);
		imag = checkedParseInt(m[1] + (m[2] != "" ? m[2] : "1"));
	} else
		throw "Invalid number";
	return new GaussianInteger(real, imag);
}


var MINUS = "\u2212";
var NBSP  = "\u00A0";
