# 
# Fast discrete cosine transform algorithms (Python)
# 
# Copyright (c) 2020 Project Nayuki. (MIT License)
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

import numpy


# DCT type II, unscaled. Algorithm by Byeong Gi Lee, 1984.
# See: http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.118.3056&rep=rep1&type=pdf#page=34
def transform(vector):
	if vector.ndim != 1:
		raise ValueError()
	n = vector.size
	if n == 1:
		return vector.copy()
	elif n == 0 or n % 2 != 0:
		raise ValueError()
	else:
		half = n // 2
		gamma = vector[ : half]
		delta = vector[n - 1 : half - 1 : -1]
		alpha = transform(gamma + delta)
		beta  = transform((gamma - delta) / (numpy.cos(numpy.arange(0.5, half + 0.5) * (numpy.pi / n)) * 2.0))
		result = numpy.zeros_like(vector)
		result[0 : : 2] = alpha
		result[1 : : 2] = beta
		result[1 : n - 1 : 2] += beta[1 : ]
		return result


# DCT type III, unscaled. Algorithm by Byeong Gi Lee, 1984.
# See: https://www.nayuki.io/res/fast-discrete-cosine-transform-algorithms/lee-new-algo-discrete-cosine-transform.pdf
def inverse_transform(vector, root=True):
	if vector.ndim != 1:
		raise ValueError()
	if root:
		vector = vector.copy()
		vector[0] /= 2
	n = vector.size
	if n == 1:
		return vector
	elif n == 0 or n % 2 != 0:
		raise ValueError()
	else:
		half = n // 2
		alpha = vector[0 : : 2].copy()
		beta  = vector[1 : : 2].copy()
		beta[1 : ] += vector[1 : n - 1 : 2]
		inverse_transform(alpha, False)
		inverse_transform(beta , False)
		beta /= numpy.cos(numpy.arange(0.5, half + 0.5) * (numpy.pi / n)) * 2.0
		vector[ : half] = alpha + beta
		vector[n - 1 : half - 1 : -1] = alpha - beta
		return vector
