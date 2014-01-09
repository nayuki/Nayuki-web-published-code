/* 
 * Smallest enclosing circle
 * 
 * Copyright (c) 2014 Nayuki Minase
 * All rights reserved. Contact Nayuki for licensing.
 * http://nayuki.eigenstate.org/page/smallest-enclosing-circle
 */

"use strict";


/* Configuration */

var POINT_RADIUS = 4;
var CIRCLE_COLOR = "#E0E0E0";
var POINT_COLOR = "#000000";


/* Global state */

var canvasElem = document.getElementById("canvas");
var canvasPoints = [];
var canvasCircle = null;
var suppressContextMenu = false;
var dragPointIndex = -1;


/* Event handlers and UI functions */

canvasElem.onmousedown = function(e) {
	var x = e.pageX - canvasElem.offsetLeft;
	var y = e.pageY - canvasElem.offsetTop;
	var nearest = findNearestPoint(x, y);
	
	// Left mouse button: Add or move point
	if (e.button == 0) {
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
	else if (e.button == 2) {
		if (nearest.dist <= POINT_RADIUS + 2) {
			canvasPoints.splice(nearest.index, 1);
			refreshCanvasCircle();
		}
		suppressContextMenu = nearest.dist <= POINT_RADIUS + 10;
	}
}


canvasElem.onmousemove = function(e) {
	var x = e.pageX - canvasElem.offsetLeft;
	var y = e.pageY - canvasElem.offsetTop;
	if (dragPointIndex != -1) {
		canvasPoints[dragPointIndex] = {x: x, y: y};
		refreshCanvasCircle();
	}
}


canvasElem.onmouseup = function(e) {
	var x = e.pageX - canvasElem.offsetLeft;
	var y = e.pageY - canvasElem.offsetTop;
	if (e.button == 0) {
		canvasPoints[dragPointIndex] = {x: x, y: y};
		dragPointIndex = -1;
		refreshCanvasCircle();
	}
}


// Assumed to be invoked after onmousedown
canvasElem.oncontextmenu = function() {
	var result = !suppressContextMenu;
	suppressContextMenu = false;
	return result;
}


canvasElem.onselectstart = function() {  // For Google Chrome
	return false;
}


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
	for (var i = 0; i < canvasPoints.length; i++) {
		ctx.beginPath();
		ctx.arc(canvasPoints[i].x, canvasPoints[i].y, POINT_RADIUS, 0, Math.PI * 2, false);
		ctx.fill();
	}
}


function findNearestPoint(x, y) {
	var nearestIndex = -1;
	var nearestDist = Infinity;
	for (var i = 0; i < canvasPoints.length; i++) {
		var d = distance(canvasPoints[i].x, canvasPoints[i].y, x, y);
		if (d < nearestDist) {
			nearestIndex = i;
			nearestDist = d;
		}
	}
	return {dist: nearestDist, index: nearestIndex};
}


/* Simple mathematical functions */

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
