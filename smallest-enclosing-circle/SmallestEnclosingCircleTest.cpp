/* 
 * Smallest enclosing circle - Test suite (C++)
 * 
 * Copyright (c) 2021 Project Nayuki
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

#include <cmath>
#include <cstddef>
#include <cstdlib>
#include <iostream>
#include <random>
#include <utility>
#include "SmallestEnclosingCircle.hpp"

using std::size_t;
using std::vector;


// Forward declarations
static void testMatchingNaiveAlgorithm();
static void testTranslation();
static void testScaling();
static vector<Point> makeRandomPoints(size_t n);
static Circle smallestEnclosingCircleNaive(const vector<Point> &points);
static void assertApproxEqual(double expect, double actual, double epsilon);


// Random number generation global variables
static std::default_random_engine randGen((std::random_device())());
static std::normal_distribution<double> normalDist;

static const double EPSILON = 1e-12;


int main() {
	try {
		testMatchingNaiveAlgorithm();
		testTranslation();
		testScaling();
		
		std::cerr << "Test passed" << std::endl;
		return EXIT_SUCCESS;
	} catch (const char *msg) {
		std::cerr << msg << std::endl;
		return EXIT_FAILURE;
	}
}


static void testMatchingNaiveAlgorithm() {
	const long trials = 10000;
	std::uniform_int_distribution<size_t> numPointsDist(1, 30);
	for (long i = 0; i < trials; i++) {
		const vector<Point> points = makeRandomPoints(numPointsDist(randGen));
		Circle reference = smallestEnclosingCircleNaive(points);
		Circle actual = makeSmallestEnclosingCircle(std::move(points));
		assertApproxEqual(reference.c.x, actual.c.x, EPSILON);
		assertApproxEqual(reference.c.y, actual.c.y, EPSILON);
		assertApproxEqual(reference.r  , actual.r  , EPSILON);
	}
}


static void testTranslation() {
	const long trials = 1000;
	const long checks = 10;
	std::uniform_int_distribution<size_t> numPointsDist(1, 300);
	for (long i = 0; i < trials; i++) {
		const vector<Point> points = makeRandomPoints(numPointsDist(randGen));
		Circle reference = makeSmallestEnclosingCircle(points);
		
		for (long j = 0; j < checks; j++) {
			double dx = normalDist(randGen);
			double dy = normalDist(randGen);
			vector<Point> newPoints;
			for (const Point &p : points)
				newPoints.push_back(Point{p.x + dx, p.y + dy});
			
			Circle translated = makeSmallestEnclosingCircle(std::move(newPoints));
			assertApproxEqual(reference.c.x + dx, translated.c.x, EPSILON);
			assertApproxEqual(reference.c.y + dy, translated.c.y, EPSILON);
			assertApproxEqual(reference.r       , translated.r  , EPSILON);
		}
	}
}


static void testScaling() {
	const long trials = 1000;
	const long checks = 10;
	std::uniform_int_distribution<size_t> numPointsDist(1, 300);
	for (long i = 0; i < trials; i++) {
		const vector<Point> points = makeRandomPoints(numPointsDist(randGen));
		Circle reference = makeSmallestEnclosingCircle(points);
		
		for (long j = 0; j < checks; j++) {
			double scale = normalDist(randGen);
			vector<Point> newPoints;
			for (const Point &p : points)
				newPoints.push_back(Point{p.x * scale, p.y * scale});
			
			Circle scaled = makeSmallestEnclosingCircle(std::move(newPoints));
			assertApproxEqual(reference.c.x * scale, scaled.c.x, EPSILON);
			assertApproxEqual(reference.c.y * scale, scaled.c.y, EPSILON);
			assertApproxEqual(reference.r * std::fabs(scale), scaled.r, EPSILON);
		}
	}
}


static vector<Point> makeRandomPoints(size_t n) {
	vector<Point> result;
	if (std::uniform_real_distribution<double>()(randGen) < 0.2) {  // Discrete lattice (to have a chance of duplicated points)
		std::uniform_int_distribution<int> dist(0, 9);
		for (size_t i = 0; i < n; i++)
			result.push_back(Point{static_cast<double>(dist(randGen)), static_cast<double>(dist(randGen))});
	} else {  // Gaussian distribution
		for (size_t i = 0; i < n; i++)
			result.push_back(Point{normalDist(randGen), normalDist(randGen)});
	}
	return result;
}


// Returns the smallest enclosing circle in O(n^4) time using the naive algorithm.
static Circle smallestEnclosingCircleNaive(const vector<Point> &points) {
	// Degenerate cases
	if (points.empty())
		return Circle::INVALID;
	else if (points.size() == 1)
		return Circle{points.at(0), 0};
	
	// Try all unique pairs
	Circle result(Circle::INVALID);
	for (size_t i = 0; i < points.size(); i++) {
		for (size_t j = i + 1; j < points.size(); j++) {
			Circle c = makeDiameter(points.at(i), points.at(j));
			if ((result.r < 0 || c.r < result.r) && c.contains(points))
				result = c;
		}
	}
	if (result.r >= 0)
		return result;  // This optimization is not mathematically proven
	
	// Try all unique triples
	for (size_t i = 0; i < points.size(); i++) {
		for (size_t j = i + 1; j < points.size(); j++) {
			for (size_t k = j + 1; k < points.size(); k++) {
				Circle c = makeCircumcircle(points.at(i), points.at(j), points.at(k));
				if (c.r >= 0 && (result.r < 0 || c.r < result.r) && c.contains(points))
					result = c;
			}
		}
	}
	if (result.r < 0)
		throw "Assertion error";
	return result;
}


static void assertApproxEqual(double expect, double actual, double epsilon) {
	if (std::fabs(expect - actual) > epsilon)
		throw "Value mismatch";
}
