/* 
 * Smallest enclosing circle
 * 
 * Copyright (c) 2015 Project Nayuki
 * http://www.nayuki.io/page/smallest-enclosing-circle
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

"use strict";


/* Configuration */

var POINT_RADIUS = 4;
var CIRCLE_COLOR = "#E0E0E0";
var POINT_COLOR  = "#000000";


/* Global state */

var canvasElem = document.getElementById("canvas");
var canvasPoints = [];
var canvasCircle = null;
var suppressContextMenu = false;
var dragPointIndex = -1;


/* Event handlers and UI functions */

canvasElem.onmousedown = function(ev) {
	var x = ev.offsetX;
	var y = ev.offsetY;
	var nearest = findNearestPoint(x, y);
	
	// Left mouse button: Add or move point
	if (ev.button == 0) {
		if (nearest.dist <= POINT_RADIUS + 2) {
			// Start moving existing point
			dragPointIndex = nearest.index;
		} else {
			// Add point and start moving it
			dragPointIndex = canvasPoints.length;
			canvasPoints.push({x: x, y: y});
			refreshCanvasCircle();
		}
	}
	// Right mouse button: Delete point
	else if (ev.button == 2) {
		if (nearest.dist <= POINT_RADIUS + 2) {
			canvasPoints.splice(nearest.index, 1);
			refreshCanvasCircle();
		}
		suppressContextMenu = nearest.dist <= POINT_RADIUS + 10;
	}
};


canvasElem.onmousemove = function(ev) {
	if (dragPointIndex != -1) {
		canvasPoints[dragPointIndex] = {x: ev.offsetX, y: ev.offsetY};
		refreshCanvasCircle();
	}
};


canvasElem.onmouseup = function(ev) {
	if (ev.button == 0) {
		canvasPoints[dragPointIndex] = {x: ev.offsetX, y: ev.offsetY};
		dragPointIndex = -1;
		refreshCanvasCircle();
	}
};


// Assumed to be invoked after onmousedown.
canvasElem.oncontextmenu = function() {
	var result = !suppressContextMenu;
	suppressContextMenu = false;
	return result;
};


canvasElem.onselectstart = function() {  // For Google Chrome
	return false;
};


function doClear() {
	canvasPoints = [];
	refreshCanvasCircle();
}


function doRandom() {
	var scale = Math.min(canvasElem.width, canvasElem.height);
	canvasPoints = [];
	var len = Math.floor((1 - Math.sqrt(Math.random())) * 20) + 2;  // 2 to 20, preferring smaller numbers
	for (var i = 0; i < len; i++) {
		var r = randomGaussianPair();
		canvasPoints.push({
			x: r[0] * scale * 0.15 + canvasElem.width  / 2,
			y: r[1] * scale * 0.15 + canvasElem.height / 2});
	}
	refreshCanvasCircle();
}


function refreshCanvasCircle() {
	// Recompute circle
	canvasCircle = makeCircle(canvasPoints);
	
	// Clear
	var ctx = canvasElem.getContext("2d");
	ctx.clearRect(0, 0, canvasElem.width, canvasElem.height);
	
	// Draw circle first
	if (canvasCircle != null) {
		ctx.fillStyle = CIRCLE_COLOR;
		ctx.beginPath();
		ctx.arc(canvasCircle.x, canvasCircle.y, canvasCircle.r + POINT_RADIUS, 0, Math.PI * 2, false);
		ctx.fill();
	}
	
	// Draw points on top
	ctx.fillStyle = POINT_COLOR;
	canvasPoints.forEach(function(point) {
		ctx.beginPath();
		ctx.arc(point.x, point.y, POINT_RADIUS, 0, Math.PI * 2, false);
		ctx.fill();
	});
}


function findNearestPoint(x, y) {
	var nearestIndex = -1;
	var nearestDist = Infinity;
	canvasPoints.forEach(function(point, i) {
		var d = distance(point.x, point.y, x, y);
		if (d < nearestDist) {
			nearestIndex = i;
			nearestDist = d;
		}
	});
	return {dist: nearestDist, index: nearestIndex};
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
