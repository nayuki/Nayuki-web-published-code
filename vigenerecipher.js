function encrypt() {
	var key = getKey();
	if (key.length == 0) {
		alert("Empty key");
		return;
	}
	crypt(key);
}

function decrypt() {
	var key = getKey();
	if (key.length == 0) {
		alert("Empty key");
		return;
	}
	for (var i = 0; i < key.length; i++)
		key[i] = (26 - key[i]) % 26;
	crypt(key);
}


function crypt(key) {
	var preserve = document.getElementById("preservePunctCase").checked;
	var input = document.getElementById("text").value;
	var output = "";
	if (!preserve) {
		for (var i = 0, j = 0; i < input.length; i++) {
			var c = input.charCodeAt(i);
			if (isLetter(c)) {
				if (j % 5 == 0 && j != 0) output+=" ";
				c -= 65;  // Uppercase letters will be in [0,26); lowercase letters will be in [32,58)
				c %= 32;  // Uppercase and lowercase letters will be in [0,26)
				c += key[j % key.length];  // Encryption/decryption step with a particular key character
				c %= 26;  // Wraparound
				c += 65;  // Convert to uppercase
				output += String.fromCharCode(c);
				j++;
			}
		}
	}
	else {
		for (var i = 0, j = 0; i < input.length; i++) {
			var c = input.charCodeAt(i);
			if (isUppercase(c)) {
				output += String.fromCharCode((c - 65 + key[j%key.length]) % 26 + 65);
				j++;
			}
			else if (isLowercase(c)) {
				output += String.fromCharCode((c - 97 + key[j%key.length]) % 26 + 97);
				j++;
			}
			else
				output += input.charAt(i);
			}
		}
	document.getElementById("text").value = output;
}

function getKey() {
	var key = document.getElementById("key").value;
	var result = new Array();
	for (var i = 0, j = 0; i < key.length; i++) {
		var c = key.charCodeAt(i);
		if (isLetter(c)) {
			result[j] = (c - 65) % 32;
			j++;
		}
	}
	return result;
}


// Tests whether the specified character code is a letter.
function isLetter(c) {
	return isUppercase(c) || isLowercase(c);
}

function isUppercase(c) {
	return c >= 65 && c <= 90;  // 65 is the character code for 'A'. 90 is for 'Z'.
}

function isLowercase(c) {
	return c >= 97 && c <= 122;  // 97 is the character code for 'a'. 122 is for 'z'.
}