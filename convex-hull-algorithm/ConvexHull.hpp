/* 
 * Convex hull algorithm - Library (C++)
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

#include <vector>


struct Point final {
	
	public: double x;
	public: double y;
	
	
	public: bool operator==(const Point &other) const;
	public: bool operator!=(const Point &other) const;
	public: bool operator< (const Point &other) const;
	public: bool operator<=(const Point &other) const;
	public: bool operator> (const Point &other) const;
	public: bool operator>=(const Point &other) const;
	
};


// Returns a new list of points representing the convex hull of
// the given set of points. The convex hull excludes collinear points.
// This algorithm runs in O(n log n) time.
std::vector<Point> makeConvexHull(const std::vector<Point> &points);


// Returns the convex hull, assuming that each points[i] <= points[i + 1]. Runs in O(n) time.
std::vector<Point> makeConvexHullPresorted(const std::vector<Point> &points);
