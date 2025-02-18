/* 
 * Vigenère cipher
 * 
 * Copyright (c) 2025 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/vigenere-cipher-javascript
 */

"use strict";


const app = new function() {
	
	let container = document.querySelector("article .program-container");
	
	
	function initialize() {
		container.hidden = false;
		container.style.display = "grid";
	}
	
	setTimeout(initialize);
	
	
	/* 
	 * Handles the HTML input/output for Vigenère cipher encryption/decription.
	 * This is the one and only entry point function called from the HTML code.
	 */
	this.doCrypt = function(isDecrypt) {
		let keyArray = filterKey(container.querySelector("#key").value);
		if (keyArray.length == 0) {
			alert("Key has no letters");
			return;
		}
		
		if (isDecrypt) {
			for (let i = 0; i < keyArray.length; i++)
				keyArray[i] = (26 - keyArray[i]) % 26;
		}
		
		let textElem = container.querySelector("#text");
		textElem.value = crypt(textElem.value, keyArray);
	};
	
	
	/* 
	 * Returns the result of Vigenère encryption on the given text with the given key.
	 */
	function crypt(input, key) {
		let output = "";
		let j = 0;
		for (const ch of input) {
			const cc = ch.codePointAt(0);
			if (isUppercase(cc)) {
				output += String.fromCodePoint((cc - 65 + key[j % key.length]) % 26 + 65);
				j++;
			} else if (isLowercase(cc)) {
				output += String.fromCodePoint((cc - 97 + key[j % key.length]) % 26 + 97);
				j++;
			} else {
				output += ch;
			}
		}
		return output;
	}
	
	
	/* 
	 * Returns an array of numbers, each in the range [0, 26), representing the given key.
	 * The key is case-insensitive, and non-letters are ignored.
	 * Examples:
	 * - filterKey("AAA") = [0, 0, 0].
	 * - filterKey("abc") = [0, 1, 2].
	 * - filterKey("the $123# EHT") = [19, 7, 4, 4, 7, 19].
	 */
	function filterKey(key) {
		let result = [];
		for (const ch of key) {
			const cc = ch.codePointAt(0);
			if (isUppercase(cc) || isLowercase(cc))
				result.push((cc - 65) % 32);
		}
		return result;
	}
	
	
	// Tests whether the given character code is an Latin uppercase letter.
	function isUppercase(c) {
		return "A".charCodeAt(0) <= c && c <= "Z".charCodeAt(0);
	}
	
	
	// Tests whether the given character code is a Latin lowercase letter.
	function isLowercase(c) {
		return "a".charCodeAt(0) <= c && c <= "z".charCodeAt(0);
	}
	
};
