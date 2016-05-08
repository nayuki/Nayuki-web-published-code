/* 
 * Create map (Java version)
 * 
 * Copyright (c) 2016 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/java-native-interface-compared-to-python-c-api
 */

import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;


public final class CreateMap {
	
	// Calls a native method and prints the result to standard output.
	public static void main(String[] args) {
		System.loadLibrary("createmap");  // Load the library late
		Map<Integer,String> map = createMap(30);
		
		// Print mappings
		Set<Integer> sortedKeys = new TreeSet<>(map.keySet());
		for (Integer key : sortedKeys)
			System.out.println(key + " -> " + map.get(key));
	}
	
	
	// Native method stub.
	private static native Map<Integer,String> createMap(int num);
	
	
	// Unused function, for reference only.
	private static Map<Integer,String> createMapJava(int num) {
		Map<Integer,String> result = new HashMap<>();
		String s = "";
		for (int i = 1, c = 0; result.size() < num; i += 2) {
			if (CreateMap.isPrime(i)) {
				result.put(i, s);
				s = "";
			}
			s += (char)('a' + c);
			c = (c + 1) % 26;
		}
		return result;
	}
	
	
	// Tests whether the given integer is prime. Called by the native method.
	private static boolean isPrime(int n) {
		if (n < 2)
			return false;
		for (int i = 2; i < n; i++) {
			if (n % i == 0)
				return false;
		}
		return true;
	}
	
}
