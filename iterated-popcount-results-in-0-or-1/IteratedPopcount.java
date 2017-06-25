/* 
 * Iterated popcount demo
 * 
 * Copyright (c) 2017 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/iterated-popcount-results-in-0-or-1
 */

import java.math.BigInteger;
import java.util.Scanner;


public final class IteratedPopcount {
	
	public static void main(String[] args) {
		Scanner scan = new Scanner(System.in);
		while (true) {
			System.out.print("Enter an integer (or blank to quit): ");
			System.out.flush();
			String line = scan.nextLine();
			if (line.equals("")) {
				System.out.println("Quit");
				break;
			}
			try {
				BigInteger n = new BigInteger(line);
				if (n.signum() == -1)
					throw new NumberFormatException();
				doIteratedPopcount(n);
			} catch (NumberFormatException e) {
				System.out.println("Error: Number must be positive or zero");
			}
			System.out.println();
		}
	}
	
	
	private static void doIteratedPopcount(BigInteger n) {
		int i = 0;
		BigInteger prev = BigInteger.valueOf(-1);
		System.out.println("Iter  Value");
		while (true) {
			System.out.printf("%4d  %d%n", i, n);
			if (n.equals(prev))
				break;
			prev = n;
			n = BigInteger.valueOf(n.bitCount());
			i++;
		}
	}
	
}
