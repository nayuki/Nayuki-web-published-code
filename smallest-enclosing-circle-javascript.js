/* 
 * Smallest enclosing circle
 * 
 * Copyright (c) 2013 Nayuki Minase. All rights reserved.
 * http://nayuki.eigenstate.org/page/smallest-enclosing-circle-javascript
 */


/* Configuration */

var POINT_RADIUS = 4;
var CIRCLE_COLOR = "#E0E0E0";
var POINT_COLOR = "#000000";


/* Global state */

var canvas = document.getElementById("canvas");

var points = [];
var circle = null;
var suppressContextMenu = false;
var draggingPoint = -1;


/* Event handlers and UI functions */

canvas.onmousedown = function(e) {
	var x = e.pageX - canvas.offsetLeft;
	var y = e.pageY - canvas.offsetTop;
	var nearest = findNearestPoint(x, y);
	
	// Left mouse button: Add or move point
	if (e.button == 0) {
		if (nearest[0] <= POINT_RADIUS + 2) {
			// Start moving existing point
			draggingPoint = nearest[1];
		} else {
			// Add point and start moving it
			draggingPoint = points.length;
			points.push({x: x, y: y});
			circle = makeCircle(points);
			redraw();
		}
	}
	// Right mouse button: Delete point
	else if (e.button == 2) {
		if (nearest[0] <= POINT_RADIUS + 2) {
			points.splice(nearest[1], 1);
			circle = makeCircle(points);
			redraw();
		}
		suppressContextMenu = nearest[0] <= POINT_RADIUS + 10;
	}
}


canvas.onmousemove = function(e) {
	var x = e.pageX - canvas.offsetLeft;
	var y = e.pageY - canvas.offsetTop;
	if (draggingPoint != -1) {
		points[draggingPoint] = {x: x, y: y};
		circle = makeCircle(points);
		redraw();
	}
}


canvas.onmouseup = function(e) {
	var x = e.pageX - canvas.offsetLeft;
	var y = e.pageY - canvas.offsetTop;
	if (e.button == 0) {
		points[draggingPoint] = {x: x, y: y};
		draggingPoint = -1;
		circle = makeCircle(points);
		redraw();
	}
}


// Assumed to be invoked after onmousedown
canvas.oncontextmenu = function() {
	var result = !suppressContextMenu;
	suppressContextMenu = false;
	return result;
}


function doClear() {
	points = [];
	circle = null;
	redraw();
}


function doRandom() {
	points = [];
	var len = Math.floor((1 - Math.sqrt(Math.random())) * 20) + 2;  // 2 to 20, preferring smaller numbers
	for (var i = 0; i < len; i++) {
		var scale = Math.min(canvas.width, canvas.height);
		var r = randomGaussianPair();
		points.push({x: r[0] * scale * 0.15 + canvas.width  / 2,
		             y: r[1] * scale * 0.15 + canvas.height / 2});
	}
	circle = makeCircle(points);
	redraw();
}


function redraw() {
	// Clear
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	
	// Draw circle first
	if (circle != null) {
		ctx.fillStyle = CIRCLE_COLOR;
		ctx.beginPath();
		ctx.arc(circle.x, circle.y, circle.r + POINT_RADIUS, 0, Math.PI * 2, false);
		ctx.fill();
	}
	
	// Draw points on top
	ctx.fillStyle = POINT_COLOR;
	for (var i = 0; i < points.length; i++) {
		ctx.beginPath();
		ctx.arc(points[i].x, points[i].y, POINT_RADIUS, 0, Math.PI * 2, false);
		ctx.fill();
	}
}


function findNearestPoint(x, y) {
	var nearestIndex = -1;
	var nearestDist = Infinity;
	for (var i = 0; i < points.length; i++) {
		var d = distance(points[i].x, points[i].y, x, y);
		if (d < nearestDist) {
			nearestIndex = i;
			nearestDist = d;
		}
	}
	return [nearestDist, nearestIndex];
}


/* Main computation functions */

function makeCircle(points) {
	// Knuth shuffle
	var shuffled = points.slice(0);
	for (var i = points.length - 1; i >= 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		j = Math.max(Math.min(j, i), 0);
		var temp = shuffled[i];
		shuffled[i] = shuffled[j];
		shuffled[j] = temp;
	}
	
	// Incrementally add points to circle
	var c = null;
	for (var i = 0; i < shuffled.length; i++) {
		var p = shuffled[i];
		if (c == null || !isInCircle(c, p.x, p.y))
			c = makeCircleOnePoint(shuffled.slice(0, i + 1), p);
	}
	return c;
}


function makeCircleOnePoint(points, p) {
	var c = {x: p.x, y: p.y, r: 0};
	for (var i = 0; i < points.length; i++) {
		var q = points[i];
		if (!isInCircle(c, q.x, q.y)) {
			if (c.r == 0)
				c = makeDiameter(p, q);
			else
				c = makeCircleTwoPoints(points.slice(0, i + 1), p, q);
		}
	}
	return c;
}


function makeCircleTwoPoints(points, p, q) {
	var temp = makeDiameter(p, q);
	var containsAll = true;
	for (var i = 0; i < points.length; i++)
		containsAll = containsAll && isInCircle(temp, points[i].x, points[i].y);
	if (containsAll)
		return temp;
	
	var left = null;
	var right = null;
	for (var i = 0; i < points.length; i++) {
		var r = points[i];
		var cross = crossProduct(p.x, p.y, q.x, q.y, r.x, r.y);
		var c = makeCircumcircle(p, q, r);
		if (cross > 0 && (left == null || crossProduct(p.x, p.y, q.x, q.y, c.x, c.y) > crossProduct(p.x, p.y, q.x, q.y, left.x, left.y)))
			left = c;
		else if (cross < 0 && (right == null || crossProduct(p.x, p.y, q.x, q.y, c.x, c.y) < crossProduct(p.x, p.y, q.x, q.y, right.x, right.y)))
			right = c;
	}
	return right == null || left != null && left.r <= right.r ? left : right;
}


function makeCircumcircle(p0, p1, p2) {
	// Mathematical algorithm from Wikipedia: Circumscribed circle
	var ax = p0.x, ay = p0.y;
	var bx = p1.x, by = p1.y;
	var cx = p2.x, cy = p2.y;
	var d = (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by)) * 2;
	var x = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
	var y = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
	return {x: x, y: y, r: distance(x, y, ax, ay)};
}


function makeDiameter(p0, p1) {
	return {
		x: (p0.x + p1.x) / 2,
		y: (p0.y + p1.y) / 2,
		r: distance(p0.x, p0.y, p1.x, p1.y) / 2
	};
}


/* Simple mathematical functions */

var EPSILON = 1e-12;

function isInCircle(c, x, y) {
	return c != null && distance(x, y, c.x, c.y) < c.r + EPSILON;
}


// Returns twice the signed area of the triangle defined by (x0, y0), (x1, y1), (x2, y2)
function crossProduct(x0, y0, x1, y1, x2, y2) {
	return (x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0);
}


function distance(x0, y0, x1, y1) {
	return Math.sqrt((x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1));
}


function randomGaussianPair() {
	// Use rejection sampling to pick a point uniformly distributed in the unit circle
	var x, y, magsqr;
	do {
		x = Math.random() * 2 - 1;
		y = Math.random() * 2 - 1;
		magsqr = x * x + y * y;
	} while (magsqr >= 1 || magsqr == 0);
	// Box-Muller transform
	var temp = Math.sqrt(-2 * Math.log(magsqr) / magsqr);
	return [x * temp, y * temp];
}
