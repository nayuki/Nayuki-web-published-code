# 
# Convex hull algorithm - Test suite (Python)
# 
# Copyright (c) 2021 Project Nayuki
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
from typing import List, Sequence, Tuple
import convexhull


class ConvexHullTest(unittest.TestCase):
	
	# ---- Fixed test vectors ----
	
	def test_empty(self) -> None:
		points: List[Tuple[float,float]] = []
		actual: List[Tuple[float,float]] = convexhull.make_hull(points)
		expect: List[Tuple[float,float]] = []
		self.assertEqual(expect, actual)
	
	
	def test_one(self) -> None:
		points: List[Tuple[float,float]] = [(3, 1)]
		actual: List[Tuple[float,float]] = convexhull.make_hull(points)
		expect: List[Tuple[float,float]] = points
		self.assertEqual(expect, actual)
	
	
	def test_two_duplicate(self) -> None:
		points: List[Tuple[float,float]] = [(0, 0), (0, 0)]
		actual: List[Tuple[float,float]] = convexhull.make_hull(points)
		expect: List[Tuple[float,float]] = [(0, 0)]
		self.assertEqual(expect, actual)
	
	
	def test_two_horizontal0(self) -> None:
		points: List[Tuple[float,float]] = [(2, 0), (5, 0)]
		actual: List[Tuple[float,float]] = convexhull.make_hull(points)
		expect: List[Tuple[float,float]] = points
		self.assertEqual(expect, actual)
	
	
	def test_two_horizontal1(self) -> None:
		points: List[Tuple[float,float]] = [(-6, -3), (-8, -3)]
		actual: List[Tuple[float,float]] = convexhull.make_hull(points)
		expect: List[Tuple[float,float]] = [(-8, -3), (-6, -3)]
		self.assertEqual(expect, actual)
	
	
	def test_two_vertical0(self) -> None:
		points: List[Tuple[float,float]] = [(1, -4), (1, 4)]
		actual: List[Tuple[float,float]] = convexhull.make_hull(points)
		expect: List[Tuple[float,float]] = points
		self.assertEqual(expect, actual)
	
	
	def test_two_vertical1(self) -> None:
		points: List[Tuple[float,float]] = [(-1, 2), (-1, -3)]
		actual: List[Tuple[float,float]] = convexhull.make_hull(points)
		expect: List[Tuple[float,float]] = [(-1, -3), (-1, 2)]
		self.assertEqual(expect, actual)
	
	
	def test_two_diagonal0(self) -> None:
		points: List[Tuple[float,float]] = [(-2, -3), (2, 0)]
		actual: List[Tuple[float,float]] = convexhull.make_hull(points)
		expect: List[Tuple[float,float]] = points
		self.assertEqual(expect, actual)
	
	
	def test_two_diagonal1(self) -> None:
		points: List[Tuple[float,float]] = [(-2, 3), (2, 0)]
		actual: List[Tuple[float,float]] = convexhull.make_hull(points)
		expect: List[Tuple[float,float]] = points
		self.assertEqual(expect, actual)
	
	
	def test_rectangle(self) -> None:
		points: List[Tuple[float,float]] = [(-3, 2), (1, 2), (1, -4), (-3, -4)]
		actual: List[Tuple[float,float]] = convexhull.make_hull(points)
		expect: List[Tuple[float,float]] = [(-3, -4), (-3, 2), (1, 2), (1, -4)]
		self.assertEqual(expect, actual)
	
	
	
	# ---- Randomized testing ----
	
	def test_horizontal_randomly(self) -> None:
		TRIALS: int = 10000
		for _ in range(TRIALS):
			numpoints: int = random.randrange(30) + 1
			if random.random() < 0.5:
				y: float = random.gauss(0, 1)
				points: List[Tuple[float,float]] = [(random.gauss(0, 1), y) for _ in range(numpoints)]
			else:
				y = random.randrange(20) - 10
				points = [(random.randrange(30), y) for _ in range(numpoints)]
			actual: List[Tuple[float,float]] = convexhull.make_hull(points)
			expected: List[Tuple[float,float]] = [min(points)]
			if max(points) != min(points):
				expected.append(max(points))
			self.assertEqual(actual, expected)
	
	
	def test_vertical_randomly(self) -> None:
		TRIALS: int = 10000
		for _ in range(TRIALS):
			numpoints: int = random.randrange(30) + 1
			if random.random() < 0.5:
				x: float = random.gauss(0, 1)
				points: List[Tuple[float,float]] = [(x, random.gauss(0, 1)) for _ in range(numpoints)]
			else:
				x = random.randrange(20) - 10
				points = [(x, random.randrange(30)) for _ in range(numpoints)]
			actual: List[Tuple[float,float]] = convexhull.make_hull(points)
			expected: List[Tuple[float,float]] = [min(points)]
			if max(points) != min(points):
				expected.append(max(points))
			self.assertEqual(actual, expected)
	
	
	def test_vs_naive_randomly(self) -> None:
		TRIALS: int = 10000
		for _ in range(TRIALS):
			numpoints: int = random.randrange(100)
			if random.random() < 0.5:
				points: List[Tuple[float,float]] = [(random.gauss(0, 1), random.gauss(0, 1)) for _ in range(numpoints)]
			else:
				points = [(random.randrange(10), random.randrange(10)) for _ in range(numpoints)]
			actual: List[Tuple[float,float]] = convexhull.make_hull(points)
			expected: List[Tuple[float,float]] = ConvexHullTest.make_hull_naive(points)
			self.assertEqual(actual, expected)
	
	
	def test_hull_properties_randomly(self) -> None:
		TRIALS: int = 10000
		for _ in range(TRIALS):
			
			# Generate random points
			numpoints: int = random.randrange(100)
			if random.random() < 0.5:
				points: List[Tuple[float,float]] = [(random.gauss(0, 1), random.gauss(0, 1)) for _ in range(numpoints)]
			else:
				points = [(random.randrange(10), random.randrange(10)) for _ in range(numpoints)]
			
			# Compute hull and check properties
			hull: List[Tuple[float,float]] = convexhull.make_hull(points)
			self.assertTrue(ConvexHullTest.is_polygon_convex(hull))
			for p in points:
				self.assertTrue(ConvexHullTest.is_point_in_convex_polygon(hull, p))
			
			# Add duplicate points and check new hull
			if len(points) > 0:
				dupe: int = random.randrange(10) + 1
				for _ in range(dupe):
					points.append(points[random.randrange(len(points))])
				nexthull: List[Tuple[float,float]] = convexhull.make_hull(points)
				self.assertEqual(hull, nexthull)
	
	
	@staticmethod
	def make_hull_naive(points: Sequence[Tuple[float,float]]) -> List[Tuple[float,float]]:
		if len(points) <= 1:
			return list(points)
		
		# Jarvis march / gift wrapping algorithm
		result: List[Tuple[float,float]] = []
		point: Tuple[float,float] = min(points)
		while True:
			result.append(point)
			next: Tuple[float,float] = points[0]
			for p in points:
				ax: float = next[0] - point[0]
				ay: float = next[1] - point[1]
				bx: float = p[0] - point[0]
				by: float = p[1] - point[1]
				cross: float = ax * by - ay * bx
				if cross > 0 or (cross == 0 and bx * bx + by * by > ax * ax + ay * ay):
					next = p
			point = next
			if point == result[0]:
				break
		return result
	
	
	@staticmethod
	def is_polygon_convex(points: Sequence[Tuple[float,float]]) -> bool:
		signum: int = 0
		for i in range(len(points) - 2):
			px, py = points[i + 0]
			qx, qy = points[i + 1]
			rx, ry = points[i + 2]
			sign: int = ConvexHullTest.signum((qx - px) * (ry - qy) - (qy - py) * (rx - qx))
			if sign == 0:
				continue
			elif signum == 0:
				signum = sign
			elif sign != signum:
				return False
		return True
	
	
	@staticmethod
	def is_point_in_convex_polygon(polygon: Sequence[Tuple[float,float]], point: Tuple[float,float]) -> bool:
		signum: int = 0
		for (i, (px, py)) in enumerate(polygon):
			qx, qy = polygon[(i + 1) % len(polygon)]
			sign: int = ConvexHullTest.signum((qx - px) * (point[1] - qy) - (qy - py) * (point[0] - qx))
			if sign == 0:
				continue
			elif signum == 0:
				signum = sign
			elif sign != signum:
				return False
		return True
	
	
	@staticmethod
	def signum(x: float) -> int:
		if x > 0:
			return +1
		elif x < 0:
			return -1
		else:
			return 0



if __name__ == "__main__":
	unittest.main()
