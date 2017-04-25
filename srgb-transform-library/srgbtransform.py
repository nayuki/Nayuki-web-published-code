# 
# sRGB transform (Python 2, 3)
# 
# Copyright (c) 2017 Project Nayuki. (MIT License)
# https://www.nayuki.io/page/srgb-transform-library
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


def srgb_to_linear(x):
	if x <= 0.0:
		return 0.0
	elif x >= 1:
		return 1.0
	elif x < 0.04045:
		return x / 12.92
	else:
		return ((x + 0.055) / 1.055) ** 2.4


def srgb_8bit_to_linear(x):
	if (x >> 8) != 0:
		raise ValueError("Value out of 8-bit range")
	return _SRGB_8BIT_TO_LINEAR[x]


def linear_to_srgb(x):
	if x <= 0.0:
		return 0.0
	elif x >= 1:
		return 1.0
	elif x < 0.0031308:
		return x * 12.92
	else:
		return x ** (1.0 / 2.4) * 1.055 - 0.055


def linear_to_srgb_8bit(x):
	if x <= 0.0:
		return 0
	table = _SRGB_8BIT_TO_LINEAR
	if x >= 1.0:
		return len(table) - 1
	y = 0
	i = len(table) >> 1
	while i != 0:
		if table[y | i] <= x:
			y |= i
		i >>= 1
	return y if (x - table[y] <= table[y + 1] - x) else (y + 1)


_SRGB_8BIT_TO_LINEAR = [srgb_to_linear(i / 255.0) for i in range(256)]
