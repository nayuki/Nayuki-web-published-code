/* 
 * Convex hull algorithm - Test suite (C++)
 * 
 * Copyright (c) 2022 Project Nayuki
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

#include <algorithm>
#include <cstddef>
#include <cstdlib>
#include <exception>
#include <iostream>
#include <random>
#include <utility>
#include "ConvexHull.hpp"

using std::size_t;
using std::vector;


// Forward declarations
static void testEmpty();
static void testOne();
static void testTwoDuplicate();
static void testTwoHorizontal0();
static void testTwoHorizontal1();
static void testTwoVertical0();
static void testTwoVertical1();
static void testTwoDiagonal0();
static void testTwoDiagonal1();
static void testRectangle();
static void testHorizontalRandomly();
static void testVerticalRandomly();
static void testVsNaiveRandomly();
static void testHullPropertiesRandomly();

static vector<Point> makeHullNaive(const vector<Point> &points);
static bool isPolygonConvex(const vector<Point> &points);
static bool isPointInConvexPolygon(const vector<Point> &polygon, const Point &point);
static int signum(double x);


// Random number generation global variables
static std::default_random_engine randGen((std::random_device())());
static std::bernoulli_distribution boolDist;
static std::normal_distribution<double> normalDist;


int main() {
	try {
		testEmpty();
		testOne();
		testTwoDuplicate();
		testTwoHorizontal0();
		testTwoHorizontal1();
		testTwoVertical0();
		testTwoVertical1();
		testTwoDiagonal0();
		testTwoDiagonal1();
		testRectangle();
		testHorizontalRandomly();
		testVerticalRandomly();
		testVsNaiveRandomly();
		testHullPropertiesRandomly();
		
		std::cerr << "Test passed" << std::endl;
		return EXIT_SUCCESS;
	} catch (std::exception &e) {
		std::cerr << e.what() << std::endl;
		return EXIT_FAILURE;
	}
}



/*---- Fixed test vectors ----*/

static void testEmpty() {
	const vector<Point> points{};
	const vector<Point> actual = makeConvexHull(points);
	const vector<Point> expect = points;
	if (actual != expect)
		throw std::runtime_error("Value mismatch");
}


static void testOne() {
	const vector<Point> points{Point{3, 1}};
	const vector<Point> actual = makeConvexHull(points);
	const vector<Point> expect = points;
	if (actual != expect)
		throw std::runtime_error("Value mismatch");
}


static void testTwoDuplicate() {
	const vector<Point> points{Point{0, 0}, Point{0, 0}};
	const vector<Point> actual = makeConvexHull(points);
	const vector<Point> expect{Point{0, 0}};
	if (actual != expect)
		throw std::runtime_error("Value mismatch");
}


static void testTwoHorizontal0() {
	const vector<Point> points{Point{2, 0}, Point{5, 0}};
	const vector<Point> actual = makeConvexHull(points);
	const vector<Point> expect = points;
	if (actual != expect)
		throw std::runtime_error("Value mismatch");
}


static void testTwoHorizontal1() {
	const vector<Point> points{Point{-6, -3}, Point{-8, -3}};
	const vector<Point> actual = makeConvexHull(points);
	const vector<Point> expect{Point{-8, -3}, Point{-6, -3}};
	if (actual != expect)
		throw std::runtime_error("Value mismatch");
}


static void testTwoVertical0() {
	const vector<Point> points{Point{1, -4}, Point{1, 4}};
	const vector<Point> actual = makeConvexHull(points);
	const vector<Point> expect = points;
	if (actual != expect)
		throw std::runtime_error("Value mismatch");
}


static void testTwoVertical1() {
	const vector<Point> points{Point{-1, 2}, Point{-1, -3}};
	const vector<Point> actual = makeConvexHull(points);
	const vector<Point> expect{Point{-1, -3}, Point{-1, 2}};
	if (actual != expect)
		throw std::runtime_error("Value mismatch");
}


static void testTwoDiagonal0() {
	const vector<Point> points{Point{-2, -3}, Point{2, 0}};
	const vector<Point> actual = makeConvexHull(points);
	const vector<Point> expect = points;
	if (actual != expect)
		throw std::runtime_error("Value mismatch");
}


static void testTwoDiagonal1() {
	const vector<Point> points{Point{-2, 3}, Point{2, 0}};
	const vector<Point> actual = makeConvexHull(points);
	const vector<Point> expect = points;
	if (actual != expect)
		throw std::runtime_error("Value mismatch");
}


static void testRectangle() {
	const vector<Point> points{Point{-3, 2}, Point{1, 2}, Point{1, -4}, Point{-3, -4}};
	const vector<Point> actual = makeConvexHull(points);
	const vector<Point> expect{Point{-3, -4}, Point{-3, 2}, Point{1, 2}, Point{1, -4}};
	if (actual != expect)
		throw std::runtime_error("Value mismatch");
}



/*---- Randomized testing ----*/

static void testHorizontalRandomly() {
	const long TRIALS = 100000;
	std::uniform_int_distribution<size_t> numPointsDist(1, 30);
	for (long i = 0; i < TRIALS; i++) {
		size_t len = numPointsDist(randGen);
		vector<Point> points;
		if (boolDist(randGen)) {
			double y = normalDist(randGen);
			for (size_t j = 0; j < len; j++)
				points.push_back(Point{normalDist(randGen), y});
		} else {
			std::uniform_int_distribution<int> valDist(-10, 9);
			double y = valDist(randGen);
			for (size_t j = 0; j < len; j++)
				points.push_back(Point{static_cast<double>(valDist(randGen)), y});
		}
		
		const vector<Point> actual = makeConvexHull(points);
		vector<Point> expected{*std::min_element(points.cbegin(), points.cend())};
		const Point &temp = *std::max_element(points.cbegin(), points.cend());
		if (temp != expected.front())
			expected.push_back(temp);
		if (actual != expected)
			throw std::runtime_error("Value mismatch");
	}
}


