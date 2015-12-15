/* 
 * 1D barcode generator
 * 
 * Copyright (c) 2015 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * http://www.nayuki.io/page/1d-barcode-generator-javascript
 */

"use strict";


/*---- User interface functions ----*/

// Each function takes a text string and returns an array of 0s and 1s
var BARCODE_GENERATOR_FUNCTIONS = {
	"code128"        : makeCode128Barcode,
	"code93"         : makeCode93Barcode,
	"code39"         : makeCode39Barcode,
	"interleaved2of5": makeInterleaved2Of5Barcode,
	"codabar"        : makeCodabarBarcode,
	"upca-raw"       : makeUpcABarcode,
	"ean13-raw"      : makeEan13Barcode,
	"ean8-raw"       : makeEan8Barcode,
	"upca-check"     : function(s) { return makeUpcABarcode (addCheckDigit(11, s)); },
	"ean13-check"    : function(s) { return makeEan13Barcode(addCheckDigit(12, s)); },
	"ean8-check"     : function(s) { return makeEan8Barcode (addCheckDigit( 7, s)); },
};

// Initialize HTML elements
var canvasElem = document.getElementById("canvas");
var graphics = canvasElem.getContext("2d");
var feedbackText = document.createTextNode("");
document.getElementById("feedback").appendChild(feedbackText);

// Set form input event handlers
document.querySelector("article form").onsubmit = function() {
	generate();
	return false;
};
for (var name in BARCODE_GENERATOR_FUNCTIONS)
	document.getElementById(name).onchange = generate;
document.getElementById("text").oninput = generate;
document.getElementById("barwidth").oninput = generate;


// The function is the one and only entry point from the HTML code.
function generate() {
	// Select barcode generator function based on radio buttons
	var func = null;
	for (var name in BARCODE_GENERATOR_FUNCTIONS) {
		if (document.getElementById(name).checked)
			func = BARCODE_GENERATOR_FUNCTIONS[name];
	}
	
	// Try to generate barcode
	graphics.clearRect(0, 0, canvasElem.width, canvasElem.height);
	var barcode;  // Array of 0s and 1s
	try {
		if (func == null)
			throw "Assertion error";
		barcode = func(document.getElementById("text").value);
		feedbackText.data = "OK";
	} catch (e) {
		feedbackText.data = "Error: " + e;
		return;
	}
	
	// Dimensions of canvas and new image
	var scale = parseInt(document.getElementById("barwidth").value, 10);
	var padding = 50;  // Number of pixels on each of the four sides
	var width  = canvasElem.width  = barcode.length * scale + padding * 2;
	var height = canvasElem.height = 200 + padding * 2;
	
	// Create image and fill with opaque white color
	var image = graphics.createImageData(width, height);
	var pixels = image.data;  // An array of bytes in RGBA format
	for (var i = 0; i < pixels.length; i++)
		pixels[i] = 0xFF;
	
	// Draw barcode onto image and canvas
	for (var y = padding; y < height - padding; y++) {
		for (var i = 0, x = padding; i < barcode.length; i++) {
			for (var j = 0; j < scale; j++, x++) {
				var k = ((y * width) + x) * 4;
				pixels[k + 0] = pixels[k + 1] = pixels[k + 2] = barcode[i] * 255;  // Red, green, blue channels
			}
		}
	}
	graphics.putImageData(image, 0, 0);
}


/*---- Barcode generator functions ----*/
// By convention, 0 means black and 1 means white

