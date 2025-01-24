# 
# Karatsuba fast multiplication algorithm (Python)
# 
# Copyright (c) 2025 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/karatsuba-multiplication
# 


# Requirement: _CUTOFF >= 64, or else there will be infinite recursion.
_CUTOFF = 1536


def multiply(x: int, y: int) -> int:
	if (x.bit_length() <= _CUTOFF) or (y.bit_length() <= _CUTOFF):  # Base case
		return x * y
	
	else:
		n: int = max(x.bit_length(), y.bit_length())
		half: int = (n + 32) // 64 * 32
		mask: int = (1 << half) - 1
		xlow: int = x & mask
		ylow: int = y & mask
		xhigh: int = x >> half
		yhigh: int = y >> half
		
		a: int = multiply(xhigh, yhigh)
		b: int = multiply(xlow + xhigh, ylow + yhigh)
		c: int = multiply(xlow, ylow)
		d: int = b - a - c
		return (((a << half) + d) << half) + c
