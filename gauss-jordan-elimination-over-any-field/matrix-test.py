# 
# Gauss-Jordan elimination over any field (Python)
# 
# Copyright (c) 2017 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/gauss-jordan-elimination-over-any-field
# 

import math, random, unittest
import fieldmath


class MatrixTest(unittest.TestCase):
	
	field = fieldmath.PrimeField(11)
	
	
	def test_single_0(self):
		inp = [[0]]
		out = [[0]]
		self._test_reduce_matrix(inp, out)
	
	
	def test_single_1(self):
		inp = [[1]]
		out = [[1]]
		self._test_reduce_matrix(inp, out)
	
	
	def test_single_2(self):
		inp = [[2, 3]]
		out = [[1, 7]]
		self._test_reduce_matrix(inp, out)
	
	
	def test_single_3(self):
		inp = [[9, 2, 7]]
		out = [[1, 10, 2]]
		self._test_reduce_matrix(inp, out)
	
	
	def test_double_0(self):
		inp = [[1, 0], [0, 1]]
		out = [[1, 0], [0, 1]]
		self._test_reduce_matrix(inp, out)
	
	
	def test_double_1(self):
		inp = [[0, 1], [1, 0]]
		out = [[1, 0], [0, 1]]
		self._test_reduce_matrix(inp, out)
	
	
	def test_double_2(self):
		inp = [[2, 3], [4, 5]]
		out = [[1, 0], [0, 1]]
		self._test_reduce_matrix(inp, out)
	
	
	def test_double_3(self):
		inp = [[0, 2], [0, 5]]
		out = [[0, 1], [0, 0]]
		self._test_reduce_matrix(inp, out)
	
	
	def test_double_4(self):
		inp = [[7, 3], [2, 4]]
		out = [[1, 2], [0, 0]]
		self._test_reduce_matrix(inp, out)
	
	
	def test_double_5(self):
		inp = [[6, 1, 5], [2, 4, 3]]
		out = [[1, 2, 0], [0, 0, 1]]
		self._test_reduce_matrix(inp, out)
	
	
	def test_triple_0(self):
		inp = [[0, 0, 4], [1, 0, 3], [0, 8, 2]]
		out = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
		self._test_reduce_matrix(inp, out)
	
	
	def test_triple_1(self):
		inp = [[1, 1, 1, 1], [1, 1, 2, 3], [1, 2, 2, 2]]
		out = [[1, 0, 0, 0], [0, 1, 0, 10], [0, 0, 1, 2]]
		self._test_reduce_matrix(inp, out)
	
	
	def test_triple_2(self):
		inp = [[2, 5, 10, 1], [7, 1, 6, 3], [6, 4, 6, 6]]
		out = [[1, 8, 0, 8], [0, 0, 1, 4], [0, 0, 0, 0]]
		self._test_reduce_matrix(inp, out)
	
	
	def _test_reduce_matrix(self, inp, out):
		mat = fieldmath.Matrix(len(inp), len(inp[0]), MatrixTest.field)
		for i in range(mat.row_count()):
			for j in range(mat.column_count()):
				mat.set(i, j, inp[i][j])
		
		mat.reduced_row_echelon_form()
		for i in range(mat.row_count()):
			for j in range(mat.column_count()):
				self.assertTrue(MatrixTest.field.equals(mat.get(i, j), out[i][j]))
	
	
	def test_determinant_1(self):
		for i in range(MatrixTest.field.size):
			mat = fieldmath.Matrix(1, 1, MatrixTest.field)
			mat.set(0, 0, i)
			self.assertEqual(i, mat.determinant_and_ref())
	
	
	def test_determinant_2(self):
		f = MatrixTest.field
		for _ in range(1000):
			mat = fieldmath.Matrix(2, 2, f)
			for i in range(mat.row_count()):
				for j in range(mat.column_count()):
					mat.set(i, j, random.randrange(f.size))
			expect = f.subtract(f.multiply(mat.get(0, 0), mat.get(1, 1)), f.multiply(mat.get(0, 1), mat.get(1, 0)))
			self.assertEqual(mat.determinant_and_ref(), expect)
	
	
	def test_determinants(self):
		for _ in range(1000):
			size = int(math.sqrt(random.random()) * 5) + 2
			size = max(min(size, 6), 1)
			
			mat = fieldmath.Matrix(size, size, MatrixTest.field)
			for i in range(mat.row_count()):
				for j in range(mat.column_count()):
					mat.set(i, j, random.randrange(MatrixTest.field.size))
			
			expect = MatrixTest.determinant(mat, 0, [False] * size, MatrixTest.field)
			self.assertEqual(mat.determinant_and_ref(), expect)
	
	
	# Slow O(n^n) algorithm using cofactor expansion.
	@staticmethod
	def determinant(mat, row, colsused, f):
		if row == mat.row_count():
			return f.one()
		else:
			sum = f.zero()
			j = 0
			for i in range(mat.column_count()):
				if not colsused[i]:
					colsused[i] = True
					term = f.multiply(mat.get(row, i), MatrixTest.determinant(mat, row + 1, colsused, f))
					colsused[i] = False
					if j % 2 == 1:
						term = f.negate(term)
					sum = f.add(term, sum)
					j += 1
			return sum
	
	
	def test_invert(self):
		zero = MatrixTest.field.zero()
		one = MatrixTest.field.one()
		for _ in range(300):
			size = int(math.sqrt(random.random()) * 9) + 2
			size = max(min(size, 10), 1)
			
			mat = fieldmath.Matrix(size, size, MatrixTest.field)
			for i in range(mat.row_count()):
				for j in range(mat.column_count()):
					mat.set(i, j, random.randrange(MatrixTest.field.size))
			
			if MatrixTest.field.equals(mat.determinant_and_ref(), zero):
				continue
			
			inverse = mat.clone()
			inverse.invert()
			
			prod = mat.multiply(inverse)
			self.assertEqual(prod.row_count(), size)
			self.assertEqual(prod.column_count(), size)
			for i in range(size):
				for j in range(size):
					self.assertEqual(prod.get(i, j), (one if i == j else zero))
			
			prod = inverse.multiply(mat)
			self.assertEqual(prod.row_count(), size)
			self.assertEqual(prod.column_count(), size)
			for i in range(size):
				for j in range(size):
					self.assertEqual(prod.get(i, j), (one if i == j else zero))


if __name__ == "__main__":
	unittest.main()
