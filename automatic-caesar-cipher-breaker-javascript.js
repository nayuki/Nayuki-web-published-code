/* 
 * Automatic caesar cipher breaker
 * Copyright (c) 2011 Nayuki Minase
 */


function doBreak() {
	var text = document.getElementById("text").value;
	var entropies = new Array(26);
	for (var i = 0; i < 26; i++)
		entropies[i] = getEntropy(decrypt(text, i));
	var key = argMin(entropies);
	document.getElementById("text").value = decrypt(text, key);
	document.getElementById("shift").value = key.toString();
	visualize(entropies);
}


function next(shift) {  // Requires shift >= 0
	document.getElementById("text").value = decrypt(document.getElementById("text").value, shift);
	document.getElementById("shift").value = ((parseInt(document.getElementById("shift").value, 10) + shift) % 26).toString();
}


function visualize(entropies) {
	var max = Math.max.apply(null, entropies);
	for (var i = 0; i < entropies.length; i++) {
		var textElem = document.getElementById("entropy" + i);
		removeAllChildren(textElem);
		textElem.appendChild(document.createTextNode(entropies[i].toFixed(3)));
		
		var graphElem = document.getElementById("entropyGraph" + i);
		var width = entropies[i] / max * 30;
		graphElem.setAttribute("style", "width:" + width + "em; height:1em; background: rgb(128,192,255);");
	}
}


function decrypt(str, key) {
	key = (26 - key) % 26;  // Change it into an encryption key
	var result = "";
	for (var i = 0; i < str.length; i++) {
		var c = str.charCodeAt(i);
		if      (c >= 65 && c <=  90) result += String.fromCharCode((c - 65 + key) % 26 + 65);  // Uppercase
		else if (c >= 97 && c <= 122) result += String.fromCharCode((c - 97 + key) % 26 + 97);  // Lowercase
		else result += str.charAt(i);  // Copy
	}
	return result;
}


// Unigram model frequencies
var englishFreqs = [0.08167, 0.01492, 0.02782, 0.04253, 0.12702, 0.02228, 0.02015, 0.06094, 0.06966, 0.00153, 0.00772, 0.04025, 0.02406, 0.06749, 0.07507, 0.01929, 0.00095, 0.05987, 0.06327, 0.09056, 0.02758, 0.00978, 0.02360, 0.00150, 0.01974, 0.00074];

function getEntropy(str) {
	var result = 0;
	for (var i = 0; i < str.length; i++) {
		var c = str.charCodeAt(i);
		if      (c >= 65 && c <=  90) result += Math.log(englishFreqs[c - 65]);  // Uppercase
		else if (c >= 97 && c <= 122) result += Math.log(englishFreqs[c - 97]);  // Lowercase
	}
	return -result / Math.log(2) / str.length;
}


function argMin(array) {
	var j = 0;
	for (var i = 1; i < array.length; i++) {
		if (array[i] < array[j])
			j = i;
	}
	return j;
}


function removeAllChildren(node) {
	while (node.childNodes.length > 0)
		node.removeChild(node.firstChild);
}
