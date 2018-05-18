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

import numbers


# ---- Elliptic curve points in affine coordinates ----

class AffineCurvePoint(object):
	
	def __init__(self, x, y, a, b, mod):
		if not ((x is None and y is None) or (isinstance(x, FieldInt) and isinstance(y, FieldInt))):
			raise ValueError("Both coordinates must be FieldInt or None")
		if not isinstance(a, FieldInt) or not isinstance(b, FieldInt):
			raise TypeError("Expected FieldInt")
		if x is not None and (x.modulus != mod or y.modulus != mod) or a.modulus != mod or b.modulus != mod:
			raise ValueError("Moduli must match")
		
		self.x = x
		self.y = y
		self.a = a
		self.b = b
		self.modulus = mod
	
	
	def _create(self, x, y):
		return AffineCurvePoint(x, y, self.a, self.b, self.modulus)
	
	
	def is_zero(self):
		return self.x is None
	
	def is_on_curve(self):
		return not self.is_zero() and self.y * self.y == (self.x * self.x + self.a) * self.x + self.b
	
	def to_projective_point(self):
		if self.is_zero():
			return ProjectiveCurvePoint(None, None, None, self.a, self.b, self.modulus)
		else:
			return ProjectiveCurvePoint(self.x, self.y, FieldInt(1, self.modulus), self.a, self.b, self.modulus)
	
	
	def __add__(self, other):
		if not isinstance(other, AffineCurvePoint):
			raise TypeError("Expected AffineCurvePoint")
		if (self.a, self.b, self.modulus) != (other.a, other.b, other.modulus):
			raise ValueError("Other point must have same parameters")
		
		if self.is_zero():
			return other
		elif other.is_zero():
			return self
		elif self.x == other.x:
			if self.y == other.y:
				return self.double()
			else:
				return self._create(None, None)
		else:
			s = (self.y - other.y) * (self.x - other.x).reciprocal()
			rx = s * s - self.x - other.x
			ry = s * (self.x - rx) - self.y
			return self._create(rx, ry)
	
	
	def double(self):
		if self.is_zero() or self.y == 0:
			return self._create(None, None)
		else:
			s = (self.x * self.x * FieldInt(3, self.modulus) + self.a) * (self.y * FieldInt(2, self.modulus)).reciprocal()
			rx = s * s - self.x * FieldInt(2, self.modulus)
			ry = s * (self.x - rx) - self.y
			return self._create(rx, ry)
	
	
	def __neg__(self):
		if self.is_zero():
			return self
		else:
			return self._create(self.x, -self.y)
	
	def __sub__(self, other):
		return self + -other
	
	
	def __mul__(self, n):
		if not isinstance(n, numbers.Integral):
			raise TypeError("Expected integer")
		if n < 0:
			return -self * -n
		result = self._create(None, None)
		temp = self
		while n != 0:
			if n & 1 != 0:
				result += temp
			temp = temp.double()
			n >>= 1
		return result
	
	
	def __eq__(self, other):
		if self.is_zero() or other.is_zero():
			return self.is_zero() and other.is_zero()
		else:
			return isinstance(other, AffineCurvePoint) and \
				(self.x, self.y, self.a, self.b, self.modulus) == (other.x, other.y, other.a, other.b, other.modulus)
	
	def __ne__(self, other):
		return not (self == other)
	
	
	def __str__(self):
		if self.is_zero():
			return "(Zero)"
		else:
			return "({}, {})".format(self.x, self.y)
	
	def __repr__(self):
		return "AffineCurvePoint(x={}, y={}, a={}, b={}, mod={})".format(self.x, self.y, self.a, self.b, self.modulus)



# ---- Elliptic curve points in projective coordinates ----

