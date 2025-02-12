# 
# Discrete Fourier transform (Python)
# by Project Nayuki, 2025. Public domain.
# https://www.nayuki.io/page/how-to-implement-the-discrete-fourier-transform
# 


# 
# Computes the discrete Fourier transform (DFT) of the given complex vector.
# 'input' is a sequence of numbers (integer, float, or complex).
# Returns a list of complex numbers as output, having the same length.
# 
import cmath
from typing import Sequence
def compute_dft_complex(input: Sequence[complex]) -> list[complex]:
	n: int = len(input)
	output: list[complex] = []
	for k in range(n):  # For each output element
		s: complex = complex(0)
		for t in range(n):  # For each input element
			angle: complex = 2j * cmath.pi * t * k / n
			s += input[t] * cmath.exp(-angle)
		output.append(s)
	return output


# 
# (Alternate implementation using only real numbers.)
# Computes the discrete Fourier transform (DFT) of the given complex vector.
# 'inreal' and 'inimag' are each a sequence of n floating-point numbers.
# Returns a tuple of two lists of floats - outreal and outimag, each of length n.
# 
import math
from typing import Sequence
def compute_dft_real_pair(inreal: Sequence[float], inimag: Sequence[float]) -> tuple[list[float],list[float]]:
	if len(inreal) != len(inimag):
		raise ValueError()
	n: int = len(inreal)
	outreal: list[float] = []
	outimag: list[float] = []
	for k in range(n):  # For each output element
		sumreal: float = 0.0
		sumimag: float = 0.0
		for t in range(n):  # For each input element
			angle = 2 * math.pi * t * k / n
			sumreal +=  inreal[t] * math.cos(angle) + inimag[t] * math.sin(angle)
			sumimag += -inreal[t] * math.sin(angle) + inimag[t] * math.cos(angle)
		outreal.append(sumreal)
		outimag.append(sumimag)
	return (outreal, outimag)
