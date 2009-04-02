var timesString;

function factor() {
	var n = parseFloat(document.getElementById("number").value);
	var output="";
	if (!isInteger(n)) output = "Not an integer";
	else if (n < 2 || n > 9007199254740992) output = "Input out of range"
	else {
		if (document.getElementById("useTimes").checked) timesString = " × ";
		else timesString = " * ";
		output = primeFactor(n);
	}
	document.getElementById("factored").value = output;
}

function primeFactor(n) {
	var end = Math.floor(Math.sqrt(n));
	if (n % 2 == 0 && n > 2)
		return 2 + timesString + primeFactor(n/2);
	for (var i = 3; i <= end; i += 2){
		if (n % i == 0)
			return i + timesString + primeFactor(n/i);
	}
	return n + "";
}


function isInteger(x) {
	return !isNaN(x) && x == Math.floor(x);
}

function isNaN(x) {
	return x != x;
}