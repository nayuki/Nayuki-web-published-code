# 
# Free FFT and convolution (Python)
# 
# Copyright (c) 2020 Project Nayuki. (MIT License)
# https://www.nayuki.io/page/free-small-fft-in-multiple-languages
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

import cmath


# 
# Computes the discrete Fourier transform (DFT) or inverse transform of the given complex vector, returning the result as a new vector.
# The vector can have any length. This is a wrapper function. The inverse transform does not perform scaling, so it is not a true inverse.
# 
def transform(vec, inverse):
	n = len(vec)
	if n == 0:
		return []
	elif n & (n - 1) == 0:  # Is power of 2
		return transform_radix2(vec, inverse)
	else:  # More complicated algorithm for arbitrary sizes
		return transform_bluestein(vec, inverse)


# 
# Computes the discrete Fourier transform (DFT) of the given complex vector, returning the result as a new vector.
# The vector's length must be a power of 2. Uses the Cooley-Tukey decimation-in-time radix-2 algorithm.
# 
def transform_radix2(vec, inverse):
	# Returns the integer whose value is the reverse of the lowest 'width' bits of the integer 'val'.
	def reverse_bits(val, width):
		result = 0
		for _ in range(width):
			result = (result << 1) | (val & 1)
			val >>= 1
		return result
	
	# Initialization
	n = len(vec)
	levels = n.bit_length() - 1
	if 2**levels != n:
		raise ValueError("Length is not a power of 2")
	# Now, levels = log2(n)
	coef = (2 if inverse else -2) * cmath.pi / n
	exptable = [cmath.rect(1, i * coef) for i in range(n // 2)]
	vec = [vec[reverse_bits(i, levels)] for i in range(n)]  # Copy with bit-reversed permutation
	
	# Radix-2 decimation-in-time FFT
	size = 2
	while size <= n:
		halfsize = size // 2
		tablestep = n // size
		for i in range(0, n, size):
			k = 0
			for j in range(i, i + halfsize):
				temp = vec[j + halfsize] * exptable[k]
				vec[j + halfsize] = vec[j] - temp
				vec[j] += temp
				k += tablestep
		size *= 2
	return vec


# 
# Computes the discrete Fourier transform (DFT) of the given complex vector, returning the result as a new vector.
# The vector can have any length. This requires the convolution function, which in turn requires the radix-2 FFT function.
# Uses Bluestein's chirp z-transform algorithm.
# 
def transform_bluestein(vec, inverse):
	# Find a power-of-2 convolution length m such that m >= n * 2 + 1
	n = len(vec)
	if n == 0:
		return []
	m = 2**((n * 2).bit_length())
	
	coef = (1 if inverse else -1) * cmath.pi / n
	exptable = [cmath.rect(1, (i * i % (n * 2)) * coef) for i in range(n)]  # Trigonometric table
	avec = [(x * y) for (x, y) in zip(vec, exptable)] + [0] * (m - n)  # Temporary vectors and preprocessing
	bvec = exptable[ : n] + [0] * (m - (n * 2 - 1)) + exptable[ : 0 : -1]
	bvec = [x.conjugate() for x in bvec]
	cvec = convolve(avec, bvec, False)[ : n]  # Convolution
	return [(x * y) for (x, y) in zip(cvec, exptable)]  # Postprocessing


# 
# Computes the circular convolution of the given real or complex vectors, returning the result as a new vector. Each vector's length must be the same.
# realoutput=True: Extract the real part of the convolution, so that the output is a list of floats. This is useful if both inputs are real.
# realoutput=False: The output is always a list of complex numbers (even if both inputs are real).
# 
def convolve(xvec, yvec, realoutput=True):
	assert len(xvec) == len(yvec)
	n = len(xvec)
	xvec = transform(xvec, False)
	yvec = transform(yvec, False)
	for i in range(n):
		xvec[i] *= yvec[i]
	xvec = transform(xvec, True)
	
	# Scaling (because this FFT implementation omits it) and postprocessing
	if realoutput:
		return [(val.real / n) for val in xvec]
	else:
		return [(val / n) for val in xvec]
