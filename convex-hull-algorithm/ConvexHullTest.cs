/* 
 * Convex hull algorithm - Test suite (C#)
 * 
 * Copyright (c) 2017 Project Nayuki
 * https://www.nayuki.io/page/convex-hull-algorithm
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program (see COPYING.txt and COPYING.LESSER.txt).
 * If not, see <http://www.gnu.org/licenses/>.
 */

using System;
using System.Collections.Generic;
using System.Linq;


public sealed class ConvexHullTest {
	
	public static void Main(string[] args) {
		TestEmpty();
		TestOne();
		TestTwoDuplicate();
		TestTwoHorizontal0();
		TestTwoHorizontal1();
		TestTwoVertical0();
		TestTwoVertical1();
		TestTwoDiagonal0();
		TestTwoDiagonal1();
		TestRectangle();
		TestHorizontalRandomly();
		TestVerticalRandomly();
		TestVsNaiveRandomly();
		TestHullPropertiesRandomly();
	}
	
	
	/*---- Fixed test vectors ----*/
	
	private static void TestEmpty() {
		IList<Point> points = new List<Point>();
		IList<Point> actual = ConvexHull.MakeHull(points);
		IList<Point> expect = new List<Point>();
		AssertEquals(expect, actual);
	}
	
	
	private static void TestOne() {
		IList<Point> points = new List<Point>{new Point(3, 1)};
		IList<Point> actual = ConvexHull.MakeHull(points);
		IList<Point> expect = points;
		AssertEquals(expect, actual);
	}
	
	
	private static void TestTwoDuplicate() {
		IList<Point> points = new List<Point>{new Point(0, 0), new Point(0, 0)};
		IList<Point> actual = ConvexHull.MakeHull(points);
		IList<Point> expect = new List<Point>{new Point(0, 0)};
		AssertEquals(expect, actual);
	}
	
	
	private static void TestTwoHorizontal0() {
		IList<Point> points = new List<Point>{new Point(2, 0), new Point(5, 0)};
		IList<Point> actual = ConvexHull.MakeHull(points);
		IList<Point> expect = points;
		AssertEquals(expect, actual);
	}
	
	
	private static void TestTwoHorizontal1() {
		IList<Point> points = new List<Point>{new Point(-6, -3), new Point(-8, -3)};
		IList<Point> actual = ConvexHull.MakeHull(points);
		IList<Point> expect = new List<Point>{new Point(-8, -3), new Point(-6, -3)};
		AssertEquals(expect, actual);
	}
	
	
	private static void TestTwoVertical0() {
		IList<Point> points = new List<Point>{new Point(1, -4), new Point(1, 4)};
		IList<Point> actual = ConvexHull.MakeHull(points);
		IList<Point> expect = points;
		AssertEquals(expect, actual);
	}
	
	
	private static void TestTwoVertical1() {
		IList<Point> points = new List<Point>{new Point(-1, 2), new Point(-1, -3)};
		IList<Point> actual = ConvexHull.MakeHull(points);
		IList<Point> expect = new List<Point>{new Point(-1, -3), new Point(-1, 2)};
		AssertEquals(expect, actual);
	}
	
	
	private static void TestTwoDiagonal0() {
		IList<Point> points = new List<Point>{new Point(-2, -3), new Point(2, 0)};
		IList<Point> actual = ConvexHull.MakeHull(points);
		IList<Point> expect = points;
		AssertEquals(expect, actual);
	}
	
	
	private static void TestTwoDiagonal1() {
		IList<Point> points = new List<Point>{new Point(-2, 3), new Point(2, 0)};
		IList<Point> actual = ConvexHull.MakeHull(points);
		IList<Point> expect = points;
		AssertEquals(expect, actual);
	}
	
	
	private static void TestRectangle() {
		IList<Point> points = new List<Point>{new Point(-3, 2), new Point(1, 2), new Point(1, -4), new Point(-3, -4)};
		IList<Point> actual = ConvexHull.MakeHull(points);
		IList<Point> expect = new List<Point>{new Point(-3, -4), new Point(-3, 2), new Point(1, 2), new Point(1, -4)};
		AssertEquals(expect, actual);
	}
	
	
	
	/*---- Randomized testing ----*/
	
