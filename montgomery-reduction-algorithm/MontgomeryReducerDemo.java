/* 
 * Montgomery reduction algorithm demo (Java)
 * 
 * Copyright (c) 2014 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/montgomery-reduction-algorithm
 */

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigInteger;


public class MontgomeryReducerDemo {
	
	public static void main(String[] args) throws IOException {
		// Prompt user on standard output, parse standard input
		BufferedReader in = new BufferedReader(new InputStreamReader(System.in, "US-ASCII"));
		System.out.print("Number x: ");
		BigInteger x = new BigInteger(in.readLine());
		System.out.print("Operation (\"times\" or \"pow\"): ");
		String oper = in.readLine();
		System.out.print("Number y: ");
		BigInteger y = new BigInteger(in.readLine());
		System.out.print("Modulus: ");
		BigInteger mod = new BigInteger(in.readLine());
		System.out.println();
		
		// Do computation
		MontgomeryReducer red = new MontgomeryReducer(mod);
		BigInteger xm = red.convertIn(x);
		BigInteger zm;
		BigInteger z;
		if (oper.equals("times")) {
			zm = red.multiply(xm, red.convertIn(y));
			z = x.multiply(y).mod(mod);
		} else if (oper.equals("pow")) {
			zm = red.pow(xm, y);
			z = x.modPow(y, mod);
		} else
			throw new IllegalArgumentException("Invalid operation: " + oper);
		if (!red.convertOut(zm).equals(z))
			throw new AssertionError("Self-check failed");
		System.out.printf("%d%s%d mod %d%n", x, oper.equals("times") ? " * " : "^", y, mod);
		System.out.println("= " + z);
	}
	
}
