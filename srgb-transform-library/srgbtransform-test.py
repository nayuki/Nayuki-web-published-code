# 
# sRGB transform test (Python)
# 
# Copyright (c) 2021 Project Nayuki. (MIT License)
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

import random, unittest
import srgbtransform


class SrgbTransformTest(unittest.TestCase):
	
	def test_forward_inverse(self):
		TRIALS = 100000
		for _ in range(TRIALS):
			x = random.uniform(0.0, 1.0)
			y = srgbtransform.srgb_to_linear(x)
			z = srgbtransform.linear_to_srgb(x)
			self.assertAlmostEqual(x, srgbtransform.linear_to_srgb(y), delta=SrgbTransformTest._DELTA)
			self.assertAlmostEqual(x, srgbtransform.srgb_to_linear(z), delta=SrgbTransformTest._DELTA)
	
	
	def test_monotonicity(self):
		TRIALS = 100000
		for _ in range(TRIALS):
			x = random.uniform(-0.5, 1.5)
			y = random.uniform(-0.5, 1.5)
			if y < x:
				x, y = y, x
			if y - x > SrgbTransformTest._DELTA:
				self.assertTrue(srgbtransform.srgb_to_linear(x) <= srgbtransform.srgb_to_linear(y))
				self.assertTrue(srgbtransform.linear_to_srgb(x) <= srgbtransform.linear_to_srgb(y))
				self.assertTrue(srgbtransform.linear_to_srgb_8bit(x) <= srgbtransform.linear_to_srgb_8bit(y))
	
	
	def test_8bit(self):
		for i in range(256):
			self.assertTrue(srgbtransform.linear_to_srgb_8bit(srgbtransform.srgb_8bit_to_linear(i)) == i);
			self.assertTrue(abs(srgbtransform.linear_to_srgb(srgbtransform.srgb_8bit_to_linear(i)) * 255 - i) < 1);
	
	
	_DELTA = 1e-7


if __name__ == "__main__":
	unittest.main()
