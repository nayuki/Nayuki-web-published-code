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


# ---- Function for one-shot computation ----

def compute(array, window, maximize):
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



# ---- Stateful instance for incremental computation ----

class SlidingWindowMinMax(object):
	
	def __init__(self):
		self.mindeque = collections.deque()
		self.maxdeque = collections.deque()
	
	
	def get_minimum(self):
		return self.mindeque[0]
	
	
	def get_maximum(self):
		return self.maxdeque[0]
	
	
	def add_tail(self, val):
		while len(self.mindeque) > 0 and val < self.mindeque[-1]:
			self.mindeque.pop()
		self.mindeque.append(val)
		while len(self.maxdeque) > 0 and val > self.maxdeque[-1]:
			self.maxdeque.pop()
		self.maxdeque.append(val)
	
	
	def remove_head(self, val):
		if val == self.mindeque[0]:
			self.mindeque.popleft()
		if val == self.maxdeque[0]:
			self.maxdeque.popleft()
