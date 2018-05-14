# 
# Elliptic curve point addition in projective coordinates
# 
# Copyright (c) 2018 Project Nayuki. (MIT License)
# https://www.nayuki.io/page/elliptic-curve-point-addition-in-projective-coordinates
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
from ellipticcurve import AffineCurvePoint, ProjectiveCurvePoint, FieldInt


class EllipticCurveTest(unittest.TestCase):
	
	def test_basic_affine(self):
		Z = AffineCurvePoint(None, None, GA.a, GA.b, MOD)
		self.assertTrue(Z.is_zero())
		self.assertFalse(Z.is_on_curve())
		self.assertEqual(Z.double(), Z)
		self.assertEqual(Z + Z, Z)
		self.assertEqual(Z + GA, GA)
		self.assertEqual(GA + Z, GA)
		self.assertTrue((GA - GA).is_zero())
		self.assertTrue((GA * ORDER).is_zero())
		
		p = GA
		for i in range(1, 100):
			self.assertTrue(p.is_on_curve())
			self.assertEqual(p, GA * i)
			self.assertTrue((p + -p).is_zero())
			p += GA
		
		p = -GA
		for i in range(1, 100):
			self.assertTrue(p.is_on_curve())
			self.assertEqual(p, GA * -i)
			self.assertTrue((p + -p).is_zero())
			p -= GA
	
	
	def test_basic_projective(self):
		Z = ProjectiveCurvePoint(None, None, None, GP.a, GP.b, MOD)
		self.assertTrue(Z.is_zero())
		self.assertFalse(Z.is_on_curve())
		self.assertEqual(Z.double(), Z)
		self.assertEqual(Z + Z, Z)
		self.assertEqual(Z + GP, GP)
		self.assertEqual(GP + Z, GP)
		self.assertTrue((GP - GP).is_zero())
		self.assertTrue((GP * ORDER).is_zero())
		
		p = GP
		for i in range(1, 100):
			self.assertTrue(p.is_on_curve())
			self.assertEqual(p, GP * i)
			self.assertTrue((p + -p).is_zero())
			p += GP
		
		p = -GP
		for i in range(1, 100):
			self.assertTrue(p.is_on_curve())
			self.assertEqual(p, GP * -i)
			self.assertTrue((p + -p).is_zero())
			p -= GP
	
	
	def test_affine_vs_projective(self):
		for i in range(-100, 100):
			self.assertEqual(GA * i, (GP * i).to_affine_point())
		for _ in range(100):
			bits = random.randrange(300)
			n = random.randrange(2**bits)
			p = GA * n
			q = GP * n
			self.assertTrue(p.is_zero() or p.is_on_curve())
			self.assertTrue(q.is_zero() or q.is_on_curve())
			self.assertEqual(p, q.to_affine_point())
			self.assertEqual(p.double(), p + p)
			self.assertEqual(q.double(), q + q)
			if n >= ORDER:
				self.assertEqual(p, GA * (n % ORDER))
				self.assertEqual(q, GP * (n % ORDER))


# Parameters for secp256k1 curve
A = 0
B = 7
MOD = 2**256 - 2**32 - 977
GA = AffineCurvePoint(
	FieldInt(0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798, MOD),
	FieldInt(0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8, MOD),
	FieldInt(A, MOD), FieldInt(B, MOD), MOD)
GP = GA.to_projective_point()
ORDER = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141


if __name__ == "__main__":
	unittest.main()
