/* 
 * Convex hull algorithm - Test suite (Java)
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import org.junit.Test;


public final class ConvexHullTest {
	
	/*---- Fixed test vectors ----*/
	
	@Test public void testEmpty() {
		List<Point> points = Collections.emptyList();
		List<Point> actual = ConvexHull.makeHull(points);
		List<Point> expect = Collections.emptyList();
		assertEquals(expect, actual);
	}
	
	
	@Test public void testOne() {
		List<Point> points = Arrays.asList(new Point(3, 1));
		List<Point> actual = ConvexHull.makeHull(points);
		List<Point> expect = points;
		assertEquals(expect, actual);
	}
	
	
	@Test public void testTwoDuplicate() {
		List<Point> points = Arrays.asList(new Point(0, 0), new Point(0, 0));
		List<Point> actual = ConvexHull.makeHull(points);
		List<Point> expect = Arrays.asList(new Point(0, 0));
		assertEquals(expect, actual);
	}
	
	
	@Test public void testTwoHorizontal0() {
		List<Point> points = Arrays.asList(new Point(2, 0), new Point(5, 0));
		List<Point> actual = ConvexHull.makeHull(points);
		List<Point> expect = points;
		assertEquals(expect, actual);
	}
	
	
	@Test public void testTwoHorizontal1() {
		List<Point> points = Arrays.asList(new Point(-6, -3), new Point(-8, -3));
		List<Point> actual = ConvexHull.makeHull(points);
		List<Point> expect = Arrays.asList(new Point(-8, -3), new Point(-6, -3));
		assertEquals(expect, actual);
	}
	
	
	@Test public void testTwoVertical0() {
		List<Point> points = Arrays.asList(new Point(1, -4), new Point(1, 4));
		List<Point> actual = ConvexHull.makeHull(points);
		List<Point> expect = Arrays.asList(new Point(1, 4), new Point(1, -4));
		assertEquals(expect, actual);
	}
	
	
	@Test public void testTwoVertical1() {
		List<Point> points = Arrays.asList(new Point(-1, 2), new Point(-1, -3));
		List<Point> actual = ConvexHull.makeHull(points);
		List<Point> expect = points;
		assertEquals(expect, actual);
	}
	
	
	@Test public void testTwoDiagonal0() {
		List<Point> points = Arrays.asList(new Point(-2, -3), new Point(2, 0));
		List<Point> actual = ConvexHull.makeHull(points);
		List<Point> expect = points;
		assertEquals(expect, actual);
	}
	
	
	@Test public void testTwoDiagonal1() {
		List<Point> points = Arrays.asList(new Point(-2, 3), new Point(2, 0));
		List<Point> actual = ConvexHull.makeHull(points);
		List<Point> expect = points;
		assertEquals(expect, actual);
	}
	
	
	@Test public void testRectangle() {
		List<Point> points = Arrays.asList(new Point(-3, -4), new Point(-3, 2), new Point(1, 2), new Point(1, -4));
		List<Point> actual = ConvexHull.makeHull(points);
		List<Point> expect = Arrays.asList(new Point(-3, 2), new Point(1, 2), new Point(1, -4), new Point(-3, -4));
		assertEquals(expect, actual);
	}
	
	
	
	/*---- Randomized testing ----*/
	
	@Test public void testVsNaiveRandomly() {
		final int TRIALS = 100000;
		for (int i = 0; i < TRIALS; i++) {
			int len = rand.nextInt(100);
			List<Point> points = new ArrayList<>();
			if (rand.nextBoolean()) {
				for (int j = 0; j < len; j++)
					points.add(new Point(rand.nextGaussian(), rand.nextGaussian()));
			} else {
				for (int j = 0; j < len; j++)
					points.add(new Point(rand.nextInt(10), rand.nextInt(10)));
			}
			List<Point> actual = ConvexHull.makeHull(points);
			List<Point> expected = makeHullNaive(points);
			assertEquals(actual, expected);
		}
	}
	
	
	@Test public void testHullPropertiesRandomly() {
		final int TRIALS = 100000;
		for (int i = 0; i < TRIALS; i++) {
			
			// Generate random points
			int len = rand.nextInt(100);
			List<Point> points = new ArrayList<>();
			if (rand.nextBoolean()) {
				for (int j = 0; j < len; j++)
					points.add(new Point(rand.nextGaussian(), rand.nextGaussian()));
			} else {
				for (int j = 0; j < len; j++)
					points.add(new Point(rand.nextInt(10), rand.nextInt(10)));
			}
			
			// Compute hull and check properties
			List<Point> hull = ConvexHull.makeHull(points);
			assertTrue(isPolygonConvex(hull));
			for (Point p : points)
				assertTrue(isPointInConvexPolygon(hull, p));
			
			// Add duplicate points and check new hull
			if (!points.isEmpty()) {
				int dupe = rand.nextInt(10) + 1;
				for (int j = 0; j < dupe; j++)
					points.add(points.get(rand.nextInt(points.size())));
				List<Point> nextHull = ConvexHull.makeHull(points);
				assertEquals(hull, nextHull);
			}
		}
	}
	
	
	private static List<Point> makeHullNaive(List<Point> points) {
		if (points.size() <= 1)
			return new ArrayList<>(points);
		List<Point> result = new ArrayList<>();
		Point point = null;
		for (Point p : points) {
			if (point == null || p.x < point.x || p.x == point.x && p.y > point.y)
				point = p;
		}
		
		// Jarvis march / gift wrapping algorithm
		do {
			result.add(point);
			Point next = points.get(0);
			for (Point p : points) {
				boolean accept = next.equals(point);
				if (!accept) {
					double ax = next.x - point.x;
					double ay = next.y - point.y;
					double bx = p.x - point.x;
					double by = p.y - point.y;
					double cross = ax * by - ay * bx;
					accept = cross > 0 || cross == 0 && bx * bx + by * by > ax * ax + ay * ay;
				}
				if (accept)
					next = p;
			}
			point = next;
		} while (!point.equals(result.get(0)));
		return result;
	}
	
	
	private static boolean isPolygonConvex(List<Point> points) {
		int signum = 0;
		for (int i = 0; i + 2 < points.size(); i++) {
			Point p = points.get(i + 0);
			Point q = points.get(i + 1);
			Point r = points.get(i + 2);
			int sign = signum((q.x - p.x) * (r.y - q.y) - (q.y - p.y) * (r.x - q.x));
			if (sign == 0)
				continue;
			else if (signum == 0)
				signum = sign;
			else if (sign != signum)
				return false;
		}
		return true;
	}
	
	
	private static boolean isPointInConvexPolygon(List<Point> polygon, Point point) {
		int signum = 0;
		for (int i = 0; i < polygon.size(); i++) {
			Point p = polygon.get(i);
			Point q = polygon.get((i + 1) % polygon.size());
			int sign = signum((q.x - p.x) * (point.y - q.y) - (q.y - p.y) * (point.x - q.x));
			if (sign == 0)
				continue;
			else if (signum == 0)
				signum = sign;
			else if (sign != signum)
				return false;
		}
		return true;
	}
	
	
	private static int signum(double x) {
		if (x > 0)
			return +1;
		else if (x < 0)
			return -1;
		else
			return 0;
	}
	
	
	private static final Random rand = new Random();
	
}
