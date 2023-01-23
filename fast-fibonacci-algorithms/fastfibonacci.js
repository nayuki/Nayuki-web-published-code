/* 
 * Fast doubling Fibonacci algorithm (JavaScript)
 * by Project Nayuki, 2023. Public domain.
 * https://www.nayuki.io/page/fast-fibonacci-algorithms
 */


// (Public) Returns F(n).
function fibonacci(n) {
	if (n < 0)
		throw RangeError("Negative arguments not implemented");
	return fib(n)[0];
}


// (Private) Returns the tuple (F(n), F(n+1)).
function fib(n) {
	if (n == 0)
		return [0n, 1n];
	else {
		const [a, b] = fib(Math.floor(n / 2));
		const c = a * (b * 2n - a);
		const d = a * a + b * b;
		if (n % 2 == 0)
			return [c, d];
		else
			return [d, c + d];
	}
}
