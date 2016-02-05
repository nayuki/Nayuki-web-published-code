/* 
 * Knuth-Morris-Pratt string matcher (C++)
 * 
 * Copyright (c) 2015 Project Nayuki
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

#include <cstddef>
#include <cstdlib>
#include <cstring>
#include <vector>


// Searches for the given pattern string in the given text string using the Knuth-Morris-Pratt string matching algorithm.
// If the pattern is found, a pointer to the start of the earliest match in 'text' is returned. Otherwise NULL is returned.
const char *kmpSearch(const char *pattern, const char *text) {
	if (pattern[0] == '\0')
		return text;  // Immediate match
	
	// Compute longest suffix-prefix table
	std::vector<size_t> lsp(strlen(pattern));
	lsp.at(0) = 0;  // Base case
	for (size_t i = 1; i < lsp.size(); i++) {
		size_t j = lsp.at(i - 1);  // Start by assuming we're extending the previous LSP
		while (j > 0 && pattern[i] != pattern[j])
			j = lsp.at(j - 1);
		if (pattern[i] == pattern[j])
			j++;
		lsp.at(i) = j;
	}
	
	// Walk through text string
	for (size_t j = 0; *text != '\0'; text++) {  // j is the number of chars matched in pattern
		while (j > 0 && *text != pattern[j])
			j = lsp.at(j - 1);  // Fall back in the pattern
		if (*text == pattern[j]) {
			j++;  // Next char matched, increment position
			if (j == lsp.size())
				return text - (j - 1);
		}
	}
	return NULL;  // Not found
}
