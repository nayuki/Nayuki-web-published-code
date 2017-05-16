# 
# Sliding window min/max (Python 2, 3)
# 
# Copyright (c) 2017 Project Nayuki. (MIT License)
# https://www.nayuki.io/page/sliding-window-minimum-maximum-algorithm
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

import collections, numbers


def calc_window_min_or_max_deque(array, window, maximize):
	if not isinstance(window, numbers.Integral):
		raise TypeError()
	if not isinstance(maximize, bool):
		raise TypeError()
	if window <= 0:
		raise ValueError("Window size must be positive")
	
	result = []
	deque = collections.deque()
	for (i, val) in enumerate(array):
		val = array[i]
		while len(deque) > 0 and ((not maximize and val < deque[-1]) or (maximize and val > deque[-1])):
			deque.pop()
		deque.append(val)
		
		j = i + 1 - window
		if j >= 0:
			result.append(deque[0])
			if array[j] == deque[0]:
				deque.popleft()
	return result


def calc_window_min_or_max_naive(array, window, maximize):
	if not isinstance(window, numbers.Integral):
		raise TypeError()
	if not isinstance(maximize, bool):
		raise TypeError()
	if window <= 0:
		raise ValueError("Window size must be positive")
	func = max if maximize else min
	return [func(array[i : i + window]) for i in range(len(array) - window + 1)]