	private static void TestHorizontalRandomly() {
		const int TRIALS = 100000;
		for (int i = 0; i < TRIALS; i++) {
			int len = rand.Next(30) + 1;
			IList<Point> points = new List<Point>();
			if (rand.NextDouble() < 0.5) {
				double y = NextGaussian();
				for (int j = 0; j < len; j++)
					points.Add(new Point(NextGaussian(), y));
			} else {
				int y = rand.Next(20) - 10;
				for (int j = 0; j < len; j++)
					points.Add(new Point(rand.Next(30), y));
			}
			IList<Point> actual = ConvexHull.MakeHull(points);
			IList<Point> expected = new List<Point>();
			expected.Add(points.Min());
			if (points.Max().CompareTo(expected[0]) != 0)
				expected.Add(points.Max());
			AssertEquals(expected, actual);
		}
	}
	
	
	private static void TestVerticalRandomly() {
		const int TRIALS = 100000;
		for (int i = 0; i < TRIALS; i++) {
			int len = rand.Next(30) + 1;
			IList<Point> points = new List<Point>();
			if (rand.NextDouble() < 0.5) {
				double x = NextGaussian();
				for (int j = 0; j < len; j++)
					points.Add(new Point(x, NextGaussian()));
			} else {
				int x = rand.Next(20) - 10;
				for (int j = 0; j < len; j++)
					points.Add(new Point(x, rand.Next(30)));
			}
			IList<Point> actual = ConvexHull.MakeHull(points);
			IList<Point> expected = new List<Point>();
			expected.Add(points.Min());
			if (points.Max().CompareTo(expected[0]) != 0)
				expected.Add(points.Max());
			AssertEquals(expected, actual);
		}
	}
	
	
	private static void TestVsNaiveRandomly() {
		const int TRIALS = 100000;
		for (int i = 0; i < TRIALS; i++) {
			int len = rand.Next(100);
			IList<Point> points = new List<Point>();
			if (rand.NextDouble() < 0.5) {
				for (int j = 0; j < len; j++)
					points.Add(new Point(NextGaussian(), NextGaussian()));
			} else {
				for (int j = 0; j < len; j++)
					points.Add(new Point(rand.Next(10), rand.Next(10)));
			}
			IList<Point> actual = ConvexHull.MakeHull(points);
			IList<Point> expected = MakeHullNaive(points);
			AssertEquals(expected, actual);
		}
	}
	
	
	private static void TestHullPropertiesRandomly() {
		const int TRIALS = 100000;
		for (int i = 0; i < TRIALS; i++) {
			
			// Generate random points
			int len = rand.Next(100);
			IList<Point> points = new List<Point>();
			if (rand.NextDouble() < 0.5) {
				for (int j = 0; j < len; j++)
					points.Add(new Point(NextGaussian(), NextGaussian()));
			} else {
				for (int j = 0; j < len; j++)
					points.Add(new Point(rand.Next(10), rand.Next(10)));
			}
			
			// Compute hull and check properties
			IList<Point> hull = ConvexHull.MakeHull(points);
			AssertTrue(IsPolygonConvex(hull));
			foreach (Point p in points)
				AssertTrue(IsPointInConvexPolygon(hull, p));
			
			// Add duplicate points and check new hull
			if (points.Count > 0) {
				int dupe = rand.Next(10) + 1;
				for (int j = 0; j < dupe; j++)
					points.Add(points[rand.Next(points.Count)]);
				IList<Point> nextHull = ConvexHull.MakeHull(points);
				AssertEquals(hull, nextHull);
			}
		}
	}
	
	
	private static IList<Point> MakeHullNaive(IList<Point> points) {
		if (points.Count <= 1)
			return new List<Point>(points);
		IList<Point> result = new List<Point>();
		
		// Jarvis march / gift wrapping algorithm
		Point point = points.Min();
		do {
			result.Add(point);
			Point next = points[0];
			foreach (Point p in points) {
				double ax = next.x - point.x;
				double ay = next.y - point.y;
				double bx = p.x - point.x;
				double by = p.y - point.y;
				double cross = ax * by - ay * bx;
				if (cross > 0 || cross == 0 && bx * bx + by * by > ax * ax + ay * ay)
					next = p;
			}
			point = next;
		} while (point.CompareTo(result[0]) != 0);
		return result;
	}
	
	
	private static bool IsPolygonConvex(IList<Point> points) {
		int signum = 0;
		for (int i = 0; i + 2 < points.Count; i++) {
			Point p = points[i + 0];
			Point q = points[i + 1];
			Point r = points[i + 2];
			int sign = Signum((q.x - p.x) * (r.y - q.y) - (q.y - p.y) * (r.x - q.x));
			if (sign == 0)
				continue;
			else if (signum == 0)
				signum = sign;
			else if (sign != signum)
				return false;
		}
		return true;
	}
	
	
	private static bool IsPointInConvexPolygon(IList<Point> polygon, Point point) {
		int signum = 0;
		for (int i = 0; i < polygon.Count; i++) {
			Point p = polygon[i];
			Point q = polygon[(i + 1) % polygon.Count];
			int sign = Signum((q.x - p.x) * (point.y - q.y) - (q.y - p.y) * (point.x - q.x));
			if (sign == 0)
				continue;
			else if (signum == 0)
				signum = sign;
			else if (sign != signum)
				return false;
		}
		return true;
	}
	
	
	private static void AssertEquals(IList<Point> a, IList<Point> b) {
		if (!Enumerable.SequenceEqual(a, b))
			throw new SystemException("Assertion error");
	}
	
	
	private static void AssertTrue(bool cond) {
		if (!cond)
			throw new SystemException("Assertion error");
	}
	
	
	private static int Signum(double x) {
		if (x > 0)
			return +1;
		else if (x < 0)
			return -1;
		else
			return 0;
	}
	
	
	private static double NextGaussian() {
		return Math.Sqrt(-2 * Math.Log(rand.NextDouble())) * Math.Cos(rand.NextDouble() * Math.PI * 2);
	}
	
	
	private static Random rand = new Random();
	
}
