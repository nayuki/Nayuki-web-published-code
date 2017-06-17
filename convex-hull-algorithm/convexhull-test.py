# 
# Convex hull algorithm - Test suite (Python)
# 
# Copyright (c) 2017 Project Nayuki
# https://www.nayuki.io/page/convex-hull-algorithm
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

import random, unittest
import convexhull


class ConvexHullTest(unittest.TestCase):
	
	# ---- Fixed test vectors ----
	
	def test_empty(self):
		points = []
		actual = convexhull.make_hull(points)
		expect = []
		self.assertEqual(expect, actual)
	
	
	def test_one(self):
		points = [(3, 1)]
		actual = convexhull.make_hull(points)
		expect = points
		self.assertEqual(expect, actual)
	
	
	def test_two_duplicate(self):
		points = [(0, 0), (0, 0)]
		actual = convexhull.make_hull(points)
		expect = [(0, 0)]
		self.assertEqual(expect, actual)
	
	
	def test_two_horizontal0(self):
		points = [(2, 0), (5, 0)]
		actual = convexhull.make_hull(points)
		expect = points
		self.assertEqual(expect, actual)
	
	
	def test_two_horizontal1(self):
		points = [(-6, -3), (-8, -3)]
		actual = convexhull.make_hull(points)
		expect = [(-8, -3), (-6, -3)]
		self.assertEqual(expect, actual)
	
	
	def test_two_vertical0(self):
		points = [(1, -4), (1, 4)]
		actual = convexhull.make_hull(points)
		expect = [(1, 4), (1, -4)]
		self.assertEqual(expect, actual)
	
	
	def test_two_vertical1(self):
		points = [(-1, 2), (-1, -3)]
		actual = convexhull.make_hull(points)
		expect = points
		self.assertEqual(expect, actual)
	
	
	def test_two_diagonal0(self):
		points = [(-2, -3), (2, 0)]
		actual = convexhull.make_hull(points)
		expect = points
		self.assertEqual(expect, actual)
	
	
	def test_two_diagonal1(self):
		points = [(-2, 3), (2, 0)]
		actual = convexhull.make_hull(points)
		expect = points
		self.assertEqual(expect, actual)
	
	
	def test_rectangle(self):
		points = [(-3, -4), (-3, 2), (1, 2), (1, -4)]
		actual = convexhull.make_hull(points)
		expect = [(-3, 2), (1, 2), (1, -4), (-3, -4)]
		self.assertEqual(expect, actual)
	
	
	
	# ---- Randomized testing ----
	
	def test_vs_naive_randomly(self):
		TRIALS = 10000
		for _ in range(TRIALS):
			numpoints = random.randrange(100)
			if random.random() < 0.5:
				points = [(random.gauss(0, 1), random.gauss(0, 1)) for _ in range(numpoints)]
			else:
				points = [(random.randrange(10), random.randrange(10)) for _ in range(numpoints)]
			actual = convexhull.make_hull(points)
			expected = ConvexHullTest.make_hull_naive(points)
			self.assertEqual(actual, expected)
	
	
	def test_hull_properties_randomly(self):
		TRIALS = 10000
		for _ in range(TRIALS):
			
			# Generate random points
			numpoints = random.randrange(100)
			if random.random() < 0.5:
				points = [(random.gauss(0, 1), random.gauss(0, 1)) for _ in range(numpoints)]
			else:
				points = [(random.randrange(10), random.randrange(10)) for _ in range(numpoints)]
			
			# Compute hull and check properties
			hull = convexhull.make_hull(points)
			self.assertTrue(ConvexHullTest.is_polygon_convex(hull))
			for p in points:
				self.assertTrue(ConvexHullTest.is_point_in_convex_polygon(hull, p))
			
			# Add duplicate points and check new hull
			if len(points) > 0:
				dupe = random.randrange(10) + 1
				for _ in range(dupe):
					points.append(points[random.randrange(len(points))])
				nexthull = convexhull.make_hull(points)
				self.assertEqual(hull, nexthull)
	
	
	@staticmethod
	def make_hull_naive(points):
		if len(points) <= 1:
			return list(points)
		result = []
		point = None
		for p in points:
			if point is None or p[0] < point[0] or p[0] == point[0] and p[1] > point[1]:
				point = p
		
		# Jarvis march / gift wrapping algorithm
		while True:
			result.append(point)
			next = points[0]
			for p in points:
				accept = next == point
				if not accept:
					ax = next[0] - point[0]
					ay = next[1] - point[1]
					bx = p[0] - point[0]
					by = p[1] - point[1]
					cross = ax * by - ay * bx
					accept = cross > 0 or (cross == 0 and bx * bx + by * by > ax * ax + ay * ay)
				if accept:
					next = p
			point = next
			if point == result[0]:
				break
		return result
	
	
	@staticmethod
	def is_polygon_convex(points):
		signum = 0
		for i in range(len(points) - 2):
			px, py = points[i + 0]
			qx, qy = points[i + 1]
			rx, ry = points[i + 2]
			sign = ConvexHullTest.signum((qx - px) * (ry - qy) - (qy - py) * (rx - qx))
			if sign == 0:
				continue
			elif signum == 0:
				signum = sign
			elif sign != signum:
				return False
		return True
	
	
	@staticmethod
	def is_point_in_convex_polygon(polygon, point):
		signum = 0
		for (i, (px, py)) in enumerate(polygon):
			qx, qy = polygon[(i + 1) % len(polygon)]
			sign = ConvexHullTest.signum((qx - px) * (point[1] - qy) - (qy - py) * (point[0] - qx))
			if sign == 0:
				continue
			elif signum == 0:
				signum = sign
			elif sign != signum:
				return False
		return True
	
	
	@staticmethod
	def signum(x):
		if x > 0:
			return +1
		elif x < 0:
			return -1
		else:
			return 0



if __name__ == "__main__":
	unittest.main()
