# 
# Discrete Fourier transform
# by Project Nayuki, 2014. Public domain.
# https://www.nayuki.io/page/how-to-implement-the-discrete-fourier-transform
# 

# 
# This file contains multiple implementations.
# Before running the code, choose one and delete the rest.
# 

# --------------------------------------------------------------------------------

# 
# Computes the discrete Fourier transform (DFT) of the given input vector.
# 'input' is a sequence of numbers (integer, float, or complex).
# Returns a list of complex numbers as output, having the same length.
# 
import cmath

def compute_dft(input):
    n = len(input)
    output = [complex(0)] * n
    for k in range(n):  # For each output element
        s = complex(0)
        for t in range(n):  # For each input element
            s += input[t] * cmath.exp(-2j * cmath.pi * t * k / n)
        output[k] = s
    return output

# --------------------------------------------------------------------------------

# 
# (Alternate implementation using only real numbers.)
# Computes the discrete Fourier transform (DFT) of the given input vector.
# 'inreal' and 'inimag' are each a sequence of n floating-point numbers.
# Returns a tuple of two lists of floats - outreal and outimag, each of length n.
# 
import math

def compute_dft(inreal, inimag):
    assert len(inreal) == len(inimag)
    n = len(inreal)
    outreal = [0.0] * n
    outimag = [0.0] * n
    for k in range(n):  # For each output element
        sumreal = 0.0
        sumimag = 0.0
        for t in range(n):  # For each input element
            angle = 2 * math.pi * t * k / n
            sumreal +=  inreal[t] * math.cos(angle) + inimag[t] * math.sin(angle)
            sumimag += -inreal[t] * math.sin(angle) + inimag[t] * math.cos(angle)
        outreal[k] = sumreal
        outimag[k] = sumimag
    return (outreal, outimag)
