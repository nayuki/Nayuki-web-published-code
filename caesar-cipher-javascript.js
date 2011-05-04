function encrypt() {
	var key = parseFloat(document.getElementById("shift").value);
	if (!isInteger(key)) {
		alert("Shift is not an integer");
		return;
	}
	if (key < 0 || key >= 26) {
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
	if (key < 0 || key >= 26) {
		alert("Shift is out of range");
		return;
	}
	crypt((26 - key) % 26);
}


// Main encryption/decription function
function crypt(key) {
	var preserve = document.getElementById("preservePunctCase").checked;
	var input = document.getElementById("text").value;
	
	var output = "";
	if (!preserve) {
		for (var i = 0, j = 0; i < input.length; i++) {
			var c = input.charCodeAt(i);
			if (!(c >= 65 && c <= 90 || c >= 97 && c <= 122))  // Skip if not a letter
				continue;
			if (j % 5 == 0 && j != 0)  // Add space after every 5 letters
				output += " ";
			output += String.fromCharCode(((c - 65) % 32 + key) % 26 + 65);
			j++;
		}
	} else {
		for (var i = 0; i < input.length; i++) {
			var c = input.charCodeAt(i);
			if      (c >= 65 && c <=  90) output += String.fromCharCode((c - 65 + key) % 26 + 65);  // Uppercase
			else if (c >= 97 && c <= 122) output += String.fromCharCode((c - 97 + key) % 26 + 97);  // Lowercase
			else                          output += input.charAt(i);  // Copy
		}
	}
	
	document.getElementById("text").value = output;
}


function isInteger(x) {
	return !isNaN(x) && x == Math.floor(x);
}

function isNaN(x) {
	return x != x;
}
