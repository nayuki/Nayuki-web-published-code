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

from __future__ import annotations
from typing import Optional, Tuple


# ---- Elliptic curve points in affine coordinates ----

class AffineCurvePoint:
	
	xy: Optional[Tuple[FieldInt,FieldInt]]
	a: FieldInt
	b: FieldInt
	modulus: int
	
	
	def __init__(self, xy: Optional[Tuple[FieldInt,FieldInt]], a: FieldInt, b: FieldInt, mod: int) -> None:
		if (xy is not None) and not (xy[0].modulus == xy[1].modulus == mod):
			raise ValueError("Moduli must match")
		if not (a.modulus == b.modulus == mod):
			raise ValueError("Moduli must match")
		
		self.xy = xy
		self.a = a
		self.b = b
		self.modulus = mod
	
	
	def _create(self, xy: Optional[Tuple[FieldInt,FieldInt]]) -> AffineCurvePoint:
		return AffineCurvePoint(xy, self.a, self.b, self.modulus)
	
	
	def is_zero(self) -> bool:
		return self.xy is None
	
	def is_on_curve(self) -> bool:
		if self.xy is None:
			return False
		x, y = self.xy
		return y * y == (x * x + self.a) * x + self.b
	
	def to_projective_point(self) -> ProjectiveCurvePoint:
		if self.xy is None:
			return ProjectiveCurvePoint(None, self.a, self.b, self.modulus)
		else:
			return ProjectiveCurvePoint(self.xy + (FieldInt(1, self.modulus),), self.a, self.b, self.modulus)
	
	
	def __add__(self, other: AffineCurvePoint) -> AffineCurvePoint:
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
				s: FieldInt = (selfy - othery) / (selfx - otherx)
				rx: FieldInt = s * s - selfx - otherx
				ry: FieldInt = s * (selfx - rx) - selfy
				return self._create((rx, ry))
	
	
	def double(self) -> AffineCurvePoint:
		if (self.xy is None) or (self.xy[1].value == 0):
			return self._create(None)
		else:
			x, y = self.xy
			s: FieldInt = (x * x * FieldInt(3, self.modulus) + self.a) / (y * FieldInt(2, self.modulus))
			rx: FieldInt = s * s - x * FieldInt(2, self.modulus)
			ry: FieldInt = s * (x - rx) - y
			return self._create((rx, ry))
	
	
	def __neg__(self) -> AffineCurvePoint:
		if self.xy is None:
			return self
		else:
			x, y = self.xy
			return self._create((x, -y))
	
	def __sub__(self, other: AffineCurvePoint) -> AffineCurvePoint:
		return self + -other
	
	
	def __mul__(self, n: int) -> AffineCurvePoint:
		if n < 0:
			return -self * -n
		result: AffineCurvePoint = self._create(None)
		temp: AffineCurvePoint = self
		while n != 0:
			if n & 1 != 0:
				result += temp
			temp = temp.double()
			n >>= 1
		return result
	
	
	def __eq__(self, other: object) -> bool:
		if not isinstance(other, AffineCurvePoint):
			return False
		elif (self.xy is None) or (other.xy is None):
			return (self.xy is None) and (other.xy is None)
		else:
			selfx , selfy  = self .xy
			otherx, othery = other.xy
			return (selfx, selfy, self.a, self.b, self.modulus) \
				== (otherx, othery, other.a, other.b, other.modulus)
	
	
	def __str__(self) -> str:
		if self.xy is None:
			return "(Zero)"
		else:
			x, y = self.xy
			return f"({x}, {y})"
	
	def __repr__(self) -> str:
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
	
	xyz: Optional[Tuple[FieldInt,FieldInt,FieldInt]]
	a: FieldInt
	b: FieldInt
	modulus: int
	
	
	def __init__(self, xyz: Optional[Tuple[FieldInt,FieldInt,FieldInt]], a: FieldInt, b: FieldInt, mod: int) -> None:
		if (xyz is not None) and not (xyz[0].modulus == xyz[1].modulus == xyz[2].modulus == mod):
			raise ValueError("Moduli must match")
		if not (a.modulus == b.modulus == mod):
			raise ValueError("Moduli must match")
		
		self.xyz = xyz
		self.a = a
		self.b = b
		self.modulus = mod
	
	
	def _create(self, xyz: Optional[Tuple[FieldInt,FieldInt,FieldInt]]) -> ProjectiveCurvePoint:
		return ProjectiveCurvePoint(xyz, self.a, self.b, self.modulus)
	
	
	def is_zero(self) -> bool:
		return self.xyz is None
	
	def is_on_curve(self) -> bool:
		if self.xyz is None:
			return False
		else:
			x, y, z = self.xyz
			return y * y * z == \
				x * x * x + self.a * x * z * z + self.b * z * z * z
	
	def to_affine_point(self) -> AffineCurvePoint:
		if self.xyz is None:
			return AffineCurvePoint(None, self.a, self.b, self.modulus)
		else:
			x, y, z = self.xyz
			return AffineCurvePoint((x / z, y / z), self.a, self.b, self.modulus)
	
	
	def __add__(self, other: ProjectiveCurvePoint) -> ProjectiveCurvePoint:
		if (self.a, self.b, self.modulus) != (other.a, other.b, other.modulus):
			raise ValueError("Other point must have same parameters")
		
		if self.xyz is None:
			return other
		elif other.xyz is None:
			return self
		
		selfx , selfy , selfz  = self .xyz
		otherx, othery, otherz = other.xyz
		
		t0: FieldInt = selfy * otherz
		t1: FieldInt = othery * selfz
		u0: FieldInt = selfx * otherz
		u1: FieldInt = otherx * selfz
		if u0 == u1:
			if t0 == t1:
				return self.double()
			else:
				return self._create(None)
		else:
			t: FieldInt = t0 - t1
			u: FieldInt = u0 - u1
			u2: FieldInt = u * u
			v: FieldInt = selfz * otherz
			w: FieldInt = t * t * v - u2 * (u0 + u1)
			u3: FieldInt = u * u2
			rx: FieldInt = u * w
			ry: FieldInt = t * (u0 * u2 - w) - t0 * u3
			rz: FieldInt = u3 * v
			return self._create((rx, ry, rz))
	
	
	def double(self) -> ProjectiveCurvePoint:
		if (self.xyz is None) or (self.xyz[1].value == 0):
			return self._create(None)
		else:
			x, y, z = self.xyz
			two: FieldInt = FieldInt(2, self.modulus)
			t: FieldInt = x * x * FieldInt(3, self.modulus) + self.a * z * z
			u: FieldInt = y * z * two
			v: FieldInt = u * x * y * two
			w: FieldInt = t * t - v * two
			rx: FieldInt = u * w
			ry: FieldInt = t * (v - w) - u * u * y * y * two
			rz: FieldInt = u * u * u
			return self._create((rx, ry, rz))
	
	
	def __neg__(self) -> ProjectiveCurvePoint:
		if self.xyz is None:
			return self
		else:
			x, y, z = self.xyz
			return self._create((x, -y, z))
	
	def __sub__(self, other: ProjectiveCurvePoint) -> ProjectiveCurvePoint:
		return self + -other
	
	
	def __mul__(self, n: int) -> ProjectiveCurvePoint:
		if n < 0:
			return -self * -n
		result: ProjectiveCurvePoint = self._create(None)
		temp: ProjectiveCurvePoint = self
		while n != 0:
			if n & 1 != 0:
				result += temp
			temp = temp.double()
			n >>= 1
		return result
	
	
	def __eq__(self, other: object) -> bool:
		if not isinstance(other, ProjectiveCurvePoint):
			return False
		if (self.xyz is None) or (other.xyz is None):
			return (self.xyz is None) and (other.xyz is None)
		else:
			selfx , selfy , selfz  = self .xyz
			otherx, othery, otherz = other.xyz
			return (selfx * otherz, selfy * otherz, self.a, self.b, self.modulus) \
				== (otherx * selfz, othery * selfz, other.a, other.b, other.modulus)
	
	
	def __str__(self) -> str:
		if self.xyz is None:
			return "(Zero)"
		else:
			x, y, z = self.xyz
			return f"({x}, {y}, {z})"
	
	def __repr__(self) -> str:
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
	
	value: int
	modulus: int
	
	
	# -- Instance management methods --
	
	# The modulus must be prime, which is not checked!
	def __init__(self, value: int, modulus: int) -> None:
		if modulus <= 0:
			raise ValueError("Modulus must be positive")
		if not (0 <= value < modulus):
			raise ValueError("Value out of range")
		self.value = value
		self.modulus = modulus
	
	def _create(self, val: int) -> FieldInt:
		return FieldInt(val % self.modulus, self.modulus)
	
	def _check(self, other: FieldInt) -> None:
		if self.modulus != other.modulus:
			raise ValueError("Other number must have same modulus")
	
	
	# -- Arithmetic methods --
	
	def __add__(self, other: FieldInt) -> FieldInt:
		self._check(other)
		return self._create(self.value + other.value)
	
	def __sub__(self, other: FieldInt) -> FieldInt:
		self._check(other)
		return self._create(self.value - other.value)
	
	def __neg__(self) -> FieldInt:
		return self._create(-self.value)
	
	def __mul__(self, other: FieldInt) -> FieldInt:
		self._check(other)
		return self._create(self.value * other.value)
	
	def __truediv__(self, other: FieldInt) -> FieldInt:
		self._check(other)
		return self._create(self.value * other.reciprocal().value)
	
	
	def reciprocal(self) -> FieldInt:
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
	
	def __eq__(self, other: object) -> bool:
		return isinstance(other, FieldInt) and (self.value, self.modulus) == (other.value, other.modulus)
	
	def __str__(self) -> str:
		return str(self.value)
	
	def __repr__(self) -> str:
		return f"FieldInt(value={self.value}, modulus={self.modulus})"
