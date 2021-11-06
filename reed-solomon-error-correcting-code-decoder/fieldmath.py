# 
# Reed-Solomon error-correcting code decoder (Python)
# 
# Copyright (c) 2021 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/reed-solomon-error-correcting-code-decoder
# 


# ---- Field abstract class ----

class Field:
	"""An abstract base class representing a field in abstract algebra. Every field must
	satisfy all these axioms, where x, y, z are arbitrary elements of the field:
	- 0 is an element of the field, and 0 + x = x. (Existence of additive identity)
	- 1 is an element of the field, and 1 * x = x. (Existence of multiplicative identity)
	- 0 != 1. (Distinctness of additive and multiplicative identities)
	- x + y = y + x. (Commutativity of addition)
	- x * y = y * x. (Commutativity of multiplication)
	- (x + y) + z = x + (y + z). (Associativity of addition)
	- (x * y) * z = x * (y * z). (Associativity of multiplication)
	- x * (y + z) = (x * y) + (x * z). (Distributivity of multiplication over addition)
	- -x is an element of the field, such that x + (-x) = 0. (Existence of additive inverse)
	- If x != 0, then x^-1 is an element of the field, such that x * (x^-1) = 1. (Existence of multiplicative inverse)
	Each Field object should be stateless and immutable. The field element objects should be immutable too."""
	
	
	# -- Constant values --
	
	def zero(self):
		"""Returns the additive identity constant of this field."""
		raise NotImplementedError()
	
	
	def one(self):
		"""Returns the multiplicative identity constant of this field."""
		raise NotImplementedError()
	
	
	# -- Comparison --
	
	def equals(self, x, y):
		"""Tests whether the two given elements are equal.
		Note that the elements are not required to implement their own __eq__() correctly.
		This means x == y is allowed to mismatch f.equals(x, y)."""
		raise NotImplementedError()
	
	
	# -- Addition/subtraction --
	
	def negate(self, x):
		"""Returns the additive inverse of the given element."""
		raise NotImplementedError()
	
	
	def add(self, x, y):
		"""Returns the sum of the two given elements."""
		raise NotImplementedError()
	
	
	def subtract(self, x, y):
		"""Returns the difference of the two given elements.
		A correct default implementation is provided."""
		return self.add(x, self.negate(y))
	
	
	# -- Multiplication/division --
	
	def reciprocal(self, x):
		"""Returns the multiplicative inverse of the given non-zero element."""
		raise NotImplementedError()
	
	
	def multiply(self, x, y):
		"""Returns the product of the two given elements."""
		raise NotImplementedError()
	
	
	def divide(self, x, y):
		"""Returns the quotient of the given elements.
		A correct default implementation is provided."""
		return self.multiply(x, self.reciprocal(y))



# ---- PrimeField class ----

class PrimeField(Field):
	"""A finite field of the form Z_p, where p is a prime number.
	Each element of this kind of field is an integer in the range [0, p).
	Both the field and the elements are immutable and thread-safe."""
	
	
	def __init__(self, mod):
		"""Constructs a prime field with the given modulus. The modulus must be a
		prime number, but this crucial property is not checked by the constructor."""
		if mod < 2:
			raise ValueError("Modulus must be prime")
		# The modulus of this field, which is also the number of elements in this finite field. Must be prime.
		self.modulus = mod
	
	
	def zero(self):
		return 0
	
	def one(self):
		return 1
	
	
	def equals(self, x, y):
		return self._check(x) == self._check(y)
	
	def negate(self, x):
		return -self._check(x) % self.modulus
	
	def add(self, x, y):
		return (self._check(x) + self._check(y)) % self.modulus
	
	def subtract(self, x, y):
		return (self._check(x) - self._check(y)) % self.modulus
	
	
	def multiply(self, x, y):
		return (self._check(x) * self._check(y)) % self.modulus
	
	
	def reciprocal(self, w):
		# Extended Euclidean GCD algorithm
		x = self.modulus
		y = self._check(w)
		if y == 0:
			raise ValueError("Division by zero")
		a = 0
		b = 1
		while y != 0:
			q, r = x // y, x % y
			x, y = y, r
			a, b = b, (a - q * b)
		if x == 1:
			return a % self.modulus
		else:  # All non-zero values must have a reciprocal
			raise AssertionError("Field modulus is not prime")
	
	
	# Checks if the given object is the correct type and within
	# the range of valid values, and returns the value itself.
	def _check(self, x):
		if not isinstance(x, int):
			raise TypeError()
		if not (0 <= x < self.modulus):
			raise ValueError("Not an element of this field: " + str(x))
		return x