// Code 128 barcode
function makeCode128Barcode(s) {
	// Encode into a sequence of numbers
	var encoded = [104];  // Start code B
	for (var i = 0; i < s.length; i++) {
		var c = s.charCodeAt(i);
		if (c < 32) {
			encoded.push(98);  // Shift A
			encoded.push(c + 64);
		} else if (c < 128)
			encoded.push(c - 32);
		else
			throw "Text must only contain ASCII characters";
	}
	
	// Append checksum number
	var checksum = encoded[0];
	for (var i = 1; i < encoded.length; i++)
		checksum = (checksum + encoded[i] * i) % 103;
	encoded.push(checksum);
	
	// Build barcode
	var table = [
		"010011001", "011001001", "011001100", "110110011", "110111001", "111011001", "110011011", "110011101", "111001101", "011011011",
		"011011101", "011101101", "100110001", "110010001", "110011000", "100011001", "110001001", "110001100", "011000110", "011010001",
		"011011000", "010001101", "011000101", "001001000", "001011001", "001101001", "001101100", "001001101", "001100101", "001100110",
		"010010011", "010011100", "011100100", "101110011", "111010011", "111011100", "100111011", "111001011", "111001110", "010111011",
		"011101011", "011101110", "100100011", "100111000", "111001000", "100010011", "100011100", "111000100", "001000100", "010111000",
		"011101000", "010001011", "010001110", "010001000", "001010011", "001011100", "001110100", "001001011", "001001110", "001110010",
		"001000010", "011011110", "000111010", "101100111", "101111001", "110100111", "110111100", "111101001", "111101100", "100110111",
		"100111101", "110010111", "110011110", "111100101", "111100110", "011110110", "011010111", "000100010", "011110101", "111000010",
		"101100001", "110100001", "110110000", "100001101", "110000101", "110000110", "000101101", "000110101", "000110110", "010010000",
		"010000100", "000100100", "101000011", "101110000", "111010000", "100001011", "100001110", "000101011", "000101110", "100010000",
		"100001000", "001010000", "000101000", "010111101", "010110111", "010110001",
	];
	var result = [];
	for (var i = 0; i < encoded.length; i++)
		appendDigits(result, "0" + table[encoded[i]] + "1");
	appendDigits(result, "0011100010100");  // Stop code
	return result;
}


// Code 93 barcode
function makeCode93Barcode(s) {
	// Escape the string
	var t = "";
	for (var i = 0; i < s.length; i++) {
		var c = s.charCodeAt(i);
		if (c >= 128)
			throw "Text must only contain ASCII characters";
		else if (c == 32 || c == 45 || c == 46 || c >= 48 && c <= 57 || c >= 65 && c <= 90)
			t += String.fromCharCode(c);
		else if (c ==   0) t += "bU";
		else if (c ==  64) t += "bV";
		else if (c ==  96) t += "bW";
		else if (c == 127) t += "bT";
		else if (c <=  26) t += "a" + String.fromCharCode(c -   1 + 65);
		else if (c <=  31) t += "b" + String.fromCharCode(c -  27 + 65);
		else if (c <=  58) t += "c" + String.fromCharCode(c -  33 + 65);
		else if (c <=  63) t += "b" + String.fromCharCode(c -  54 + 65);
		else if (c <=  95) t += "b" + String.fromCharCode(c -  81 + 65);
		else if (c <= 122) t += "d" + String.fromCharCode(c -  97 + 65);
		else if (c <= 126) t += "b" + String.fromCharCode(c - 108 + 65);
		else throw "Assertion error";
	}
	s = t;  // s is reduced into the 47-symbol 'alphabet' defined below
	
	// Add 2 checksum symbols
	var alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%abcd*";  // The 5 characters abcd* are special
	for (var mod = 20; mod >= 15; mod -= 5) {
		var checksum = 0;
		for (var i = 0; i < s.length; i++) {
			var code = alphabet.indexOf(s.charAt(s.length - 1 - i));
			var weight = i % mod + 1;
			checksum = (checksum + code * weight) % 47;
		}
		s += alphabet.charAt(checksum);
	}
	s = "*" + s + "*";  // Start and end
	
	// Build barcode
	var table = [  // Length 48, same as 'alphabet'
		"1110101", "1011011", "1011101", "1011110", "1101011", "1101101", "1101110", "1010111", "1110110", "1111010",
		"0101011", "0101101", "0101110", "0110101", "0110110", "0111010", "1001011", "1001101", "1001110", "1100101",
		"1110010", "1010011", "1011001", "1011100", "1101001", "1110100", "0100101", "0100110", "0101001", "0101100",
		"0110100", "0110010", "1001001", "1001100", "1100100", "1100010", "1101000", "0010101", "0010110", "0011010",
		"1001000", "1000100", "0101000", "1101100", "0010010", "0010100", "1100110", "1010000",
	];
	var result = [];
	for (var i = 0; i < s.length; i++)
		appendDigits(result, "0" + table[alphabet.indexOf(s.charAt(i))] + "1");
	result.push(0);  // Final black bar
	return result;
}


