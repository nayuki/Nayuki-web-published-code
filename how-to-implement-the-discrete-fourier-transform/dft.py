# 
# Discrete Fourier transform
# Copyright (c) 2012 Nayuki Minase
# 
# http://nayuki.eigenstate.org/page/how-to-implement-the-discrete-fourier-transform
# 

# 
# This file contains multiple implementations.
# Before running the code, choose one and delete the rest.
# 


# 
# Computes the discrete Fourier transform (DFT) of the given input vector.
# 'input' is a list or tuple of complex numbers.
# Returns a list of complex numbers as output, having the same length.
# 
import cmath

def compute_dft(input):
    n = len(input)
    output = [0] * n
    for k in xrange(n):  # For each output element
        s = 0
        for t in xrange(n):  # For each input element
            s += input[t] * cmath.exp(-2j * cmath.pi * t * k / n)
        output[k] = s
    return output


# 
# Alternate implementation using only real numbers.
# Computes the discrete Fourier transform (DFT) of the given input vector.
# 'inreal' and 'inimag' are each a list or tuple of n floating-point numbers.
# Returns a tuple of two lists - outreal and outimag, each of length n.
# 
import math

def compute_dft(inreal, inimag):
    assert len(inreal) == len(inimag)
    n = len(inreal)
    outreal = [0] * n
    outimag = [0] * n
    for k in xrange(n):  # For each output element
        sumreal = 0
        sumimag = 0
        for t in xrange(n):  # For each input element
            sumreal +=  inreal[t]*math.cos(2*math.pi * t * k / n) + inimag[t]*math.sin(2*math.pi * t * k / n)
            sumimag += -inreal[t]*math.sin(2*math.pi * t * k / n) + inimag[t]*math.cos(2*math.pi * t * k / n)
        outreal[k] = sumreal
        outimag[k] = sumimag
    return (outreal, outimag)
