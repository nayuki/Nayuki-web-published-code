/*
 * Caesar cipher
 * Copyright (c) 2011 Nayuki Minase
 */


/*
 * Handles the HTML input/output for Caesar cipher encryption/decryption.
 * This is the one and only entry point function called from the HTML code.
 */
function doCrypt(isDecrypt) {
	var shiftText = document.getElementById("shift").value;
	if (!/^-?\d+$/.test(shiftText)) {
		alert("Shift is not an integer");
		return;
	}
	var key = parseInt(shiftText, 10);
	if (key < 0 || key >= 26) {
		alert("Shift is out of range");
		return;
	}
	if (isDecrypt)
		key = (26 - key) % 26;
	var textElem = document.getElementById("text");
	textElem.value = crypt(textElem.value, key);
}


/*
 * Returns the result of having each letter of the given text shifted forward by the given key, with wraparound. Case is preserved, and non-letters are unchanged.
 * Examples:
 *   crypt("abz", 1) = "bca"
 *   crypt("THe 123 !@#$", 13) = "GUr 123 !@#$"
 */
function crypt(input, key) {
	var output = "";
		for (var i = 0; i < input.length; i++) {
		var c = input.charCodeAt(i);
		if      (c >= 65 && c <=  90) output += String.fromCharCode((c - 65 + key) % 26 + 65);  // Uppercase
		else if (c >= 97 && c <= 122) output += String.fromCharCode((c - 97 + key) % 26 + 97);  // Lowercase
		else                          output += input.charAt(i);  // Copy
	}
	return output;
}
