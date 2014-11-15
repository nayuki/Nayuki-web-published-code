# 
# Knuth-Morris-Pratt string matcher (Python)
# 
# Copyright (c) 2014 Nayuki Minase
# http://nayuki.eigenstate.org/page/knuth-morris-pratt-string-matching
# 
# (MIT License)
# Permission is hereby granted, free of charge, to any person obtaining a copy of
# this software and associated documentation files (the "Software"), to deal in
# the Software without restriction, including without limitation the rights to
# use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
# the Software, and to permit persons to whom the Software is furnished to do so,
# subject to the following conditions:
# - The above copyright notice and this permission notice shall be included in
#   all copies or substantial portions of the Software.
# - The Software is provided "as is", without warranty of any kind, express or
#   implied, including but not limited to the warranties of merchantability,
#   fitness for a particular purpose and noninfringement. In no event shall the
#   authors or copyright holders be liable for any claim, damages or other
#   liability, whether in an action of contract, tort or otherwise, arising from,
#   out of or in connection with the Software or the use or other dealings in the
#   Software.
# 


# Searches for the given pattern string in the given text string using the Knuth-Morris-Pratt string matching algorithm.
# If the pattern is found, this returns the index of the start of the earliest match in 'text'. Otherwise None is returned.
def kmp_search(pattern, text):
    if pattern == "":
        return 0  # Immediate match
    
    # Compute longest suffix-prefix table
    lsp = [0]  # Base case
    for c in pattern[1 : ]:
        # Start by assuming we're extending the previous LSP
        j = lsp[-1]
        while True:
            if c == pattern[j]:
                j += 1
                break
            elif j > 0:
                j = lsp[j - 1]
            else:  # j == 0
                break
        lsp.append(j)
    
    # Walk through text string
    j = 0  # Number of chars matched in pattern
    for i in range(len(text)):
        while True:
            if text[i] == pattern[j]:  # Next char matched, increment position
                j += 1
                if j == len(pattern):
                    return i - (j - 1)
                else:
                    break
            elif j > 0:  # Fall back in the pattern
                j = lsp[j - 1]
            else:  # j == 0
                break
    return None  # Not found
