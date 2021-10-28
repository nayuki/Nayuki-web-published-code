# 
# Elliptic curve point addition in projective coordinates
# 
# Copyright (c) 2021 Project Nayuki. (MIT License)
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


# ---- Elliptic curve points in affine coordinates ----

class AffineCurvePoint:
	
	def __init__(self, xy, a, b, mod):
		if not isinstance(a, FieldInt) or not isinstance(b, FieldInt):
			raise TypeError("Expected FieldInt")
		if (xy is not None) and not (xy[0].modulus == xy[1].modulus == mod):
			raise ValueError("Moduli must match")
		if a.modulus != mod or b.modulus != mod:
			raise ValueError("Moduli must match")
		
		self.xy = xy
		self.a = a
		self.b = b
		self.modulus = mod
	
	
	def _create(self, xy):
		return AffineCurvePoint(xy, self.a, self.b, self.modulus)
	
	
	def is_zero(self):
		return self.xy is None
	
	def is_on_curve(self):
		if self.xy is None:
			return False
		x, y = self.xy
		return y * y == (x * x + self.a) * x + self.b
	
	def to_projective_point(self):
		if self.xy is None:
			return ProjectiveCurvePoint(None, self.a, self.b, self.modulus)
		else:
			return ProjectiveCurvePoint(self.xy + (FieldInt(1, self.modulus),), self.a, self.b, self.modulus)
	
	
	def __add__(self, other):
		if not isinstance(other, AffineCurvePoint):
			raise TypeError("Expected AffineCurvePoint")
		if (self.a, self.b, self.modulus) != (other.a, other.b, other.modulus):
			raise ValueError("Other point must have same parameters")
		
		if self.xy is None:
			return other
		elif other.xy is None:
			return self
		else:
			selfx , selfy  = self .xy
			otherx, othery = other.xy
			if selfx == otherx:
				if selfy == othery:
					return self.double()
				else:
					return self._create(None)
			else:
				s = (selfy - othery) / (selfx - otherx)
				rx = s * s - selfx - otherx
				ry = s * (selfx - rx) - selfy
				return self._create((rx, ry))
	
	
	def double(self):
		if (self.xy is None) or (self.xy[1].value == 0):
			return self._create(None)
		else:
			x, y = self.xy
			s = (x * x * FieldInt(3, self.modulus) + self.a) / (y * FieldInt(2, self.modulus))
			rx = s * s - x * FieldInt(2, self.modulus)
			ry = s * (x - rx) - y
			return self._create((rx, ry))
	
	
	def __neg__(self):
		if self.xy is None:
			return self
		else:
			x, y = self.xy
			return self._create((x, -y))
	
	def __sub__(self, other):
		return self + -other
	
	
	def __mul__(self, n):
		if not isinstance(n, int):
			raise TypeError("Expected integer")
		if n < 0:
			return -self * -n
		result = self._create(None)
		temp = self
		while n != 0:
			if n & 1 != 0:
				result += temp
			temp = temp.double()
			n >>= 1
		return result
	
	
	def __eq__(self, other):
		if not isinstance(other, AffineCurvePoint):
			return False
		elif (self.xy is None) or (other.xy is None):
			return (self.xy is None) and (other.xy is None)
		else:
			selfx , selfy  = self .xy
			otherx, othery = other.xy
			return (selfx, selfy, self.a, self.b, self.modulus) \
				== (otherx, othery, other.a, other.b, other.modulus)
	
	
	def __str__(self):
		if self.xy is None:
			return "(Zero)"
		else:
			x, y = self.xy
			return f"({x}, {y})"
	
	def __repr__(self):
		result = "AffineCurvePoint("
		if self.xy is None:
			result += "x=None, y=None"
		else:
			x, y = self.xy
			result += f"x={x}, y={y}"
		result += f", a={self.a}, b={self.b}, mod={self.modulus})"
		return result



# ---- Elliptic curve points in projective coordinates ----

