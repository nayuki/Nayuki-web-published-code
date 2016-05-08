/* 
 * Sum array (Java version)
 * 
 * Copyright (c) 2016 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/java-native-interface-compared-to-python-c-api
 */


public final class SumArray {
	
	// Calls a native method and prints the result to standard output.
	public static void main(String[] args) {
		int[] array = {3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3};
		int result = calcSum(array);  // 80
		System.out.println("The sum is " + result);
	}
	
	
	static {
		// Load the library early
		System.loadLibrary("sumarray");
	}
	
	
	// Native method stub.
	private static native int calcSum(int[] array);
	
	
	// Unused function, for reference only.
	private static int calcSumJava(int[] array) {
		int sum = 0;
		for (int x : array)
			sum += x;
		return sum;
	}
	
}
