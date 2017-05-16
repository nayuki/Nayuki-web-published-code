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
			
			expect = slidingwindowminmax.calc_window_min_or_max_naive(array, window, maximize)
			actual = slidingwindowminmax.calc_window_min_or_max_deque(array, window, maximize)
			self.assertEqual(expect, actual)


if __name__ == "__main__":
	unittest.main()
