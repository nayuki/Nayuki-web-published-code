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

import math


# DCT type II, unscaled. Algorithm by Byeong Gi Lee, 1984.
# See: http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.118.3056&rep=rep1&type=pdf#page=34
def transform(vector):
	n = len(vector)
	if n == 1:
		return list(vector)
	elif n == 0 or n % 2 != 0:
		raise ValueError()
	else:
		half = n // 2
		alpha = [(vector[i] + vector[-(i + 1)]) for i in range(half)]
		beta  = [(vector[i] - vector[-(i + 1)]) / (math.cos((i + 0.5) * math.pi / n) * 2.0)
			for i in range(half)]
		alpha = transform(alpha)
		beta  = transform(beta )
		result = []
		for i in range(half - 1):
			result.append(alpha[i])
			result.append(beta[i] + beta[i + 1])
		result.append(alpha[-1])
		result.append(beta [-1])
		return result


# DCT type III, unscaled. Algorithm by Byeong Gi Lee, 1984.
# See: https://www.nayuki.io/res/fast-discrete-cosine-transform-algorithms/lee-new-algo-discrete-cosine-transform.pdf
def inverse_transform(vector, root=True):
	if root:
		vector = list(vector)
		vector[0] /= 2.0
	n = len(vector)
	if n == 1:
		return vector
	elif n == 0 or n % 2 != 0:
		raise ValueError()
	else:
		half = n // 2
		alpha = [vector[0]]
		beta  = [vector[1]]
		for i in range(1, half):
			j = i * 2
			alpha.append(vector[j])
			beta.append(vector[j - 1] + vector[j + 1])
		inverse_transform(alpha, False)
		inverse_transform(beta , False)
		for i in range(half):
			x = alpha[i]
			y = beta[i] / (math.cos((i + 0.5) * math.pi / n) * 2)
			vector[i] = x + y
			vector[-(i + 1)] = x - y
		return vector