static void testVerticalRandomly() {
	const long TRIALS = 100000;
	std::uniform_int_distribution<size_t> numPointsDist(1, 30);
	for (long i = 0; i < TRIALS; i++) {
		size_t len = numPointsDist(randGen);
		vector<Point> points;
		if (boolDist(randGen)) {
			double x = normalDist(randGen);
			for (size_t j = 0; j < len; j++)
				points.push_back(Point{x, normalDist(randGen)});
		} else {
			std::uniform_int_distribution<int> valDist(-10, 9);
			double x = valDist(randGen);
			for (size_t j = 0; j < len; j++)
				points.push_back(Point{x, static_cast<double>(valDist(randGen))});
		}
		
		const vector<Point> actual = makeConvexHull(points);
		vector<Point> expected{*std::min_element(points.cbegin(), points.cend())};
		const Point &temp = *std::max_element(points.cbegin(), points.cend());
		if (temp != expected.front())
			expected.push_back(temp);
		if (actual != expected)
			throw std::runtime_error("Value mismatch");
	}
}


static void testVsNaiveRandomly() {
	const long TRIALS = 100000;
	std::uniform_int_distribution<size_t> numPointsDist(0, 99);
	for (long i = 0; i < TRIALS; i++) {
		size_t len = numPointsDist(randGen);
		vector<Point> points;
		if (boolDist(randGen)) {
			for (size_t j = 0; j < len; j++)
				points.push_back(Point{normalDist(randGen), normalDist(randGen)});
		} else {
			std::uniform_int_distribution<int> valDist(0, 9);
			for (size_t j = 0; j < len; j++)
				points.push_back(Point{static_cast<double>(valDist(randGen)), static_cast<double>(valDist(randGen))});
		}
		
		const vector<Point> expected = makeHullNaive(points);
		const vector<Point> actual = makeConvexHull(std::move(points));
		if (actual != expected)
			throw std::runtime_error("Value mismatch");
	}
}


static void testHullPropertiesRandomly() {
	const long TRIALS = 100000;
	std::uniform_int_distribution<size_t> numPointsDist(0, 99);
	std::uniform_int_distribution<size_t> dupePointsDist(1, 10);
	for (long i = 0; i < TRIALS; i++) {
		
		// Generate random points
		size_t len = numPointsDist(randGen);
		vector<Point> points;
		if (boolDist(randGen)) {
			for (size_t j = 0; j < len; j++)
				points.push_back(Point{normalDist(randGen), normalDist(randGen)});
		} else {
			std::uniform_int_distribution<int> valDist(0, 9);
			for (size_t j = 0; j < len; j++)
				points.push_back(Point{static_cast<double>(valDist(randGen)), static_cast<double>(valDist(randGen))});
		}
		
		// Compute hull and check properties
		const vector<Point> hull = makeConvexHull(points);
		if (!isPolygonConvex(hull))
			throw std::runtime_error("Polygon not convex");
		for (const Point &p : points) {
			if (!isPointInConvexPolygon(hull, p))
				throw std::runtime_error("Point not in polygon");
		}
		
		// Add duplicate points and check new hull
		if (!points.empty()) {
			size_t dupe = dupePointsDist(randGen);
			for (size_t j = 0; j < dupe; j++) {
				std::uniform_int_distribution<size_t> sizeDist(0, points.size() - 1);
				points.push_back(points.at(sizeDist(randGen)));
			}
			const vector<Point> nextHull = makeConvexHull(std::move(points));
			if (nextHull != hull)
				throw std::runtime_error("Value mismatch");
		}
	}
}


static vector<Point> makeHullNaive(const vector<Point> &points) {
	if (points.size() <= 1)
		return vector<Point>(points);
	
	// Jarvis march / gift wrapping algorithm
	vector<Point> result;
	const Point *point = &*std::min_element(points.cbegin(), points.cend());
	do {
		result.push_back(*point);
		const Point *next = &points.front();
		for (const Point &p : points) {
			double ax = next->x - point->x;
			double ay = next->y - point->y;
			double bx = p.x - point->x;
			double by = p.y - point->y;
			double cross = ax * by - ay * bx;
			if (cross > 0 || (cross == 0 && bx * bx + by * by > ax * ax + ay * ay))
				next = &p;
		}
		point = next;
	} while (*point != result.front());
	return result;
}


static bool isPolygonConvex(const vector<Point> &points) {
	int state = 0;
	for (size_t i = 0; i + 2 < points.size(); i++) {
		const Point &p = points.at(i + 0);
		const Point &q = points.at(i + 1);
		const Point &r = points.at(i + 2);
		int sign = signum((q.x - p.x) * (r.y - q.y) - (q.y - p.y) * (r.x - q.x));
		if (sign == 0)
			continue;
		else if (state == 0)
			state = sign;
		else if (sign != state)
			return false;
	}
	return true;
}


static bool isPointInConvexPolygon(const vector<Point> &polygon, const Point &point) {
	int state = 0;
	for (size_t i = 0; i < polygon.size(); i++) {
		const Point &p = polygon.at(i);
		const Point &q = polygon.at((i + 1) % polygon.size());
		int sign = signum((q.x - p.x) * (point.y - q.y) - (q.y - p.y) * (point.x - q.x));
		if (sign == 0)
			continue;
		else if (state == 0)
			state = sign;
		else if (sign != state)
			return false;
	}
	return true;
}


static int signum(double x) {
	if (x > 0)
		return +1;
	else if (x < 0)
		return -1;
	else
		return 0;
}
