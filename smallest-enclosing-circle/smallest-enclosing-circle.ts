/* 
 * Smallest enclosing circle - Library (TypeScript)
 * 
 * Copyright (c) 2022 Project Nayuki
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


class Point {
	public constructor(
		public x: number,
		public y: number) {}
}


class Circle {
	public constructor(
		public x: number,
		public y: number,
		public r: number) {}
}


/* 
 * Returns the smallest circle that encloses all the given points. Runs in expected O(n) time, randomized.
 * Note: If 0 points are given, null is returned. If 1 point is given, a circle of radius 0 is returned.
 */
// Initially: No boundary points known
function makeCircle<P extends Point>(points: Readonly<Array<P>>): Circle|null {
	// Clone list to preserve the caller's data, do Durstenfeld shuffle
	let shuffled: Array<P> = points.slice();
	for (let i = points.length - 1; i >= 0; i--) {
		let j: number = Math.floor(Math.random() * (i + 1));
		j = Math.max(Math.min(j, i), 0);
		const temp: P = shuffled[i];
		shuffled[i] = shuffled[j];
		shuffled[j] = temp;
	}
	
	// Progressively add points to circle or recompute circle
	let c: Circle|null = null;
	shuffled.forEach((p: Point, i: number) => {
		if (c === null || !isInCircle(c, p))
			c = makeCircleOnePoint(shuffled.slice(0, i + 1), p);
	});
	return c;
}


// One boundary point known
function makeCircleOnePoint<P extends Point>(points: Readonly<Array<P>>, p: Point): Circle {
	let c: Circle = new Circle(p.x, p.y, 0);
	points.forEach((q: Point, i: number) => {
		if (!isInCircle(c, q)) {
			if (c.r == 0)
				c = makeDiameter(p, q);
			else
				c = makeCircleTwoPoints(points.slice(0, i + 1), p, q);
		}
	});
	return c;
}


// Two boundary points known
function makeCircleTwoPoints<P extends Point>(points: Readonly<Array<P>>, p: Point, q: Point): Circle {
	const circ: Circle = makeDiameter(p, q);
	let left : Circle|null = null;
	let right: Circle|null = null;
	
	// For each point not in the two-point circle
	for (const r of points) {
		if (isInCircle(circ, r))
			continue;
		
		// Form a circumcircle and classify it on left or right side
		const cross: number = crossProduct(p.x, p.y, q.x, q.y, r.x, r.y);
		const c: Circle|null = makeCircumcircle(p, q, r);
		if (c === null)
			continue;
		else if (cross > 0 && (left === null || crossProduct(p.x, p.y, q.x, q.y, c.x, c.y) > crossProduct(p.x, p.y, q.x, q.y, left.x, left.y)))
			left = c;
		else if (cross < 0 && (right === null || crossProduct(p.x, p.y, q.x, q.y, c.x, c.y) < crossProduct(p.x, p.y, q.x, q.y, right.x, right.y)))
			right = c;
	}
	
	// Select which circle to return
	if (left === null && right === null)
		return circ;
	else if (left === null && right !== null)
		return right;
	else if (left !== null && right === null)
		return left;
	else if (left !== null && right !== null)
		return left.r <= right.r ? left : right;
	else
		throw new Error("Assertion error");
}


function makeDiameter(a: Point, b: Point): Circle {
	const cx: number = (a.x + b.x) / 2;
	const cy: number = (a.y + b.y) / 2;
	const r0: number = distance(cx, cy, a.x, a.y);
	const r1: number = distance(cx, cy, b.x, b.y);
	return new Circle(cx, cy, Math.max(r0, r1));
}


function makeCircumcircle(a: Point, b: Point, c: Point): Circle|null {
	// Mathematical algorithm from Wikipedia: Circumscribed circle
	const ox: number = (Math.min(a.x, b.x, c.x) + Math.max(a.x, b.x, c.x)) / 2;
	const oy: number = (Math.min(a.y, b.y, c.y) + Math.max(a.y, b.y, c.y)) / 2;
	const ax: number = a.x - ox;  const ay: number = a.y - oy;
	const bx: number = b.x - ox;  const by: number = b.y - oy;
	const cx: number = c.x - ox;  const cy: number = c.y - oy;
	const d: number = (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by)) * 2;
	if (d == 0)
		return null;
	const x: number = ox + ((ax*ax + ay*ay) * (by - cy) + (bx*bx + by*by) * (cy - ay) + (cx*cx + cy*cy) * (ay - by)) / d;
	const y: number = oy + ((ax*ax + ay*ay) * (cx - bx) + (bx*bx + by*by) * (ax - cx) + (cx*cx + cy*cy) * (bx - ax)) / d;
	const ra: number = distance(x, y, a.x, a.y);
	const rb: number = distance(x, y, b.x, b.y);
	const rc: number = distance(x, y, c.x, c.y);
	return new Circle(x, y, Math.max(ra, rb, rc));
}


/* Simple mathematical functions */

const MULTIPLICATIVE_EPSILON: number = 1 + 1e-14;

function isInCircle(c: Circle|null, p: Point): boolean {
	return c !== null && distance(p.x, p.y, c.x, c.y) <= c.r * MULTIPLICATIVE_EPSILON;
}


// Returns twice the signed area of the triangle defined by (x0, y0), (x1, y1), (x2, y2).
function crossProduct(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): number {
	return (x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0);
}


function distance(x0: number, y0: number, x1: number, y1: number): number {
	return Math.hypot(x0 - x1, y0 - y1);
}


if (!("hypot" in Math))  // Polyfill
	Math.hypot = (x: number, y: number) => Math.sqrt(x * x + y * y);