# ---- BinaryField class ----

class BinaryField(Field):
	"""A Galois field of the form GF(2^n/mod). Each element of this kind of field is a
	polynomial of degree less than n where each monomial coefficient is either 0 or 1.
	Both the field and the elements are immutable and thread-safe."""
	
	
	def __init__(self, mod):
		"""Constructs a binary field with the given modulus. The modulus must have
		degree at least 1. Also the modulus must be irreducible (not factorable) in Z_2,
		but this critical property is not checked by the constructor."""
		if mod <= 1:
			raise ValueError("Invalid modulus")
		
		# The modulus of this field represented as a string of bits in natural order.
		# For example, the modulus x^5 + x^1 + x^0 is represented by the integer value 0b100011 (binary) or 35 (decimal).
		self.modulus = mod
		
		# The number of (unique) elements in this field. It is a positive power of 2, e.g. 2, 4, 8, 16, etc.
		# The size of the field is equal to 2 to the power of the degree of the modulus.
		self.size = 1 << (mod.bit_length() - 1)
	
	
	def zero(self):
		return 0
	
	def one(self):
		return 1
	
	
	def equals(self, x, y):
		return self._check(x) == self._check(y)
	
	def negate(self, x):
		return self._check(x)
	
	def add(self, x, y):
		return self._check(x) ^ self._check(y)
	
	def subtract(self, x, y):
		return self.add(x, y)
	
	
	def multiply(self, x, y):
		self._check(x)
		self._check(y)
		result = 0
		while y != 0:
			if y & 1 != 0:
				result ^= x
			x <<= 1
			if x >= self.size:
				x ^= self.modulus
			y >>= 1
		return result
	
	
	def reciprocal(self, w):
		# Extended Euclidean GCD algorithm
		x = self.modulus
		y = self._check(w)
		if y == 0:
			raise ValueError("Division by zero")
		a = 0
		b = 1
		while y != 0:
			q, r = self._divide_and_remainder(x, y)
			if q == self.modulus:
				q = 0
			x, y = y, r
			a, b = b, (a ^ self.multiply(q, b))
		if x == 1:
			return a
		else:  # All non-zero values must have a reciprocal
			raise AssertionError("Field modulus is not irreducible")
	
	
	# Returns a new tuple containing the pair of values (x div y, x mod y).
	def _divide_and_remainder(self, x, y):
		quotient = 0
		ylen = y.bit_length()
		for i in reversed(range(x.bit_length() - ylen + 1)):
			if x.bit_length() == ylen + i:
				x ^= y << i
				quotient |= 1 << i
		return (quotient, x)
	
	
	# Checks if the given object is the correct type and within the
	# range of valid values, and returns the same value.
	def _check(self, x):
		if not isinstance(x, int):
			raise TypeError()
		if not (0 <= x < self.size):
			raise ValueError("Not an element of this field: " + str(x))
		return x



# ---- Matrix class ----

