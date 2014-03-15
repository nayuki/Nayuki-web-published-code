/* 
 * Automatic Caesar cipher breaker
 * 
 * Copyright (c) 2014 Nayuki Minase
 * All rights reserved. Contact Nayuki for licensing.
 * http://nayuki.eigenstate.org/page/automatic-caesar-cipher-breaker-javascript
 */

"use strict";


/* User interaction functions */

// Array of pairs (int shift, float entropy), sorted in ascending order of entropy
var entropies;

function doBreak() {
	var text = document.getElementById("text").value;
	entropies = getAllEntropies(text);
	entropies.sort(function(x, y) {
		// Compare by lowest entropy, break ties by lowest shift
		if (x[1] < y[1]) return -1;
		else if (x[1] > y[1]) return 1;
		else if (x[0] < y[0]) return -1;
		else if (x[0] > y[0]) return 1;
		else return 0;
	});
	
	// Decrypt using lowest entropy shift
	var bestShift = entropies[0][0];
	document.getElementById("text").value = decrypt(text, bestShift);
	document.getElementById("shift").value = bestShift.toString();
	
	// Build table of best guesses
	var guessesElem = document.getElementById("guesses");
	removeAllChildren(guessesElem);
	var maxEntropy = entropies[entropies.length - 1][1];
	for (var i = 0; i < entropies.length; i++) {
		var tr = document.createElement("tr");
		if (i == 0)
			tr.className = "active";
		
		var td = document.createElement("td");
		td.appendChild(document.createTextNode(entropies[i][0].toString()));
		tr.appendChild(td);
		
		td = document.createElement("td");
		td.appendChild(document.createTextNode(entropies[i][1].toFixed(3)));
		tr.appendChild(td);
		
		td = document.createElement("td");
		var div = document.createElement("div");
		div.className = "bar";
		div.style.width = (entropies[i][1] / maxEntropy * 30).toFixed(6) + "em";
		td.appendChild(div);
		tr.appendChild(td);
		
		tr.onclick = (function(shift) {
			return function() {
				setShift(shift);
			};
		})(entropies[i][0]);
		guessesElem.appendChild(tr);
	}
}


function setShift(newShift) {
	newShift = mod(newShift, 26);
	document.getElementById("text").value = decrypt(document.getElementById("text").value, newShift - getShift());
	document.getElementById("shift").value = newShift.toString();
	
	var guessesElem = document.getElementById("guesses");
	for (var i = 0; i < 26; i++)
		guessesElem.childNodes[i].className = entropies[i][0] == newShift ? "active" : "";
}


function getShift() {  // Error-resilient
	var shiftText = document.getElementById("shift").value;
	var shift = parseInt(shiftText, 10);
	if (isNaN(shift) || shift < 0 || shift >= 26)
		shift = 0;
	return shift;
}


/* Core functions */

// Returns the entropies when the given string is decrypted with all 26 possible shifts,
// where the result is an array of pairs (int shift, float enptroy) - e.g. [[0, 2.01], [1, 4.95], ..., [25, 3.73]].
function getAllEntropies(str) {
	var result = new Array(26);
	for (var i = 0; i < 26; i++)
		result[i] = [i, getEntropy(decrypt(str, i))];
	return result;
}


// Unigram model frequencies for letters A, B, ..., Z
var ENGLISH_FREQS = [
	0.08167, 0.01492, 0.02782, 0.04253, 0.12702, 0.02228, 0.02015, 0.06094, 0.06966, 0.00153, 0.00772, 0.04025, 0.02406,
	0.06749, 0.07507, 0.01929, 0.00095, 0.05987, 0.06327, 0.09056, 0.02758, 0.00978, 0.02360, 0.00150, 0.01974, 0.00074];

// Returns the cross-entropy of the given string with respect to the English unigram frequencies, which is a positive floating-point number.
function getEntropy(str) {
	var sum = 0;
	var ignored = 0;
	for (var i = 0; i < str.length; i++) {
		var c = str.charCodeAt(i);
		if      (c >= 65 && c <=  90) sum += Math.log(ENGLISH_FREQS[c - 65]);  // Uppercase
		else if (c >= 97 && c <= 122) sum += Math.log(ENGLISH_FREQS[c - 97]);  // Lowercase
		else ignored++;
	}
	return -sum / Math.log(2) / (str.length - ignored);
}


// Decrypts the given string with the given key using the Caesar shift cipher.
// The key is an integer representing the number of letters to step back by - e.g. decrypt("EB", 2) = "CZ".
function decrypt(str, key) {
	var result = "";
	for (var i = 0; i < str.length; i++) {
		var c = str.charCodeAt(i);
		if      (c >= 65 && c <=  90) result += String.fromCharCode(mod(c - 65 - key, 26) + 65);  // Uppercase
		else if (c >= 97 && c <= 122) result += String.fromCharCode(mod(c - 97 - key, 26) + 97);  // Lowercase
		else result += str.charAt(i);  // Copy
	}
	return result;
}


/* Utilities */

function removeAllChildren(node) {
	while (node.childNodes.length > 0)
		node.removeChild(node.firstChild);
}


function mod(x, y) {
	return (x % y + y) % y;
}
