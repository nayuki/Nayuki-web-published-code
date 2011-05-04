function calculate() {
	var x = parseFloat(document.getElementById("number0").value);
	var y = parseFloat(document.getElementById("number1").value);
	var output="";
	if (!isInteger(x) || !isInteger(y)) output="Not an integer";
	else if(Math.abs(x) > 9007199254740992 || Math.abs(y) > 9007199254740992) output="Value out of range"
	else output = gcd(Math.abs(x), Math.abs(y));
	document.getElementById("output").value = output;
}

function gcd(x, y) {
	while (y != 0) {
		var z = x % y;
		x = y;
		y = z;
	}
	return x;
}


function isInteger(x) {
	return !isNaN(x) && x == Math.floor(x);
}

function isNaN(x) {
	return x != x;
}
