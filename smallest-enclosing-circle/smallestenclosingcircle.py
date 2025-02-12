# 
# Smallest enclosing circle - Library (Python)
# 
# Copyright (c) 2025 Project Nayuki
# https://www.nayuki.io/page/smallest-enclosing-circle
# 
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Lesser General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Lesser General Public License for more details.
# 
# You should have received a copy of the GNU Lesser General Public License
# along with this program (see COPYING.txt and COPYING.LESSER.txt).
# If not, see <http://www.gnu.org/licenses/>.
# 

import math, random
from typing import Sequence


# Data conventions: A point is a pair of floats (x, y). A circle is a triple of floats (center x, center y, radius).

# Returns the smallest circle that encloses all the given points. Runs in expected O(n) time, randomized.
# Input: A sequence of pairs of floats or ints, e.g. [(0,5), (3.1,-2.7)].
# Output: A triple of floats representing a circle.
# Note: If 0 points are given, None is returned. If 1 point is given, a circle of radius 0 is returned.
# 
# Initially: No boundary points known
def make_circle(points: Sequence[tuple[float,float]]) -> tuple[float,float,float]|None:
	# Convert to float and randomize order
	shuffled: list[tuple[float,float]] = [(float(x), float(y)) for (x, y) in points]
	random.shuffle(shuffled)
	
	# Progressively add points to circle or recompute circle
	c: tuple[float,float,float]|None = None
	for (i, p) in enumerate(shuffled):
		if c is None or not is_in_circle(c, p):
			c = _make_circle_one_point(shuffled[ : i + 1], p)
	return c


# One boundary point known
def _make_circle_one_point(points: Sequence[tuple[float,float]], p: tuple[float,float]) -> tuple[float,float,float]:
	c: tuple[float,float,float] = (p[0], p[1], 0.0)
	for (i, q) in enumerate(points):
		if not is_in_circle(c, q):
			if c[2] == 0.0:
				c = make_diameter(p, q)
			else:
				c = _make_circle_two_points(points[ : i + 1], p, q)
	return c


# Two boundary points known
def _make_circle_two_points(points: Sequence[tuple[float,float]], p: tuple[float,float], q: tuple[float,float]) -> tuple[float,float,float]:
	circ: tuple[float,float,float] = make_diameter(p, q)
	left : tuple[float,float,float]|None = None
	right: tuple[float,float,float]|None = None
	px, py = p
	qx, qy = q
	
	# For each point not in the two-point circle
	for r in points:
		if is_in_circle(circ, r):
			continue
		
		# Form a circumcircle and classify it on left or right side
		cross: float = _cross_product(px, py, qx, qy, r[0], r[1])
		c: tuple[float,float,float]|None = make_circumcircle(p, q, r)
		if c is None:
			continue
		elif cross > 0.0 and (left is None or _cross_product(px, py, qx, qy, c[0], c[1]) > _cross_product(px, py, qx, qy, left[0], left[1])):
			left = c
		elif cross < 0.0 and (right is None or _cross_product(px, py, qx, qy, c[0], c[1]) < _cross_product(px, py, qx, qy, right[0], right[1])):
			right = c
	
	# Select which circle to return
	if left is None and right is None:
		return circ
	elif left is None and right is not None:
		return right
	elif left is not None and right is None:
		return left
	elif left is not None and right is not None:
		return left if (left[2] <= right[2]) else right
	else:
		raise AssertionError("Unreachable")


def make_diameter(a: tuple[float,float], b: tuple[float,float]) -> tuple[float,float,float]:
	cx: float = (a[0] + b[0]) / 2
	cy: float = (a[1] + b[1]) / 2
	r0: float = math.hypot(cx - a[0], cy - a[1])
	r1: float = math.hypot(cx - b[0], cy - b[1])
	return (cx, cy, max(r0, r1))


def make_circumcircle(a: tuple[float,float], b: tuple[float,float], c: tuple[float,float]) -> tuple[float,float,float]|None:
	# Mathematical algorithm from Wikipedia: Circumscribed circle
	ox: float = (min(a[0], b[0], c[0]) + max(a[0], b[0], c[0])) / 2
	oy: float = (min(a[1], b[1], c[1]) + max(a[1], b[1], c[1])) / 2
	ax: float = a[0] - ox;  ay = a[1] - oy
	bx: float = b[0] - ox;  by = b[1] - oy
	cx: float = c[0] - ox;  cy = c[1] - oy
	d: float = (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by)) * 2.0
	if d == 0.0:
		return None
	x: float = ox + ((ax*ax + ay*ay) * (by - cy) + (bx*bx + by*by) * (cy - ay) + (cx*cx + cy*cy) * (ay - by)) / d
	y: float = oy + ((ax*ax + ay*ay) * (cx - bx) + (bx*bx + by*by) * (ax - cx) + (cx*cx + cy*cy) * (bx - ax)) / d
	ra: float = math.hypot(x - a[0], y - a[1])
	rb: float = math.hypot(x - b[0], y - b[1])
	rc: float = math.hypot(x - c[0], y - c[1])
	return (x, y, max(ra, rb, rc))


_MULTIPLICATIVE_EPSILON: float = 1 + 1e-14

def is_in_circle(c: tuple[float,float,float], p: tuple[float,float]) -> bool:
	return c is not None and math.hypot(p[0] - c[0], p[1] - c[1]) <= c[2] * _MULTIPLICATIVE_EPSILON


# Returns twice the signed area of the triangle defined by (x0, y0), (x1, y1), (x2, y2).
def _cross_product(x0: float, y0: float, x1: float, y1: float, x2: float, y2: float) -> float:
	return (x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0)
