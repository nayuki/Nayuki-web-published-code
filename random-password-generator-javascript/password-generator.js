/* 
 * Random password generator (JavaScript)
 * 
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/random-password-generator-javascript
 */

"use strict";


/*---- Configuration ----*/

var CHARACTER_SETS = [
	[true, "Numbers", "0123456789"],
	[true, "Lowercase", "abcdefghijklmnopqrstuvwxyz"],
	[false, "Uppercase", "ABCDEFGHIJKLMNOPQRSTUVWXYZ"],
	[false, "ASCII symbols", "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"],
	[false, "Space", " "],
];



/*---- Global variables ----*/

var passwordElem   = document.getElementById("password"   );
var statisticsElem = document.getElementById("statistics" );
var copyElem       = document.getElementById("copy-button")
var cryptoObject    = null;
var currentPassword = null;



/*---- Initialization ----*/

function initCharsets() {
	function createElem(tagName, attribs) {
		var result = document.createElement(tagName);
		if (attribs !== undefined) {
			for (var key in attribs)
				result[key] = attribs[key];
		}
		return result;
	}
	
	var container = document.querySelector("#charset tbody");
	var endElem = document.querySelector("#charset tbody > tr:last-child");
	CHARACTER_SETS.forEach((entry, i) => {
		var tr = createElem("tr");
		var td = tr.appendChild(createElem("td"));
		var input = td.appendChild(createElem("input", {
			type: "checkbox",
			checked: entry[0],
			id: "charset-" + i}));
		var td = tr.appendChild(createElem("td"));
		var label = td.appendChild(createElem("label", {
			htmlFor: "charset-" + i,
			textContent: " " + entry[1] + " "}));
		var small = label.appendChild(createElem("small", {
			textContent: "(" + entry[2] + ")"}));
		container.insertBefore(tr, endElem);
	});
}


function initCrypto() {
	var elem = document.getElementById("crypto-getrandomvalues-entropy");
	elem.textContent = "\u2717";  // X mark
	
	if ("crypto" in window)
		cryptoObject = crypto;
	else if ("msCrypto" in window)
		cryptoObject = msCrypto;
	else
		return;
	
	if ("getRandomValues" in cryptoObject && "Uint32Array" in window && typeof Uint32Array == "function")
		elem.textContent = "\u2713";  // Check mark
	else
		cryptoObject = null;
}



/*---- Entry points from HTML code ----*/

function doGenerate() {
	// Get and check character set
	var charset = getPasswordCharacterSet();
	if (charset.length == 0) {
		alert("Error: Character set is empty");
		return;
	} else if (document.getElementById("by-entropy").checked && charset.length == 1) {
		alert("Error: Need at least 2 distinct characters in set");
		return;
	}
	
	// Calculate desired length
	var length;
	if (document.getElementById("by-length").checked)
		length = parseInt(document.getElementById("length").value, 10);
	else if (document.getElementById("by-entropy").checked)
		length = Math.ceil(parseFloat(document.getElementById("entropy").value) * Math.log(2) / Math.log(charset.length));
	else
		throw new Error("Assertion error");
	
	// Check length
	if (length < 0) {
		alert("Negative password length");
		return;
	} else if (length > 10000) {
		alert("Password length too large");
		return;
	}
	
	// Generate password
	currentPassword = generatePassword(charset, length);
	
	// Calculate and format entropy
	var entropy = Math.log(charset.length) * length / Math.log(2);
	var entropystr;
	if (entropy < 70)
		entropystr = entropy.toFixed(2);
	else if (entropy < 200)
		entropystr = entropy.toFixed(1);
	else
		entropystr = entropy.toFixed(0);
	
	// Set output elements
	passwordElem.textContent = currentPassword;
	statisticsElem.textContent = "Length = " + length + " chars, \u00A0\u00A0Charset size = " +
		charset.length + " symbols, \u00A0\u00A0Entropy = " + entropystr + " bits";
	copyElem.disabled = false;
}


function doCopy() {
	if ("clipboard" in navigator)
		navigator.clipboard.writeText(currentPassword);
	else {
		var container = document.querySelector("article");
		var textarea = document.createElement("textarea");
		textarea.style.position = "fixed";
		textarea.style.opacity = "0";
		container.insertBefore(textarea, container.firstChild);
		textarea.value = currentPassword;
		textarea.focus();
		textarea.select();
		document.execCommand("copy");
		container.removeChild(textarea);
	}
}



/*---- Low-level functions ----*/

function getPasswordCharacterSet() {
	// Concatenate characters from every checked entry
	var rawCharset = "";
	CHARACTER_SETS.forEach((entry, i) => {
		if (document.getElementById("charset-" + i).checked)
			rawCharset += entry[2];
	});
	if (document.getElementById("custom").checked)
		rawCharset += document.getElementById("customchars").value;
	rawCharset = rawCharset.replace(/ /g, "\u00A0");  // Replace space with non-breaking space
	
	// Parse UTF-16, remove duplicates, convert to array of strings
	var charset = [];
	for (var i = 0; i < rawCharset.length; i++) {
		var c = rawCharset.charCodeAt(i);
		if (c < 0xD800 || c >= 0xE000) {  // Regular UTF-16 character
			var s = rawCharset.charAt(i);
			if (charset.indexOf(s) == -1)
				charset.push(s);
			continue;
		}
		if (0xD800 <= c && c < 0xDC00 && i + 1 < rawCharset.length) {  // High surrogate
			var d = rawCharset.charCodeAt(i + 1);
			if (0xDC00 <= d && d < 0xE000) {  // Low surrogate
				var s = rawCharset.substring(i, i + 2);
				i++;
				if (charset.indexOf(s) == -1)
					charset.push(s);
				continue;
			}
		}
		throw new RangeError("Invalid UTF-16");
	}
	return charset;
}


function generatePassword(charset, len) {
	var result = "";
	for (var i = 0; i < len; i++)
		result += charset[randomInt(charset.length)];
	return result;
}


// Returns a random integer in the range [0, n) using a variety of methods.
function randomInt(n) {
	var x = randomIntMathRandom(n);
	x = (x + randomIntBrowserCrypto(n)) % n;
	return x;
}


// Not secure or high quality, but always available.
function randomIntMathRandom(n) {
	var x = Math.floor(Math.random() * n);
	if (x < 0 || x >= n)
		throw new Error("Arithmetic exception");
	return x;
}


// Uses a secure, unpredictable random number generator if available; otherwise returns 0.
function randomIntBrowserCrypto(n) {
	if (cryptoObject === null)
		return 0;
	// Generate an unbiased sample
	var x = new Uint32Array(1);
	do cryptoObject.getRandomValues(x);
	while (x[0] - x[0] % n > 4294967296 - n);
	return x[0] % n;
}



/*---- Initialization ----*/

initCharsets();
initCrypto();
copyElem.disabled = true;
