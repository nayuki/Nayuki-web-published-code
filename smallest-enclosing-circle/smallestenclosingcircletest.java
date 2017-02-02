/* 
 * Smallest enclosing circle - Test suite (Java)
 * 
 * Copyright (c) 2017 Project Nayuki
 * https://www.nayuki.io/page/smallest-enclosing-circle
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program (see COPYING.txt).
 * If not, see <http://www.gnu.org/licenses/>.
 */

import static org.junit.Assert.assertEquals;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import org.junit.Test;


public final class smallestenclosingcircletest {
	
	/*---- Test suite functions ----*/
	
	@Test public void testMatchingNaiveAlgorithm() {
		for (int i = 0; i < 1000; i++) {
			List<Point> points = makeRandomPoints(random.nextInt(30) + 1);
			Circle reference = smallestEnclosingCircleNaive(points);
			Circle actual = smallestenclosingcircle.makeCircle(points);
			assertEquals(reference.c.x, actual.c.x, EPSILON);
			assertEquals(reference.c.y, actual.c.y, EPSILON);
			assertEquals(reference.r  , actual.r  , EPSILON);
		}
	}
	
	
	@Test public void testTranslation() {
		for (int i = 0; i < 100; i++) {
			List<Point> points = makeRandomPoints(random.nextInt(300) + 1);
			Circle reference = smallestenclosingcircle.makeCircle(points);
			
			for (int j = 0; j < 10; j++) {
				double dx = random.nextGaussian();
				double dy = random.nextGaussian();
				List<Point> newPoints = new ArrayList<>();
				for (Point p : points)
					newPoints.add(new Point(p.x + dx, p.y + dy));
				
				Circle translated = smallestenclosingcircle.makeCircle(newPoints);
				assertEquals(reference.c.x + dx, translated.c.x, EPSILON);
				assertEquals(reference.c.y + dy, translated.c.y, EPSILON);
				assertEquals(reference.r       , translated.r  , EPSILON);
			}
		}
	}
	
	
	@Test public void testScaling() {
		for (int i = 0; i < 100; i++) {
			List<Point> points = makeRandomPoints(random.nextInt(300) + 1);
			Circle reference = smallestenclosingcircle.makeCircle(points);
			
			for (int j = 0; j < 10; j++) {
				double scale = random.nextGaussian();
				List<Point> newPoints = new ArrayList<>();
				for (Point p : points)
					newPoints.add(new Point(p.x * scale, p.y * scale));
				
				Circle scaled = smallestenclosingcircle.makeCircle(newPoints);
				assertEquals(reference.c.x * scale, scaled.c.x, EPSILON);
				assertEquals(reference.c.y * scale, scaled.c.y, EPSILON);
				assertEquals(reference.r * Math.abs(scale), scaled.r, EPSILON);
			}
		}
	}
	
	
	/*---- Helper functions ----*/
	
	private static List<Point> makeRandomPoints(int n) {
		List<Point> result = new ArrayList<>();
		if (random.nextDouble() < 0.2) {  // Discrete lattice (to have a chance of duplicated points)
			for (int i = 0; i < n; i++)
				result.add(new Point(random.nextInt(10), random.nextInt(10)));
		} else {  // Gaussian distribution
			for (int i = 0; i < n; i++)
				result.add(new Point(random.nextGaussian(), random.nextGaussian()));
		}
		return result;
	}
	
	
	// Returns the smallest enclosing circle in O(n^4) time using the naive algorithm.
	private static Circle smallestEnclosingCircleNaive(List<Point> points) {
		// Degenerate cases
		if (points.size() == 0)
			return null;
		else if (points.size() == 1)
			return new Circle(points.get(0), 0);
		
		// Try all unique pairs
		Circle result = null;
		for (int i = 0; i < points.size(); i++) {
			for (int j = i + 1; j < points.size(); j++) {
				Circle c = smallestenclosingcircle.makeDiameter(points.get(i), points.get(j));
				if ((result == null || c.r < result.r) && c.contains(points))
					result = c;
			}
		}
		if (result != null)
			return result;  // This optimization is not mathematically proven
		
		// Try all unique triples
		for (int i = 0; i < points.size(); i++) {
			for (int j = i + 1; j < points.size(); j++) {
				for (int k = j + 1; k < points.size(); k++) {
					Circle c = smallestenclosingcircle.makeCircumcircle(points.get(i), points.get(j), points.get(k));
					if (c != null && (result == null || c.r < result.r) && c.contains(points))
						result = c;
				}
			}
		}
		if (result == null)
			throw new AssertionError();
		return result;
	}
	
	
	private static final double EPSILON = 1e-12;
	
	private static Random random = new Random();
	
}
