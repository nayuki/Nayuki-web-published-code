function encrypt() {
	var key = parseFloat(document.getElementById("shift").value);
	if (!isInteger(key)) {
		alert("Shift is not an integer");
		return;
	}
	else if (key < 0 || key >= 26) {
		alert("Shift is out of range");
		return;
	}
	crypt(key);
}

function decrypt() {
	var key = parseFloat(document.getElementById("shift").value);
	if (!isInteger(key)) {
		alert("Shift is not an integer");
		return;
	}
	else if (key < 0 || key >= 26) {
		alert("Shift is out of range");
		return;
	}
	crypt((26 - key) % 26);
}


function crypt(key) {
	var preserve = document.getElementById("preservePunctCase").checked;
	var input = document.getElementById("text").value;
	var output = "";
	if (!preserve) {
		for (var i = 0, j = 0; i < input.length; i++) {
			var c = input.charCodeAt(i);
			if (isLetter(c)) {
				if (j % 5 == 0 && j != 0)
					output += " ";
				c -= 65;  // Uppercase letters will be in [0,26); lowercase letters will be in [32,58)
				c %= 32;  // Uppercase and lowercase letters will be in [0,26)
				c += key;  // Encryption/decryption step
				c %= 26;  // Wraparound
				c += 65;  // Convert to uppercase
				output += String.fromCharCode(c);
				j++;
			}
		}
	}
	else {
		for (var i = 0; i < input.length; i++) {
			var c = input.charCodeAt(i);
			if      (isUppercase(c)) output += String.fromCharCode((c - 65 + key) % 26 + 65);
			else if (isLowercase(c)) output += String.fromCharCode((c - 97 + key) % 26 + 97);
			else output += input.charAt(i);
		}
	}
	document.getElementById("text").value = output;
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


function isInteger(x) {
	return !isNaN(x) && x == Math.floor(x);
}

function isNaN(x) {
	return x != x;
}