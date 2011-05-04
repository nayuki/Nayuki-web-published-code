var separator;

function divisors() {
	var n = parseFloat(document.getElementById("number").value);
	var output = "";
	if (!isInteger(n)) output="Not an integer";
	else if (n < 2 || n > 9007199254740992) output="Input out of range"
	else {
		if (document.getElementById("singleLineOutput").checked) separator=", ";
		else separator = "\n";
		output = listDivisors(n);
	}
	document.getElementById("divisorlist").value=output;
}

function listDivisors(n) {
	var end = Math.floor(Math.sqrt(n));
	var small = "1";
	var large = n + "";
	for (var i = 2; i <= end; i++) {
		if (n % i == 0) {
			small = small + separator + i;
			if (i * i != n)
				large = n/i + separator + large;
		}
	}
	return small + separator + large;
}


function isInteger(x) {
	return !isNaN(x) && x == Math.floor(x);
}

function isNaN(x) {
	return x != x;
}
