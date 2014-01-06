/* 
 * Smallest enclosing circle
 * 
 * Copyright (c) 2014 Nayuki Minase. All rights reserved.
 * http://nayuki.eigenstate.org/page/smallest-enclosing-circle
 */

import static org.junit.Assert.assertEquals;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import org.junit.Test;


public class smallestenclosingcircletest {
	
	@Test
	public void testMatchingNaiveAlgorithm() {
		for (int i = 0; i < 1000; i++) {
			List<Point> points = makeRandomPoints(random.nextInt(30) + 1);
			Circle reference = smallestEnclosingCircleNaive(points);
			Circle actual = smallestEnclosingCircleFast(points);
			assertEquals(reference.c.x, actual.c.x, EPSILON);
			assertEquals(reference.c.y, actual.c.y, EPSILON);
			assertEquals(reference.r  , actual.r  , EPSILON);
		}
	}
	
	
	@Test
	public void testTranslation() {
		for (int i = 0; i < 100; i++) {
			List<Point> points = makeRandomPoints(random.nextInt(300) + 1);
			Circle reference = smallestEnclosingCircleFast(points);
			for (int j = 0; j < 10; j++) {
				double dx = random.nextGaussian();
				double dy = random.nextGaussian();
				List<Point> newPoints = new ArrayList<Point>();
				for (Point p : points)
					newPoints.add(new Point(p.x + dx, p.y + dy));
				
				Circle translated = smallestEnclosingCircleFast(newPoints);
				assertEquals(reference.c.x + dx, translated.c.x, EPSILON);
				assertEquals(reference.c.y + dy, translated.c.y, EPSILON);
				assertEquals(reference.r       , translated.r  , EPSILON);
			}
		}
	}
	
	
	@Test
	public void testScaling() {
		for (int i = 0; i < 100; i++) {
			List<Point> points = makeRandomPoints(random.nextInt(300) + 1);
			Circle reference = smallestEnclosingCircleFast(points);
			for (int j = 0; j < 10; j++) {
				double scale = random.nextGaussian();
				List<Point> newPoints = new ArrayList<Point>();
				for (Point p : points)
					newPoints.add(new Point(p.x * scale, p.y * scale));
				
				Circle translated = smallestEnclosingCircleFast(newPoints);
				assertEquals(reference.c.x * scale, translated.c.x, EPSILON);
				assertEquals(reference.c.y * scale, translated.c.y, EPSILON);
				assertEquals(reference.r * Math.abs(scale), translated.r, EPSILON);
			}
		}
	}
	
	
	private static List<Point> makeRandomPoints(int n) {
		List<Point> result = new ArrayList<Point>();
		if (random.nextDouble() < 0.2) {  // Discrete lattice (to have a chance of duplicated points)
			for (int i = 0; i < n; i++)
				result.add(new Point(random.nextInt(10), random.nextInt(10)));
		} else {  // Gaussian distribution
			for (int i = 0; i < n; i++)
				result.add(new Point(random.nextGaussian(), random.nextGaussian()));
		}
		return result;
	}
	
	
	private static Circle smallestEnclosingCircleFast(List<Point> points) {
		double[] temp = smallestenclosingcircle.makeCircle(points);
		if (temp == null)
			return null;
		else
			return new Circle(new Point(temp[0], temp[1]), temp[2]);
	}
	
	
	// Smallest enclosing circle - naive algorithm (O(n^4) time)
	private static Circle smallestEnclosingCircleNaive(List<Point> points) {
		if (points.size() == 0)
			return null;
		else if (points.size() == 1)
			return new Circle(points.get(0), 0);
		
		// Try all unique pairs
		Circle best = null;
		for (int i = 0; i < points.size(); i++) {
			for (int j = i + 1; j < points.size(); j++) {
				Circle c = smallestenclosingcircle.makeDiameter(points.get(i), points.get(j));
				if (c.contains(points) && (best == null || c.r < best.r))
					best = c;
			}
		}
		if (best != null)
			return best;  // This optimization is not mathematically proven
		
		// Try all unique triples
		for (int i = 0; i < points.size(); i++) {
			for (int j = i + 1; j < points.size(); j++) {
				for (int k = j + 1; k < points.size(); k++) {
					Circle c = smallestenclosingcircle.makeCircumcircle(points.get(i), points.get(j), points.get(k));
					if (c != null && c.contains(points) && (best == null || c.r < best.r))
						best = c;
				}
			}
		}
		if (best == null)
			throw new AssertionError();
		return best;
	}
	
	
	private static final double EPSILON = 1e-12;
	
	private static Random random = new Random();
	
}