// Code 39 barcode
function makeCode39Barcode(s) {
	if (!/^[0-9A-Z. +\/$%-]*$/.test(s))
		throw "Text must only contain allowed characters";
	
	// Parameters. The spec recommends that 2.0 <= wide/narrow <= 3.0
	var narrow = 2;
	var wide = 5;
	
	var table = {
		"1":"wnnwnnnnw", "2":"nnwwnnnnw", "3":"wnwwnnnnn", "4":"nnnwwnnnw", "5":"wnnwwnnnn",
		"6":"nnwwwnnnn", "7":"nnnwnnwnw", "8":"wnnwnnwnn", "9":"nnwwnnwnn", "0":"nnnwwnwnn",
		"A":"wnnnnwnnw", "B":"nnwnnwnnw", "C":"wnwnnwnnn", "D":"nnnnwwnnw", "E":"wnnnwwnnn",
		"F":"nnwnwwnnn", "G":"nnnnnwwnw", "H":"wnnnnwwnn", "I":"nnwnnwwnn", "J":"nnnnwwwnn",
		"K":"wnnnnnnww", "L":"nnwnnnnww", "M":"wnwnnnnwn", "N":"nnnnwnnww", "O":"wnnnwnnwn",
		"P":"nnwnwnnwn", "Q":"nnnnnnwww", "R":"wnnnnnwwn", "S":"nnwnnnwwn", "T":"nnnnwnwwn",
		"U":"wwnnnnnnw", "V":"nwwnnnnnw", "W":"wwwnnnnnn", "X":"nwnnwnnnw", "Y":"wwnnwnnnn",
		"Z":"nwwnwnnnn", "-":"nwnnnnwnw", ".":"wwnnnnwnn", " ":"nwwnnnwnn", "*":"nwnnwnwnn",
		"+":"nwnnnwnwn", "/":"nwnwnnnwn", "$":"nwnwnwnnn", "%":"nnnwnwnwn",
	};
	s = "*" + s + "*";  // Note: '*' is disallowed in the input string
	var result = [];
	for (var i = 0; i < s.length; i++) {
		var code = table[s.charAt(i)] + "n";
		for (var j = 0, color = 0; j < code.length; j++, color ^= 1)
			appendRepeat(result, color, code.charAt(j) == "n" ? narrow : wide);
	}
	return result;
}


// Interleaved 2 of 5 barcode
function makeInterleaved2Of5Barcode(s) {
	if (!/^(\d\d)*$/.test(s))
		throw "Text must be all digits and even length";
	
	// Parameters. The spec recommends that 2.0 <= wide/narrow <= 3.0
	var narrow = 2;
	var wide = 5;
	
	// Encode symbol pairs and interleave bars
	var table = ["nnwwn", "wnnnw", "nwnnw", "wwnnn", "nnwnw", "wnwnn", "nwwnn", "nnnww", "wnnwn", "nwnwn"];
	var encoded = "";  // String of n/w characters
	encoded += "nnnn";  // Start
	for (var i = 0; i < s.length; i += 2) {
		var a = table[parseInt(s.charAt(i + 0), 10)];
		var b = table[parseInt(s.charAt(i + 1), 10)];
		for (var j = 0; j < 5; j++)
			encoded += a.charAt(j) + b.charAt(j);
	}
	encoded += "wnn";  // Stop
	
	// Synthesize bars according to length with alternating colors
	var result = [];
	for (var i = 0, color = 0; i < encoded.length; i++, color ^= 1)
		appendRepeat(result, color, encoded.charAt(i) == "n" ? narrow : wide);
	return result;
}


// Codabar barcode
function makeCodabarBarcode(s) {
	if (!/^[0-9$$\/:.+-]*$/.test(s))
		throw "Text must only contain allowed characters";
	
	// Parameters. The spec recommends that 2.25 <= wide/narrow <= 3.0
	var narrow = 2;
	var wide = 5;
	
	// Build barcode
	var table = {
		"0":"nnnnnww", "1":"nnnnwwn", "2":"nnnwnnw", "3":"wwnnnnn",
		"4":"nnwnnwn", "5":"wnnnnwn", "6":"nwnnnnw", "7":"nwnnwnn",
		"8":"nwwnnnn", "9":"wnnwnnn", "-":"nnnwwnn", "$":"nnwwnnn",
		".":"wnwnwnn", "/":"wnwnnnw", ":":"wnnnwnw", "+":"nnwnwnw",
		"A":"nnwwnwn", "B":"nwnwnnw", "C":"nnnwnww", "D":"nnnwwwn",
	};
	s = "A" + s + "A";  // Start and stop symbols (can be A/B/C/D)
	var result = [];
	for (var i = 0; i < s.length; i++) {
		var code = table[s.charAt(i)] + "n";
		for (var j = 0, color = 0; j < code.length; j++, color ^= 1)
			appendRepeat(result, color, code.charAt(j) == "n" ? narrow : wide);
	}
	return result;
}


