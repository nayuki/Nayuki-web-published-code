/* 
 * Smallest enclosing circle - Library (C#)
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

using System;
using System.Collections.Generic;


public sealed class smallestenclosingcircle {
	
	/* 
	 * Returns the smallest circle that encloses all the given points. Runs in expected O(n) time, randomized.
	 * Note: If 0 points are given, a circle of radius -1 is returned. If 1 point is given, a circle of radius 0 is returned.
	 */
	// Initially: No boundary points known
	public static Circle MakeCircle(IList<Point> points) {
		// Clone list to preserve the caller's data, do Durstenfeld shuffle
		List<Point> shuffled = new List<Point>(points);
		Random rand = new Random();
		for (int i = shuffled.Count - 1; i > 0; i--) {
			int j = rand.Next(i + 1);
			Point temp = shuffled[i];
			shuffled[i] = shuffled[j];
			shuffled[j] = temp;
		}
		
		// Progressively add points to circle or recompute circle
		Circle c = new Circle(new Point(0, 0), -1);
		for (int i = 0; i < shuffled.Count; i++) {
			Point p = shuffled[i];
			if (c.r == -1 || !c.Contains(p))
				c = makeCircleOnePoint(shuffled.GetRange(0, i + 1), p);
		}
		return c;
	}
	
	
	// One boundary point known
	private static Circle makeCircleOnePoint(List<Point> points, Point p) {
		Circle c = new Circle(p, 0);
		for (int i = 0; i < points.Count; i++) {
			Point q = points[i];
			if (!c.Contains(q)) {
				if (c.r == 0)
					c = makeDiameter(p, q);
				else
					c = makeCircleTwoPoints(points.GetRange(0, i + 1), p, q);
			}
		}
		return c;
	}
	
	
	// Two boundary points known
	private static Circle makeCircleTwoPoints(List<Point> points, Point p, Point q) {
		Circle circ = makeDiameter(p, q);
		Circle left = new Circle(new Point(0, 0), -1);
		Circle right = new Circle(new Point(0, 0), -1);
		
		// For each point not in the two-point circle
		Point pq = q.Subtract(p);
		foreach (Point r in points) {
			if (circ.Contains(r))
				continue;
			
			// Form a circumcircle and classify it on left or right side
			double cross = pq.Cross(r.Subtract(p));
			Circle c = makeCircumcircle(p, q, r);
			if (c.r == -1)
				continue;
			else if (cross > 0 && (left.r == -1 || pq.Cross(c.c.Subtract(p)) > pq.Cross(left.c.Subtract(p))))
				left = c;
			else if (cross < 0 && (right.r == -1 || pq.Cross(c.c.Subtract(p)) < pq.Cross(right.c.Subtract(p))))
				right = c;
		}
		
		// Select which circle to return
		if (left.r == -1 && right.r == -1)
			return circ;
		else if (left.r == -1)
			return right;
		else if (right.r == -1)
			return left;
		else
			return left.r <= right.r ? left : right;
	}
	
	
	private static Circle makeDiameter(Point a, Point b) {
		Point c = new Point((a.x + b.x) / 2, (a.y + b.y) / 2);
		return new Circle(c, Math.Max(c.Distance(a), c.Distance(b)));
	}
	
	
	private static Circle makeCircumcircle(Point a, Point b, Point c) {
		// Mathematical algorithm from Wikipedia: Circumscribed circle
		double d = (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) * 2;
		if (d == 0)
			return new Circle(new Point(0, 0), -1);
		double x = (a.Norm() * (b.y - c.y) + b.Norm() * (c.y - a.y) + c.Norm() * (a.y - b.y)) / d;
		double y = (a.Norm() * (c.x - b.x) + b.Norm() * (a.x - c.x) + c.Norm() * (b.x - a.x)) / d;
		Point p = new Point(x, y);
		double r = Math.Max(Math.Max(p.Distance(a), p.Distance(b)), p.Distance(c));
		return new Circle(p, r);
	}
	
}



public struct Circle {
	
	private static double MULTIPLICATIVE_EPSILON = 1 + 1e-14;
	
	
	public Point c;   // Center
	public double r;  // Radius
	
	
	public Circle(Point c, double r) {
		this.c = c;
		this.r = r;
	}
	
	
	public bool Contains(Point p) {
		return c.Distance(p) <= r * MULTIPLICATIVE_EPSILON;
	}
	
	
	public bool Contains(ICollection<Point> ps) {
		foreach (Point p in ps) {
			if (!Contains(p))
				return false;
		}
		return true;
	}
	
}



public struct Point {
	
	public double x;
	public double y;
	
	
	public Point(double x, double y) {
		this.x = x;
		this.y = y;
	}
	
	
	public Point Subtract(Point p) {
		return new Point(x - p.x, y - p.y);
	}
	
	
	public double Distance(Point p) {
		double dx = x - p.x;
		double dy = y - p.y;
		return Math.Sqrt(dx * dx + dy * dy);
	}
	
	
	// Signed area / determinant thing
	public double Cross(Point p) {
		return x * p.y - y * p.x;
	}
	
	
	// Magnitude squared
	public double Norm() {
		return x * x + y * y;
	}
	
}
