/* 
 * Smallest enclosing circle - Library (TypeScript)
 * 
 * Copyright (c) 2018 Project Nayuki
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

"use strict";


interface Point {
	x: number;
	y: number;
}


interface Circle {
	x: number;
	y: number;
	r: number;
}


/* 
 * Returns the smallest circle that encloses all the given points. Runs in expected O(n) time, randomized.
 * Input: A list of points, where each point is an object {x: float, y: float}, e.g. [{x:0,y:5}, {x:3.1,y:-2.7}].
 * Output: A circle object of the form {x: float, y: float, r: float}.
 * Note: If 0 points are given, null is returned. If 1 point is given, a circle of radius 0 is returned.
 */
// Initially: No boundary points known
function makeCircle(points: Array<Point>): Circle|null {
	// Clone list to preserve the caller's data, do Durstenfeld shuffle
	let shuffled: Array<Point> = points.slice();
	for (let i = points.length - 1; i >= 0; i--) {
		let j = Math.floor(Math.random() * (i + 1));
		j = Math.max(Math.min(j, i), 0);
		let temp: Point = shuffled[i];
		shuffled[i] = shuffled[j];
		shuffled[j] = temp;
	}
	
	// Progressively add points to circle or recompute circle
	let c: Circle|null = null;
	for (let i = 0; i < shuffled.length; i++) {
		let p: Point = shuffled[i];
		if (c == null || !isInCircle(c, p))
			c = makeCircleOnePoint(shuffled.slice(0, i + 1), p);
	}
	return c;
}


// One boundary point known
function makeCircleOnePoint(points: Array<Point>, p: Point): Circle {
	let c: Circle = {x: p.x, y: p.y, r: 0};
	for (let i = 0; i < points.length; i++) {
		let q: Point = points[i];
		if (!isInCircle(c, q)) {
			if (c.r == 0)
				c = makeDiameter(p, q);
			else
				c = makeCircleTwoPoints(points.slice(0, i + 1), p, q);
		}
	}
	return c;
}


// Two boundary points known
function makeCircleTwoPoints(points: Array<Point>, p: Point, q: Point): Circle {
	let circ: Circle = makeDiameter(p, q);
	let left : Circle|null = null;
	let right: Circle|null = null;
	
	// For each point not in the two-point circle
	points.forEach((r: Point) => {
		if (isInCircle(circ, r))
			return;
		
		// Form a circumcircle and classify it on left or right side
		let cross: number = crossProduct(p.x, p.y, q.x, q.y, r.x, r.y);
		let c: Circle|null = makeCircumcircle(p, q, r);
		if (c == null)
			return;
		else if (cross > 0 && (left == null || crossProduct(p.x, p.y, q.x, q.y, c.x, c.y) > crossProduct(p.x, p.y, q.x, q.y, left.x, left.y)))
			left = c;
		else if (cross < 0 && (right == null || crossProduct(p.x, p.y, q.x, q.y, c.x, c.y) < crossProduct(p.x, p.y, q.x, q.y, right.x, right.y)))
			right = c;
	});
	
	// Select which circle to return
	if (left == null && right == null)
		return circ;
	else if (left == null && right != null)
		return right;
	else if (left != null && right == null)
		return left;
	else if (left != null && right != null)
		return (left as Circle).r <= (right as Circle).r ? left : right;
	else
		throw "Assertion error";
}


function makeCircumcircle(p0: Point, p1: Point, p2: Point): Circle|null {
	// Mathematical algorithm from Wikipedia: Circumscribed circle
	let ax: number = p0.x,  ay: number = p0.y;
	let bx: number = p1.x,  by: number = p1.y;
	let cx: number = p2.x,  cy: number = p2.y;
	let ox: number = (Math.min(ax, bx, cx) + Math.max(ax, bx, cx)) / 2;
	let oy: number = (Math.min(ay, by, cy) + Math.max(ay, by, cy)) / 2;
	ax -= ox;  ay -= oy;
	bx -= ox;  by -= oy;
	cx -= ox;  cy -= oy;
	let d: number = (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by)) * 2;
	if (d == 0)
		return null;
	let x: number = ox + ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
	let y: number = oy + ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
	let ra: number = distance(x, y, p0.x, p0.y);
	let rb: number = distance(x, y, p1.x, p1.y);
	let rc: number = distance(x, y, p2.x, p2.y);
	return {x: x, y: y, r: Math.max(ra, rb, rc)};
}


function makeDiameter(p0: Point, p1: Point): Circle {
	let x: number = (p0.x + p1.x) / 2;
	let y: number = (p0.y + p1.y) / 2;
	let r0: number = distance(x, y, p0.x, p0.y);
	let r1: number = distance(x, y, p1.x, p1.y);
	return {x: x, y: y, r: Math.max(r0, r1)};
}


/* Simple mathematical functions */

const MULTIPLICATIVE_EPSILON: number = 1 + 1e-14;

function isInCircle(c: Circle|null, p: Point): boolean {
	return c != null && distance(p.x, p.y, c.x, c.y) <= c.r * MULTIPLICATIVE_EPSILON;
}


// Returns twice the signed area of the triangle defined by (x0, y0), (x1, y1), (x2, y2).
function crossProduct(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): number {
	return (x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0);
}


function distance(x0: number, y0: number, x1: number, y1: number): number {
	return Math.hypot(x0 - x1, y0 - y1);
}
