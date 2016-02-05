# 
# Karatsuba fast multiplication algorithm
# Copyright (c) 2014 Project Nayuki
# 
# https://www.nayuki.io/page/karatsuba-multiplication
# 

# Requires Python version >= 2.7 because of long.bit_length().


# Requirement: _CUTOFF >= 64, or else there will be infinite recursion.
_CUTOFF = 1536


def multiply(x, y):
    if x.bit_length() <= _CUTOFF or y.bit_length() <= _CUTOFF:  # Base case
        return x * y
    
    else:
        n = max(x.bit_length(), y.bit_length())
        half = (n + 32) // 64 * 32
        mask = (1 << half) - 1
        xlow = x & mask
        ylow = y & mask
        xhigh = x >> half
        yhigh = y >> half
        
        a = multiply(xhigh, yhigh)
        b = multiply(xlow + xhigh, ylow + yhigh)
        c = multiply(xlow, ylow)
        d = b - a - c
        return (((a << half) + d) << half) + c
