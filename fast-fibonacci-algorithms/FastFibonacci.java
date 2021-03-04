/* 
 * Demonstration of fast Fibonacci algorithms (Java)
 * 
 * Copyright (c) 2017 Project Nayuki. Public domain.
 * https://www.nayuki.io/page/fast-fibonacci-algorithms
 */

import java.math.BigInteger;


public final class FastFibonacci {
	
	// Tests the speed of the 3 Fibonacci algorithms
	public static void main(String[] args) {
		// Handle arguments
		if (args.length != 1) {
			System.err.println("Usage: java fastfibonacci N");
			System.exit(1);
			return;
		}
		int n = Integer.parseInt(args[0]);
		if (n < 0)
			throw new IllegalArgumentException("Number must be non-negative");
		
		// Do speed benchmark
		long startTime;
		
		startTime = System.nanoTime();
		BigInteger x = fastFibonacciDoubling(n);
		System.out.printf("Fast doubling: %d ms%n", (System.nanoTime() - startTime) / 1000000);
		
		startTime = System.nanoTime();
		BigInteger y = fastFibonacciMatrix(n);
		System.out.printf("Fast matrix: %d ms%n", (System.nanoTime() - startTime) / 1000000);
		
		startTime = System.nanoTime();
		BigInteger z = slowFibonacci(n);
		System.out.printf("Slow DP: %d ms%n", (System.nanoTime() - startTime) / 1000000);
		
		// Print answer
		System.out.println();
		if (!x.equals(z) || !x.equals(y))
			System.out.println("Wrong answer computed");
		if (z.bitLength() < 10000)
			System.out.printf("Answer: %d%n", z);
		else
			System.out.printf("Answer: (%d bits long)%n", z.bitLength());
	}
	
	
	/* 
	 * Fast doubling method. Faster than the matrix method.
	 * F(2n) = F(n) * (2*F(n+1) - F(n)).
	 * F(2n+1) = F(n+1)^2 + F(n)^2.
	 * This implementation is the non-recursive version. See the web page and
	 * the other programming language implementations for the recursive version.
	 */
	private static BigInteger fastFibonacciDoubling(int n) {
		BigInteger a = BigInteger.ZERO;
		BigInteger b = BigInteger.ONE;
		int m = 0;
		for (int bit = Integer.highestOneBit(n); bit != 0; bit >>>= 1) {
			// Loop invariant: a = F(m), b = F(m+1)
			assert a.equals(slowFibonacci(m));
			assert b.equals(slowFibonacci(m+1));
			
			// Double it
			BigInteger d = multiply(a, b.shiftLeft(1).subtract(a));
			BigInteger e = multiply(a, a).add(multiply(b, b));
			a = d;
			b = e;
			m *= 2;
			assert a.equals(slowFibonacci(m));
			assert b.equals(slowFibonacci(m+1));
			
			// Advance by one conditionally
			if ((n & bit) != 0) {
				BigInteger c = a.add(b);
				a = b;
				b = c;
				m++;
				assert a.equals(slowFibonacci(m));
				assert b.equals(slowFibonacci(m+1));
			}
		}
		return a;
	}
	
	
	/* 
	 * Fast matrix method. Easy to describe, but has a constant factor slowdown compared to doubling method.
	 * [1 1]^n   [F(n+1) F(n)  ]
	 * [1 0]   = [F(n)   F(n-1)].
	 */
	private static BigInteger fastFibonacciMatrix(int n) {
		BigInteger[] matrix = {BigInteger.ONE, BigInteger.ONE, BigInteger.ONE, BigInteger.ZERO};
		return matrixPow(matrix, n)[1];
	}
	
	// Computes the power of a matrix. The matrix is packed in row-major order.
	private static BigInteger[] matrixPow(BigInteger[] matrix, int n) {
		if (n < 0)
			throw new IllegalArgumentException();
		BigInteger[] result = {BigInteger.ONE, BigInteger.ZERO, BigInteger.ZERO, BigInteger.ONE};
		while (n != 0) {  // Exponentiation by squaring
			if (n % 2 != 0)
				result = matrixMultiply(result, matrix);
			n /= 2;
			matrix = matrixMultiply(matrix, matrix);
		}
		return result;
	}
	
	// Multiplies two matrices.
	private static BigInteger[] matrixMultiply(BigInteger[] x, BigInteger[] y) {
		return new BigInteger[] {
			multiply(x[0], y[0]).add(multiply(x[1], y[2])),
			multiply(x[0], y[1]).add(multiply(x[1], y[3])),
			multiply(x[2], y[0]).add(multiply(x[3], y[2])),
			multiply(x[2], y[1]).add(multiply(x[3], y[3]))
		};
	}
	
	
	/* 
	 * Simple slow method, using dynamic programming.
	 * F(n+2) = F(n+1) + F(n).
	 */
	private static BigInteger slowFibonacci(int n) {
		BigInteger a = BigInteger.ZERO;
		BigInteger b = BigInteger.ONE;
		for (int i = 0; i < n; i++) {
			BigInteger c = a.add(b);
			a = b;
			b = c;
		}
		return a;
	}
	
	
	// Multiplies two BigIntegers. This function makes it easy to swap in a faster algorithm like Karatsuba multiplication.
	private static BigInteger multiply(BigInteger x, BigInteger y) {
		return x.multiply(y);
	}
	
}