class ProjectiveCurvePoint:
	
	def __init__(self, xyz, a, b, mod):
		if not isinstance(a, FieldInt) or not isinstance(b, FieldInt):
			raise TypeError("Expected FieldInt")
		if (xyz is not None) and not (xyz[0].modulus == xyz[1].modulus == xyz[2].modulus == mod):
			raise ValueError("Moduli must match")
		if a.modulus != mod or b.modulus != mod:
			raise ValueError("Moduli must match")
		
		self.xyz = xyz
		self.a = a
		self.b = b
		self.modulus = mod
	
	
	def _create(self, xyz):
		return ProjectiveCurvePoint(xyz, self.a, self.b, self.modulus)
	
	
	def is_zero(self):
		return self.xyz is None
	
	def is_on_curve(self):
		if self.xyz is None:
			return False
		else:
			x, y, z = self.xyz
			return y * y * z == \
				x * x * x + self.a * x * z * z + self.b * z * z * z
	
	def to_affine_point(self):
		if self.xyz is None:
			return AffineCurvePoint(None, self.a, self.b, self.modulus)
		else:
			x, y, z = self.xyz
			return AffineCurvePoint((x / z, y / z), self.a, self.b, self.modulus)
	
	
	def __add__(self, other):
		if not isinstance(other, ProjectiveCurvePoint):
			raise TypeError("Expected ProjectiveCurvePoint")
		if (self.a, self.b, self.modulus) != (other.a, other.b, other.modulus):
			raise ValueError("Other point must have same parameters")
		
		if self.xyz is None:
			return other
		elif other.xyz is None:
			return self
		
		selfx , selfy , selfz  = self .xyz
		otherx, othery, otherz = other.xyz
		
		t0 = selfy * otherz
		t1 = othery * selfz
		u0 = selfx * otherz
		u1 = otherx * selfz
		if u0 == u1:
			if t0 == t1:
				return self.double()
			else:
				return self._create(None)
		else:
			t = t0 - t1
			u = u0 - u1
			u2 = u * u
			v = selfz * otherz
			w = t * t * v - u2 * (u0 + u1)
			u3 = u * u2
			rx = u * w
			ry = t * (u0 * u2 - w) - t0 * u3
			rz = u3 * v
			return self._create((rx, ry, rz))
	
	
	def double(self):
		if (self.xyz is None) or (self.xyz[1].value == 0):
			return self._create(None)
		else:
			x, y, z = self.xyz
			two = FieldInt(2, self.modulus)
			t = x * x * FieldInt(3, self.modulus) + self.a * z * z
			u = y * z * two
			v = u * x * y * two
			w = t * t - v * two
			rx = u * w
			ry = t * (v - w) - u * u * y * y * two
			rz = u * u * u
			return self._create((rx, ry, rz))
	
	
	def __neg__(self):
		if self.xyz is None:
			return self
		else:
			x, y, z = self.xyz
			return self._create((x, -y, z))
	
	def __sub__(self, other):
		return self + -other
	
	
	def __mul__(self, n):
		if not isinstance(n, int):
			raise TypeError("Expected integer")
		if n < 0:
			return -self * -n
		result = self._create(None)
		temp = self
		while n != 0:
			if n & 1 != 0:
				result += temp
			temp = temp.double()
			n >>= 1
		return result
	
	
	def __eq__(self, other):
		if not isinstance(other, ProjectiveCurvePoint):
			return False
		if (self.xyz is None) or (other.xyz is None):
			return (self.xyz is None) and (other.xyz is None)
		else:
			selfx , selfy , selfz  = self .xyz
			otherx, othery, otherz = other.xyz
			return (selfx * otherz, selfy * otherz, self.a, self.b, self.modulus) \
				== (otherx * selfz, othery * selfz, other.a, other.b, other.modulus)
	
	
	def __str__(self):
		if self.xyz is None:
			return "(Zero)"
		else:
			x, y, z = self.xyz
			return f"({x}, {y}, {z})"
	
	def __repr__(self):
		result = "ProjectiveCurvePoint("
		if self.xyz is None:
			result += "x=None, y=None, z=None"
		else:
			x, y, z = self.xyz
			result += f"x={x}, y={y}, z={z}"
		result += f", a={self.a}, b={self.b}, mod={self.modulus})"
		return result



# ---- Scalar numbers from a field ----

class FieldInt:
	"""A non-negative integer modulo a prime number."""
	
	# -- Instance management methods --
	
	# The modulus must be prime, which is not checked!
	def __init__(self, value, modulus):
		if not isinstance(value, int) or not isinstance(modulus, int):
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
	
	def __truediv__(self, other):
		self._check(other)
		return self._create(self.value * other.reciprocal().value)
	
	
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
	
	
	# -- Miscellaneous methods --
	
	def __eq__(self, other):
		return isinstance(other, FieldInt) and (self.value, self.modulus) == (other.value, other.modulus)
	
	def __str__(self):
		return str(self.value)
	
	def __repr__(self):
		return f"FieldInt(value={self.value}, modulus={self.modulus})"
