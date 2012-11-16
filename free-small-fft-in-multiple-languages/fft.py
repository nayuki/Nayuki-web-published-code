# 
# Free FFT and convolution (Python)
# Copyright (c) 2012 Nayuki Minase
# http://nayuki.eigenstate.org/page/free-small-fft-in-multiple-languages
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

import cmath


# 
# Computes the discrete Fourier transform (DFT) of the given complex vector, returning the result as a new vector.
# Set 'inverse' to True if computing the inverse transform. This DFT does not perform scaling, so the inverse is not a true inverse.
# The vector can have any length. This is a wrapper function.
# 
def transform(vector, inverse=False):
    n = len(vector)
    if n > 0 and n & (n - 1) == 0:  # Is power of 2
        return transform_radix2(vector, inverse)
    else:  # More complicated algorithm for aribtrary sizes
        return transform_bluestein(vector, inverse)


# 
# Computes the discrete Fourier transform (DFT) of the given complex vector, returning the result as a new vector.
# The vector's length must be a power of 2. Uses the Cooley-Tukey decimation-in-time radix-2 algorithm.
# 
def transform_radix2(vector, inverse):
    # Initialization
    n = len(vector)
    levels = _log2(n)
    exptable = [cmath.exp((2j if inverse else -2j) * cmath.pi * i / n) for i in xrange(n / 2)]
    vector = [vector[_reverse(i, levels)] for i in xrange(n)]  # Copy with bit-reversed permutation
    
    # Radix-2 decimation-in-time FFT
    size = 2
    while size <= n:
        halfsize = size / 2
        tablestep = n / size
        for i in xrange(0, n, size):
            k = 0
            for j in xrange(i, i + halfsize):
                temp = vector[j + halfsize] * exptable[k]
                vector[j + halfsize] = vector[j] - temp
                vector[j] += temp
                k += tablestep
        size *= 2
    return vector


# 
# Computes the discrete Fourier transform (DFT) of the given complex vector, returning the result as a new vector.
# The vector can have any length. This requires the convolution function, which in turn requires the radix-2 FFT function.
# Uses Bluestein's chirp z-transform algorithm.
# 
def transform_bluestein(vector, inverse):
    # Find a power-of-2 convolution length m such that m >= n * 2 + 1
    n = len(vector)
    m = 1
    while m < n * 2 + 1:
        m *= 2
    
    exptable = [cmath.exp((1j if inverse else -1j) * cmath.pi * (i * i % (n * 2)) / n) for i in xrange(n)]  # Trigonometric table
    a = [x * y for (x, y) in zip(vector, exptable)] + [0] * (m - n)  # Temporary vectors and preprocessing
    b = [(exptable[min(i, m - i)].conjugate() if (i < n or m - i < n) else 0) for i in xrange(m)]
    c = convolve(a, b, False)[:n]  # Convolution
    for i in xrange(n):  # Postprocessing
        c[i] *= exptable[i]
    return c


# 
# Computes the circular convolution of the given real or complex vectors, returning the result as a new vector. Each vector's length must be the same.
# realoutput=True: Extract the real part of the convolution, so that the output is a list of floats. This is useful if both inputs are real.
# realoutput=False: The output is always a list of complex numbers (even if both inputs are real).
# 
def convolve(x, y, realoutput=True):
    assert len(x) == len(y)
    n = len(x)
    x = transform(x)
    y = transform(y)
    for i in xrange(n):
        x[i] *= y[i]
    x = transform(x, inverse=True)
    
    # Scaling (because this FFT implementation omits it) and postprocessing
    if realoutput:
        for i in xrange(n):
            x[i] = x[i].real / n
    else:
        for i in xrange(n):
            x[i] /= n
    return x


# Returns the integer whose value is the reverse of the lowest 'bits' bits of the integer 'x'.
def _reverse(x, bits):
    y = 0
    for i in xrange(bits):
        y = (y << 1) | (x & 1)
        x >>= 1
    return y


# Returns the integer y such that 2^y == x, or raises an exception if x is not a power of 2.
def _log2(x):
    i = 0
    while True:
        if 1 << i == x:
            return i
        elif 1 << i > x:
            raise ValueError("Not a power of 2")
        else:
            i += 1
