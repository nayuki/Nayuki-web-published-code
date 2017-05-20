# 
# Discrete Fourier transform
# by Project Nayuki, 2017. Public domain.
# https://www.nayuki.io/page/how-to-implement-the-discrete-fourier-transform
# 


# 
# Computes the discrete Fourier transform (DFT) of the given complex vector.
# 'input' is a sequence of numbers (integer, float, or complex).
# Returns a list of complex numbers as output, having the same length.
# 
import cmath
def compute_dft_complex(input):
	n = len(input)
	output = [None] * n
	for k in range(n):  # For each output element
		s = complex(0)
		for t in range(n):  # For each input element
			s += input[t] * cmath.exp(-2j * cmath.pi * t * k / n)
		output[k] = s
	return output


# 
# (Alternate implementation using only real numbers.)
# Computes the discrete Fourier transform (DFT) of the given complex vector.
# 'inreal' and 'inimag' are each a sequence of n floating-point numbers.
# Returns a tuple of two lists of floats - outreal and outimag, each of length n.
# 
import math
def compute_dft_real_pair(inreal, inimag):
	assert len(inreal) == len(inimag)
	n = len(inreal)
	outreal = [None] * n
	outimag = [None] * n
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
