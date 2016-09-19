/* 
 * Fast doubling Fibonacci algorithm (C#)
 * 
 * Copyright (c) 2016 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/fast-fibonacci-algorithms
 */

using System;
using System.Numerics;


/*
 * Run with a single number argument. Example:
 *   Command: fastfibonacci.exe 7
 *   Output: "fibonacci(7) = 13"
 */
public sealed class fastfibonacci {
	
	public static int Main(string[] args) {
		if (args.Length != 1) {
			Console.WriteLine("Usage: fastfibonacci.exe N");
			return 1;
		}
		int n = int.Parse(args[0]);
		if (n < 0) {
			Console.WriteLine("Number must be non-negative");
			return 1;
		}
		Console.WriteLine("fibonacci({0}) = {1}", n, Fibonacci(n));
		return 0;
	}
	
	
	// Fast doubling algorithm
	private static BigInteger Fibonacci(int n) {
		BigInteger a = BigInteger.Zero;
		BigInteger b = BigInteger.One;
		for (int i = 31; i >= 0; i--) {
			BigInteger d = a * (b * 2 - a);
			BigInteger e = a * a + b * b;
			a = d;
			b = e;
			if ((((uint)n >> i) & 1) != 0) {
				BigInteger c = a + b;
				a = b;
				b = c;
			}
		}
		return a;
	}
	
}
