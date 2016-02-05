/* 
 * Knuth-Morris-Pratt string matcher (Java)
 * 
 * Copyright (c) 2014 Project Nayuki
 * https://www.nayuki.io/page/knuth-morris-pratt-string-matching
 * 
 * (MIT License)
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * - The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 * - The Software is provided "as is", without warranty of any kind, express or
 *   implied, including but not limited to the warranties of merchantability,
 *   fitness for a particular purpose and noninfringement. In no event shall the
 *   authors or copyright holders be liable for any claim, damages or other
 *   liability, whether in an action of contract, tort or otherwise, arising from,
 *   out of or in connection with the Software or the use or other dealings in the
 *   Software.
 */


public final class KmpStringMatcher {
	
	private String pattern;
	private int[] lsp;  // Longest suffix-prefix table
	
	
	public KmpStringMatcher(String patt) {
		if (patt == null)
			throw new NullPointerException();
		pattern = patt;
		
		// Compute longest suffix-prefix table
		lsp = new int[pattern.length()];
		if (lsp.length > 0)
			lsp[0] = 0;  // Base case
		for (int i = 1; i < pattern.length(); i++) {
			int j = lsp[i - 1];  // Start by assuming we're extending the previous LSP
			while (j > 0 && pattern.charAt(i) != pattern.charAt(j))
				j = lsp[j - 1];
			if (pattern.charAt(i) == pattern.charAt(j))
				j++;
			assert 0 <= j && j < i;
			lsp[i] = j;
		}
	}
	
	
	public int search(String text) {
		if (text == null)
			throw new NullPointerException();
		if (pattern.length() == 0)
			return 0;  // Immediate match
		
		// Walk through text string
		int j = 0;  // Number of chars matched in pattern
		for (int i = 0; i < text.length(); i++) {
			while (j > 0 && text.charAt(i) != pattern.charAt(j))
				j = lsp[j - 1];  // Fall back in the pattern
			if (text.charAt(i) == pattern.charAt(j)) {
				j++;  // Next char matched, increment position
				if (j == pattern.length())
					return i - (j - 1);
			}
		}
		return -1;  // Not found
	}
	
	
	// For unit tests
	void checkStructure() {
		if (lsp.length != pattern.length())
			throw new AssertionError();
		
		for (int i = 0; i < lsp.length; i++) {
			if (lsp[i] < 0 || lsp[i] > i)
				throw new AssertionError();
			int j = i;
			while (j >= 1 && !pattern.substring(0, j).equals(pattern.substring(i + 1 - j, i + 1)))
				j--;
			if (lsp[i] != j)
				throw new AssertionError();
		}
	}
	
}