class Matrix:
	"""Represents a mutable matrix of field elements, supporting linear algebra operations.
	Note that the dimensions of a matrix cannot be changed after construction. Not thread-safe."""
	
	
	def __init__(self, rows, cols, field):
		"""Constructs a blank matrix with the given number of rows and columns,
		with operations from the given field. All the elements are initially None."""
		if rows <= 0 or cols <= 0:
			raise ValueError("Invalid number of rows or columns")
		if not isinstance(field, Field):
			raise TypeError()
		
		# The field used to operate on the values in the matrix.
		self.f = field
		# The values of the matrix stored in row-major order, with each element initially None.
		self.values = [[None] * cols for _ in range(rows)]
	
	
	# -- Basic matrix methods --
	
	def row_count(self):
		"""Returns the number of rows in this matrix, which is a positive integer."""
		return len(self.values)
	
	
	def column_count(self):
		"""Returns the number of columns in this matrix, which is a positive integer."""
		return len(self.values[0])
	
	
	def get(self, row, col):
		"""Returns the element at the given location in this matrix. The result may be None."""
		if not (0 <= row < len(self.values) and 0 <= col < len(self.values[row])):
			raise IndexError("Row or column index out of bounds")
		return self.values[row][col]
	
	
	def set(self, row, col, val):
		"""Stores the given element at the given location in this matrix. The value to store can be None."""
		if not (0 <= row < len(self.values) and 0 <= col < len(self.values[row])):
			raise IndexError("Row or column index out of bounds")
		self.values[row][col] = val
	
	
	def __str__(self):
		"""Returns a string representation of this matrix. The format is subject to change."""
		result = "["
		for (i, row) in enumerate(self.values):
			if i > 0:
				result += ",\n "
			result += "[" + ", ".join(str(val) for val in row) + "]"
		return result + "]"
	
	
	# -- Simple matrix row operations --
	
	def swap_rows(self, row0, row1):
		"""Swaps the two given rows of this matrix. If the two row indices are the same, the swap is a no-op.
		Any matrix element can be None when performing this operation."""
		if not (0 <= row0 < len(self.values) and 0 <= row1 < len(self.values)):
			raise IndexError("Row index out of bounds")
		self.values[row0], self.values[row1] = self.values[row1], self.values[row0]
	
	
	def multiply_row(self, row, factor):
		"""Multiplies the given row in this matrix by the given factor. In other words, row *= factor.
		The elements of the given row should all be non-None when performing this operation."""
		if not (0 <= row < len(self.values)):
			raise IndexError("Row index out of bounds")
		self.values[row] = [self.f.multiply(val, factor) for val in self.values[row]]
	
	
	def add_rows(self, srcrow, destrow, factor):
		"""Adds the first given row in this matrix multiplied by the given factor to the second given row.
		In other words, destdow += srcrow * factor. The elements of the given two rows
		should all be non-None when performing this operation."""
		if not (0 <= srcrow < len(self.values) and 0 <= destrow < len(self.values)):
			raise IndexError("Row index out of bounds")
		self.values[destrow] = [self.f.add(destval, self.f.multiply(srcval, factor))
			for (srcval, destval) in zip(self.values[srcrow], self.values[destrow])]
	
	
	# -- Advanced matrix operations --
	
	def reduced_row_echelon_form(self):
		"""Converts this matrix to reduced row echelon form (RREF) using Gauss-Jordan elimination.
		All elements of this matrix should be non-None when performing this operation.
		Always succeeds, as long as the field follows the mathematical rules and does not raise an exception.
		The time complexity of this operation is O(rows * cols * min(rows, cols))."""
		rows = self.row_count()
		cols = self.column_count()
		
		# Compute row echelon form (REF)
		numpivots = 0
		for j in range(cols):  # For each column
			if numpivots >= rows:
				break
			pivotrow = numpivots
			while pivotrow < rows and self.f.equals(self.get(pivotrow, j), self.f.zero()):
				pivotrow += 1
			if pivotrow == rows:
				continue  # Cannot eliminate on this column
			self.swap_rows(numpivots, pivotrow)
			pivotrow = numpivots
			numpivots += 1
			
			# Simplify the pivot row
			self.multiply_row(pivotrow, self.f.reciprocal(self.get(pivotrow, j)))
			
			# Eliminate rows below
			for i in range(pivotrow + 1, rows):
				self.add_rows(pivotrow, i, self.f.negate(self.get(i, j)))
		
		# Compute reduced row echelon form (RREF)
		for i in reversed(range(numpivots)):
			# Find pivot
			pivotcol = 0
			while pivotcol < cols and self.f.equals(self.get(i, pivotcol), self.f.zero()):
				pivotcol += 1
			if pivotcol == cols:
				continue  # Skip this all-zero row
			
			# Eliminate rows above
			for j in range(i):
				self.add_rows(i, j, self.f.negate(self.get(j, pivotcol)))