class ProjectiveCurvePoint(object):
	
	def __init__(self, x, y, z, a, b, mod):
		if x is None and y is None and z is None:
			pass
		elif isinstance(x, FieldInt) and isinstance(y, FieldInt) and isinstance(z, FieldInt):
			pass
		else:
			raise ValueError("Both coordinates must be FieldInt or None")
		
		if not isinstance(a, FieldInt) or not isinstance(b, FieldInt):
			raise TypeError("Expected FieldInt")
		if x is not None and (x.modulus != mod or y.modulus != mod or z.modulus != mod) or a.modulus != mod or b.modulus != mod:
			raise ValueError("Moduli must match")
		
		self.x = x
		self.y = y
		self.z = z
		self.a = a
		self.b = b
		self.modulus = mod
	
	
	def _create(self, x, y, z):
		return ProjectiveCurvePoint(x, y, z, self.a, self.b, self.modulus)
	
	
	def is_zero(self):
		return self.x is None
	
	def is_on_curve(self):
		return not self.is_zero() and \
			self.y * self.y * self.z == \
			self.x * self.x * self.x + self.a * self.x * self.z * self.z + self.b * self.z * self.z * self.z
	
	def to_affine_point(self):
		if self.is_zero():
			return AffineCurvePoint(None, None, self.a, self.b, self.modulus)
		else:
			div = self.z.reciprocal()
			return AffineCurvePoint(self.x * div, self.y * div, self.a, self.b, self.modulus)
	
	
	def __add__(self, other):
		if not isinstance(other, ProjectiveCurvePoint):
			raise TypeError("Expected ProjectiveCurvePoint")
		if (self.a, self.b, self.modulus) != (other.a, other.b, other.modulus):
			raise ValueError("Other point must have same parameters")
		
		if self.is_zero():
			return other
		elif other.is_zero():
			return self
		
		t0 = self.y * other.z
		t1 = other.y * self.z
		u0 = self.x * other.z
		u1 = other.x * self.z
		if u0 == u1:
			if t0 == t1:
				return self.double()
			else:
				return self._create(None, None, None)
		else:
			t = t0 - t1
			u = u0 - u1
			u2 = u * u
			v = self.z * other.z
			w = t * t * v - u2 * (u0 + u1)
			u3 = u * u2
			rx = u * w
			ry = t * (u0 * u2 - w) - t0 * u3
			rz = u3 * v
			return self._create(rx, ry, rz)
	
	
	def double(self):
		if self.is_zero() or self.y == 0:
			return self._create(None, None, None)
		else:
			two = FieldInt(2, self.modulus)
			t = self.x * self.x * FieldInt(3, self.modulus) + self.a * self.z * self.z
			u = self.y * self.z * two
			v = u * self.x * self.y * two
			w = t * t - v * two
			rx = u * w
			ry = t * (v - w) - u * u * self.y * self.y * two
			rz = u * u * u
			return self._create(rx, ry, rz)
	
	
	def __neg__(self):
		if self.is_zero():
			return self
		else:
			return self._create(self.x, -self.y, self.z)
	
	def __sub__(self, other):
		return self + -other
	
	
	def __mul__(self, n):
		if not isinstance(n, numbers.Integral):
			raise TypeError("Expected integer")
		if n < 0:
			return -self * -n
		result = self._create(None, None, None)
		temp = self
		while n != 0:
			if n & 1 != 0:
				result += temp
			temp = temp.double()
			n >>= 1
		return result
	
	
	def __eq__(self, other):
		if self.is_zero() or other.is_zero():
			return self.is_zero() and other.is_zero()
		else:
			return isinstance(other, ProjectiveCurvePoint) and \
				(self.x * other.z, self.y * other.z, self.a , self.b , self.modulus ) == \
				(other.x * self.z, other.y * self.z, other.a, other.b, other.modulus)
	
	def __ne__(self, other):
		return not (self == other)
	
	
	def __str__(self):
		if self.is_zero():
			return "(Zero)"
		else:
			return "({}, {}, {})".format(self.x, self.y, self.z)
	
	def __repr__(self):
		return "ProjectiveCurvePoint(x={}, y={}, z={}, a={}, b={}, mod={})".format(self.x, self.y, self.z, self.a, self.b, self.modulus)



# ---- Scalar numbers from a field ----

class FieldInt(object):
	"""A non-negative integer modulo a prime number."""
	
	# -- Instance management methods --
	
	# The modulus must be prime, which is not checked!
	def __init__(self, value, modulus):
		if not isinstance(value, numbers.Integral) or not isinstance(modulus, numbers.Integral):
			raise TypeError("Expected integers")
		if modulus <= 0:
			raise ValueError("Modulus must be positive")
		if not (0 <= value < modulus):
			raise ValueError("Value out of range")
		self.value = value
		self.modulus = modulus
	
	def _create(self, val):
		return FieldInt(val % self.modulus, self.modulus)
	
	def _check(self, other):
		if not isinstance(other, FieldInt):
			raise TypeError("Expected FieldInt")
		if self.modulus != other.modulus:
			raise ValueError("Other number must have same modulus")
	
	
	# -- Arithmetic methods --
	
	def __add__(self, other):
		self._check(other)
		return self._create(self.value + other.value)
	
	def __sub__(self, other):
		self._check(other)
		return self._create(self.value - other.value)
	
	def __neg__(self):
		return self._create(-self.value)
	
	def __mul__(self, other):
		self._check(other)
		return self._create(self.value * other.value)
	
	
	def reciprocal(self):
		if self.value == 0:
			raise ValueError("Division by zero")
		# Extended Euclidean algorithm
		x, y = self.modulus, self.value
		a, b = 0, 1
		while y != 0:
			a, b = b, a - x // y * b
			x, y = y, x % y
		if x == 1:
			return self._create(a)
		else:
			raise ValueError("Value and modulus not coprime")
	
	
	# -- Comparison methods --
	
	def __eq__(self, other):
		return isinstance(other, FieldInt) and (self.value, self.modulus) == (other.value, other.modulus)
	
	def __ne__(self, other):
		return not (self == other)
	
	
	# -- Miscellaneous methods --
	
	def __str__(self):
		return str(self.value)
	
	def __repr__(self):
		return "FieldInt(value={}, modulus={})".format(self.value, self.modulus)
