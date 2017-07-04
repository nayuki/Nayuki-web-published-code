# 
# Fast discrete cosine transform algorithms (Python)
# 
# Copyright (c) 2017 Project Nayuki. (MIT License)
# https://www.nayuki.io/page/fast-discrete-cosine-transform-algorithms
# 
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

import cmath, fft


# DCT type II, unscaled
def transform(vector):
	temp = vector[ : : 2] + vector[-1 - len(vector) % 2 : : -2]
	temp = fft.transform(temp, False)
	factor = -1j * cmath.pi / (len(vector) * 2)
	return [(val * cmath.exp(i * factor)).real for (i, val) in enumerate(temp)]


# DCT type III, unscaled
def inverse_transform(vector):
	n = len(vector)
	factor = -1j * cmath.pi / (len(vector) * 2)
	temp = [(val if i > 0 else val / 2.0) * cmath.exp(i * factor)
		for (i, val) in enumerate(vector)]
	temp = fft.transform(temp, False)
	
	temp = [val.real for val in temp]
	result = [None] * n
	result[ : : 2] = temp[ : (n + 1) // 2]
	result[-1 - len(vector) % 2 : : -2] = temp[(n + 1) // 2 : ]
	return result
