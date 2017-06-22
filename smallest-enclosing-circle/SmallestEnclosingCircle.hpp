/* 
 * Smallest enclosing circle - Library (C++)
 * 
 * Copyright (c) 2017 Project Nayuki
 * https://www.nayuki.io/page/smallest-enclosing-circle
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

#include <vector>


struct Point final {
	
	public: double x;
	public: double y;
	
	
	public: Point subtract(const Point &p) const;
	
	public: double distance(const Point &p) const;
	
	// Signed area / determinant thing
	public: double cross(const Point &p) const;
	
};


struct Circle final {
	
	public: static const Circle INVALID;
	
	private: static const double MULTIPLICATIVE_EPSILON;
	
	
	public: Point c;   // Center
	public: double r;  // Radius
	
	
	public: bool contains(const Point &p) const;
	
	public: bool contains(const std::vector<Point> &ps) const;
	
};


/* 
 * (Main function) Returns the smallest circle that encloses all the given points.
 * Runs in expected O(n) time, randomized. Note: If 0 points are given, a circle of
 * negative radius is returned. If 1 point is given, a circle of radius 0 is returned.
 */
Circle makeSmallestEnclosingCircle(const std::vector<Point> &points);

// For unit tests
Circle makeDiameter(const Point &a, const Point &b);
Circle makeCircumcircle(const Point &a, const Point &b, const Point &c);
