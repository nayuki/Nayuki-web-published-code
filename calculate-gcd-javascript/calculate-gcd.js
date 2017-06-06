/* 
 * GCD calculator
 * 
 * Copyright (c) 2017 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/calculate-gcd-javascript
 */

"use strict";


/*---- Entry points from HTML code ----*/

function calculate() {
	function setOutput(s) {
		document.getElementById("output").value = s;
	}
	
	var x = document.getElementById("numberX").value;
	var y = document.getElementById("numberY").value;
	if (x == "" || y == "") {
		setOutput("");
		return;
	}
	try {
		x = new Uint(x);
		y = new Uint(y);
	} catch (e) {
		setOutput("Not an integer");
		return;
	}
	try {
		setOutput(gcd(x, y).toString());
	} catch (e) {
		setOutput("Internal error");
	}
}


var randomClicked = 0;

function random() {
	randomClicked++;
	var limit = randomClicked / 10;
	var len = Math.floor(Math.random() * limit) + 1;
	function genRandom() {
		var result = "";
		for (var i = 0; i < len; i++)
			result += Math.floor(Math.random() * 10);
		while (result.length > 1 && result.startsWith("0"))
			result = result.substring(1);
		return result;
	}
	document.getElementById("numberX").value = genRandom();
	document.getElementById("numberY").value = genRandom();
	calculate();
}


/*---- Algorithms and structures ----*/

// Returns the GCD of the given Uint objects, using the binary GCD algorithm.
function gcd(x, y) {
	var twos = 0;
	while (true) {
		if (x.isLessThan(y)) {
			var temp = x;
			x = y;
			y = temp;
		}
		if (y.isZero())
			break;
		if (x.isEven() && y.isEven()) {
			x = x.divide2Exact();
			y = y.divide2Exact();
			twos++;
		} else if (x.isEven())
			x = x.divide2Exact();
		else if (y.isEven())
			y = y.divide2Exact();
		else
			x = x.subtract(y).divide2Exact();
	}
	for (var i = 0; i < twos; i++)
		x = x.multiply(2);
	return x;
}


// An unsigned big integer represented in decimal (base 10).
function Uint(val) {
	// Constructor
	if (typeof val == "string") {
		if (!/^[0-9]+$/.test(val))
			throw "Invalid number string";
		this.digits = [];
		for (var i = 0; i < val.length; i++)
			this.digits.push(parseInt(val.charAt(i), 10));
		this.digits.reverse();
	} else if (Array.isArray(val)) {
		if (val.length == 0)
			this.digits = [0];
		else
			this.digits = val.slice();
	} else
		throw "Invalid argument type";
	// Remove trailing zeros
	while (this.digits.length > 1 && this.digits[this.digits.length - 1] == 0)
		this.digits.pop();
	
	// Arithmetic methods
	
	this.isZero = function() {
		for (var i = 0; i < this.digits.length; i++) {
			if (this.digits[i] != 0)
				return false;
		}
		return true;
	};
	
	this.isEven = function() {
		return this.digits[0] % 2 == 0;
	};
	
	this.isLessThan = function(other) {
		var result = false;
		var a = this.digits;
		var b = other.digits;
		for (var i = 0; i < a.length || i < b.length; i++) {
			var x = i < a.length ? a[i] : 0;
			var y = i < b.length ? b[i] : 0;
			if (x < y)
				result = true;
			if (x > y)
				result = false;
		}
		return result;
	};
	
	this.subtract = function(other) {
		var newDigits = [];
		var borrow = 0;
		var a = this.digits;
		var b = other.digits;
		for (var i = 0; i < a.length || i < b.length; i++) {
			var x = i < a.length ? a[i] : 0;
			var y = i < b.length ? b[i] : 0;
			var diff = x - y - borrow;
			borrow = -Math.floor(diff / 10);
			newDigits.push(diff + borrow * 10);
		}
		if (borrow > 0)
			throw "Negative result";
		return new Uint(newDigits);
	};
	
	// n must be a plain integer in the range [0, 9].
	this.multiply = function(n) {
		var newDigits = [];
		var carry = 0;
		this.digits.forEach(function(digit) {
			var sum = digit * n + carry;
			newDigits.push(sum % 10);
			carry = Math.floor(sum / 10);
		});
		if (carry > 0)
			newDigits.push(carry);
		return new Uint(newDigits);
	};
	
	this.divide2Exact = function() {
		if (!this.isEven())
			throw "Number is odd";
		var temp = this.multiply(5);
		var newDigits = temp.digits.slice();
		newDigits.shift();
		return new Uint(newDigits);
	};
	
	this.toString = function() {
		return this.digits.slice().reverse().map(function(digit) { return digit.toString(); }).join("");
	};
}
