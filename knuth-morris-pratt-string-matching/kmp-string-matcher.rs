/* 
 * Knuth-Morris-Pratt string matcher (Rust)
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/knuth-morris-pratt-string-matching
 * 
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


// Searches for the given pattern string in the given text string using the Knuth-Morris-Pratt string matching algorithm.
// If the pattern is found, this returns the index of the start of the earliest match in 'text'. Otherwise None is returned.
fn kmp_search(pattern: &[char], text: &[char]) -> std::option::Option<usize> {
	if pattern.len() == 0 {
		return Some(0);  // Immediate match
	}
	
	// Compute longest suffix-prefix table
	let mut lsp: Vec<usize> = Vec::with_capacity(pattern.len());
	lsp.push(0);  // Base case
	for i in 1 .. pattern.len() {
		let mut j: usize = lsp[i - 1];  // Start by assuming we're extending the previous LSP
		while j > 0 && pattern[i] != pattern[j] {
			j = lsp[j - 1];
		}
		if pattern[i] == pattern[j] {
			j += 1;
		}
		lsp.push(j);
	}
	
	// Walk through text string
	let mut j: usize = 0;  // The number of chars matched in pattern
	for (i, c) in text.iter().enumerate() {
		while j > 0 && *c != pattern[j] {
			j = lsp[j - 1];  // Fall back in the pattern
		}
		if *c == pattern[j] {
			j += 1;  // Next char matched, increment position
			if j == pattern.len() {
				return Some(i - (j - 1));
			}
		}
	}
	None  // Not found
}
