/* 
 * Random password generator (JavaScript)
 * 
 * Copyright (c) 2018 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/random-password-generator-javascript
 */

"use strict";


var CHARACTER_SETS = [
	[true, "Numbers", "0123456789"],
	[true, "Lowercase", "abcdefghijklmnopqrstuvwxyz"],
	[false, "Uppercase", "ABCDEFGHIJKLMNOPQRSTUVWXYZ"],
	[false, "ASCII symbols", "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"],
	[false, "Space", " "],
];


var passwordElem = document.getElementById("password");
var statisticsElem = document.getElementById("statistics");
statisticsElem.textContent = "\u00A0";

function init() {
	var elements = document.createDocumentFragment();
	CHARACTER_SETS.forEach(function(entry, i) {
		var spanElem = document.createElement("span");
		var inputElem = document.createElement("input");
		inputElem.type = "checkbox";
		inputElem.checked = entry[0];
		inputElem.id = "charset-" + i;
		spanElem.appendChild(inputElem);
		var labelElem = document.createElement("label");
		labelElem.htmlFor = inputElem.id;
		labelElem.textContent = " " + entry[1] + " ";
		var smallElem = document.createElement("small");
		smallElem.textContent = "(" + entry[2] + ")";
		labelElem.appendChild(smallElem);
		spanElem.appendChild(labelElem);
		elements.appendChild(spanElem);
		elements.appendChild(document.createElement("br"));
	});
	var containerElem = document.getElementById("charset-checkboxes");
	containerElem.insertBefore(elements, containerElem.firstChild);
}

init();


// The one and only function called from the HTML code
function generate() {
	// Gather the character set
	var charsetStr = "";
	CHARACTER_SETS.forEach(function(entry, i) {
		if (document.getElementById("charset-" + i).checked)
			charsetStr += entry[2];
	});
	if (document.getElementById("custom").checked)
		charsetStr += document.getElementById("customchars").value;
	charsetStr = charsetStr.replace(/ /, "\u00A0");  // Replace space with non-breaking space
	
	// Convert to array and remove duplicate characters
	var charset = [];
	for (var i = 0; i < charsetStr.length; i++) {
		var c = charsetStr.charCodeAt(i);
		var s = null;
		if (c < 0xD800 || c >= 0xE000)  // Regular UTF-16 character
			s = charsetStr.charAt(i);
		else if (0xD800 <= c && c < 0xDC00) {  // High surrogate
			if (i + 1 < charsetStr.length) {
				var d = charsetStr.charCodeAt(i + 1);
				if (0xDC00 <= d && d < 0xE000) {
					// Valid character in supplementary plane
					s = charsetStr.substr(i, 2);
					i++;
				}
				// Else discard unpaired surrogate
			}
		} else if (0xDC00 <= d && d < 0xE000)  // Low surrogate
			i++;  // Discard unpaired surrogate
		else
			throw "Assertion error";
		if (s != null && charset.indexOf(s) == -1)
			charset.push(s);
	}
	
	var password = "";
	var statistics = "";
	if (charset.length == 0)
		alert("Error: Character set is empty");
	else if (document.getElementById("by-entropy").checked && charset.length == 1)
		alert("Error: Need at least 2 distinct characters in set");
	else {
		var length;
		if (document.getElementById("by-length").checked)
			length = parseInt(document.getElementById("length").value, 10);
		else if (document.getElementById("by-entropy").checked)
			length = Math.ceil(parseFloat(document.getElementById("entropy").value) * Math.log(2) / Math.log(charset.length));
		else
			throw "Assertion error";
		
		if (length < 0)
			alert("Negative password length");
		else if (length > 10000)
			alert("Password length too large");
		else {
			for (var i = 0; i < length; i++)
				password += charset[randomInt(charset.length)];
			
			var entropy = Math.log(charset.length) * length / Math.log(2);
			var entropystr;
			if (entropy < 70)
				entropystr = entropy.toFixed(2);
			else if (entropy < 200)
				entropystr = entropy.toFixed(1);
			else
				entropystr = entropy.toFixed(0);
			statistics = "Length = " + length + " chars, \u00A0\u00A0Charset size = " + charset.length + " symbols, \u00A0\u00A0Entropy = " + entropystr + " bits";
		}
	}
	passwordElem.textContent = password;
	statisticsElem.textContent = statistics;
}


// Returns a random integer in the range [0, n) using a variety of methods
function randomInt(n) {
	var x = randomIntMathRandom(n);
	x = (x + randomIntBrowserCrypto(n)) % n;
	return x;
}


// Not secure or high quality, but always available
function randomIntMathRandom(n) {
	var x = Math.floor(Math.random() * n);
	if (x < 0 || x >= n)
		throw "Arithmetic exception";
	return x;
}


var cryptoObject = null;

// Uses a secure, unpredictable random number generator if available; otherwise returns 0
function randomIntBrowserCrypto(n) {
	if (cryptoObject == null)
		return 0;
	// Generate an unbiased sample
	var x = new Uint32Array(1);
	do cryptoObject.getRandomValues(x);
	while (x[0] - x[0] % n > 4294967296 - n);
	return x[0] % n;
}


function initCrypto() {
	var elem = document.getElementById("crypto-getrandomvalues-entropy");
	elem.textContent = "\u2717";
	
	if ("crypto" in window)
		cryptoObject = crypto;
	else if ("msCrypto" in window)
		cryptoObject = msCrypto;
	else
		return;
	
	if ("getRandomValues" in cryptoObject && "Uint32Array" in window && typeof Uint32Array == "function")
		elem.textContent = "\u2713";
	else
		cryptoObject = null;
}


initCrypto();
