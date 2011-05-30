# Discrete Fourier transform
# Copyright (c) 2011 Nayuki Minase

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