// UPC-A barcode
function makeUpcABarcode(s) {
	if (!/^\d{12}$/.test(s))
		throw "Text must be 12 digits long";
	
	var table = ["1110010", "1100110", "1101100", "1000010", "1011100", "1001110", "1010000", "1000100", "1001000", "1110100"];
	var result = [];
	appendDigits(result, "010");  // Start
	for (var i = 0; i < s.length; i++) {
		if (i == s.length / 2)
			appendDigits(result, "10101");  // Middle
		var code = table[parseInt(s.charAt(i), 10)];
		if (i >= s.length / 2)
			code = invertBits(code);
		appendDigits(result, code);
	}
	appendDigits(result, "010");  // End
	return result;
}


// EAN-13 barcode
function makeEan13Barcode(s) {
	if (!/^\d{13}$/.test(s))
		throw "Text must be 13 digits long";
	
	var table0 = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];
	var table1 = ["11001", "10011", "10110", "00001", "01110", "00111", "01000", "00010", "00100", "11010"];
	var result = [];
	appendDigits(result, "010");  // Start
	var leftCtrl = table0[parseInt(s.charAt(0), 10)];  // Leading digit
	for (var i = 1; i < 7; i++) {  // Left remaining half
		var code = "1" + table1[parseInt(s.charAt(i), 10)] + "0";
		if (leftCtrl.charAt(i - 1) == "G") {
			var newCode = "";  // Reversed
			for (var j = code.length - 1; j >= 0; j--)
				newCode += code.charAt(j);
			code = invertBits(newCode);
		}
		appendDigits(result, code);
	}
	appendDigits(result, "10101");  // Center
	for (var i = 7; i < 13; i++)  // Right remaining half
		appendDigits(result, invertBits("1" + table1[parseInt(s.charAt(i), 10)] + "0"));
	appendDigits(result, "010");  // End
	return result;
}


// EAN-8 barcode
function makeEan8Barcode(s) {
	if (!/^\d{8}$/.test(s))
		throw "Text must be 8 digits long";
	
	var table = ["11001", "10011", "10110", "00001", "01110", "00111", "01000", "00010", "00100", "11010"];
	var result = [];
	appendDigits(result, "010");  // Start
	for (var i = 0; i < s.length; i++) {
		if (i == s.length / 2)
			appendDigits(result, "10101");  // Center
		var code = "1" + table[parseInt(s.charAt(i), 10)] + "0";
		if (i >= s.length / 2)
			code = invertBits(code);  // Invert right half
		appendDigits(result, code);
	}
	appendDigits(result, "010");  // End
	return result;
}


/*---- Shared utility functions ----*/

// e.g. array = [1, 1]; appendDigits(array, "001"); array equals [1, 1, 0, 0, 1].
function appendDigits(arr, str) {
	for (var i = 0; i < str.length; i++)
		arr.push(+str.charAt(i));  // Abuses JavaScript weak type coercion
}


// e.g. array = []; appendRepeat(array, 1, 3); array equals [1,1,1].
function appendRepeat(arr, digit, rep) {
	for (var i = 0; i < rep; i++)
		arr.push(digit);
}


// e.g. "001101" -> "110010".
function invertBits(s) {
	return s.replace(/./g, function(d) { return (1 - d) + ""; });  // Abuses JavaScript weak type coercion
}


// e.g. addCheckDigit(7, "3216548") -> "32165487".
function addCheckDigit(len, s) {
	if (!/^\d*$/.test(s) || s.length != len)
		throw "Text must be " + len + " digits long";
	var sum = 0;
	for (var i = 0; i < s.length; i++) {
		var weight = i % 2 == 0 ? 3 : 1;  // Rightmost digit has weight of 3, then alternate 1 and 3
		sum += parseInt(s.charAt(s.length - 1 - i), 10) * weight;
	}
	return s + (10 - sum % 10) % 10;
}
