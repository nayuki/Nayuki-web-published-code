# 
# Sliding window min/max test (Python 2, 3)
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

import random, unittest
import slidingwindowminmax


class SlidingWindowMinMaxTest(unittest.TestCase):
	
	def test_randomly(self):
		trials = 10000
		for _ in range(trials):
			
			arraylen = random.randrange(300)
			array = [random.randrange(100) for _ in range(arraylen)]
			window = random.randrange(1, 31)
			maximize = random.randrange(2) != 0
			
			expect = _compute_naive(array, window, maximize)
			actual = slidingwindowminmax.compute(array, window, maximize)
			self.assertEqual(expect, actual)
	
	
	def test_incremental(self):
		trials = 300
		for _ in range(trials):
			
			array = [random.randrange(100) for _ in range(1000)]
			swm = slidingwindowminmax.SlidingWindowMinMax()
			start = 0
			end = 0
			while start < len(array):
				if start == end or (end < len(array) and random.randrange(2) != 0):
					swm.add_tail(array[end])
					end += 1
				else:
					swm.remove_head(array[start])
					start += 1
				
				assert start <= end
				if start < end:
					self.assertEqual(min(array[start : end]), swm.get_minimum())
					self.assertEqual(max(array[start : end]), swm.get_maximum())



def _compute_naive(array, window, maximize):
	if window <= 0:
		raise ValueError()
	func = max if maximize else min
	return [func(array[i : i + window]) for i in range(len(array) - window + 1)]


if __name__ == "__main__":
	unittest.main()
