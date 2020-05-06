# 
# FFT and convolution test (Python)
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

import cmath, math, random
import fft


# ---- Main and test functions ----

def main():
	global _maxlogerr
	
	# Test power-of-2 size FFTs
	for i in range(0, 12 + 1):
		_test_fft(1 << i)
	
	# Test small size FFTs
	for i in range(0, 30):
		_test_fft(i)
	
	# Test diverse size FFTs
	prev = 0
	for i in range(100 + 1):
		n = int(round(1500 ** (i / 100)))
		if n > prev:
			_test_fft(n)
			prev = n
	
	# Test power-of-2 size convolutions
	for i in range(0, 12 + 1):
		_test_convolution(1 << i)
	
	# Test diverse size convolutions
	prev = 0
	for i in range(100 + 1):
		n = int(round(1500 ** (i / 100)))
		if n > prev:
			_test_convolution(n)
			prev = n
	
	print()
	print(f"Max log err = {_maxlogerr:.1f}")
	print(f"Test {'passed' if _maxlogerr < -10 else 'failed'}")


def _test_fft(size):
	input = _random_vector(size)
	expect = _naive_dft(input, False)
	actual = fft.transform(input, False)
	err = _log10_rms_err(expect, actual)
	
	actual = [(x / size) for x in expect]
	actual = fft.transform(actual, True)
	err = max(_log10_rms_err(input, actual), err)
	print(f"fftsize={size:4d}  logerr={err:5.1f}")


def _test_convolution(size):
	input0 = _random_vector(size)
	input1 = _random_vector(size)
	expect = _naive_convolution(input0, input1)
	actual = fft.convolve(input0, input1, False)
	print(f"convsize={size:4d}  logerr={_log10_rms_err(expect, actual):5.1f}")


# ---- Naive reference computation functions ----

def _naive_dft(input, inverse):
	n = len(input)
	output = []
	if n == 0:
		return output
	coef = (2 if inverse else -2) * math.pi / n
	for k in range(n):  # For each output element
		s = 0
		for t in range(n):  # For each input element
			s += input[t] * cmath.rect(1, (t * k % n) * coef)
		output.append(s)
	return output


def _naive_convolution(xvec, yvec):
	assert len(xvec) == len(yvec)
	n = len(xvec)
	result = [0] * n
	for i in range(n):
		for j in range(n):
			result[(i + j) % n] += xvec[i] * yvec[j]
	return result


# ---- Utility functions ----

_maxlogerr = -math.inf

def _log10_rms_err(xvec, yvec):
	global _maxlogerr
	assert len(xvec) == len(yvec)
	err = 10.0**(-99 * 2)
	for (x, y) in zip(xvec, yvec):
		err += abs(x - y) ** 2
	err = math.sqrt(err / max(len(xvec), 1))  # Now this is a root mean square (RMS) error
	err = math.log10(err)
	_maxlogerr = max(err, _maxlogerr)
	return err


def _random_vector(n):
	return [complex(random.uniform(-1.0, 1.0), random.uniform(-1.0, 1.0)) for _ in range(n)]


if __name__ == "__main__":
	main()
