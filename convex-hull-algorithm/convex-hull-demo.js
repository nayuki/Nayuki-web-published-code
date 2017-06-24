/* 
 * Convex hull algorithm - Demo (JavaScript)
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

"use strict";


// SVG DOM elements
var svgElem = document.querySelector("article svg");
var offHullGroupElem = svgElem.querySelectorAll("g")[0];
var onHullGroupElem  = svgElem.querySelectorAll("g")[1];
var pathElem = svgElem.querySelector("path");

// Radio button elements
var staticRadio = document.getElementById("random-static");
var movingRadio = document.getElementById("random-moving");
var manualRadio = document.getElementById("manual-position");

// Constants and mutable state
var POINT_RADIUS = 0.012;
var points = [];
var draggingPointIndex = -1;


function initialize() {
	handleRadioButtons();
	
	svgElem.onmousedown = function(ev) { handleMouse(ev, "down"); };
	svgElem.onmousemove = function(ev) { handleMouse(ev, "move"); };
	svgElem.onmouseup   = function(ev) { handleMouse(ev, "up"  ); };
	svgElem.onselectstart = function(ev) { ev.preventDefault(); };
	
	function handleMouse(ev, type) {
		// Calculate SVG coordinates
		var bounds = svgElem.getBoundingClientRect();
		var width  = bounds.width  / Math.min(bounds.width, bounds.height);
		var height = bounds.height / Math.min(bounds.width, bounds.height);
		var evX = ((ev.clientX - bounds.left) / bounds.width  - 0.5) * width ;
		var evY = ((ev.clientY - bounds.top ) / bounds.height - 0.5) * height;
		
		if (type == "down") {
			// Find nearest existing point
			var nearestIndex = -1;
			var nearestDist = Infinity;
			points.forEach(function(point, index) {
				var dist = Math.hypot(point.x - evX, point.y - evY);
				if (dist < nearestDist) {
					nearestDist = dist;
					nearestIndex = index;
				}
			});
			
			if (ev.button == 0) {
				if (nearestIndex != -1 && nearestDist < POINT_RADIUS * 1.5)
					draggingPointIndex = nearestIndex;
				else {
					draggingPointIndex = points.length;
					points.push(null);
				}
				points[draggingPointIndex] = {x: evX, y: evY};
			} else if (ev.button == 2) {
				if (nearestIndex != -1 && nearestDist < POINT_RADIUS * 1.5)
					points.splice(nearestIndex, 1);
				if (nearestDist < POINT_RADIUS * 5) {
					svgElem.oncontextmenu = function(ev) {
						ev.preventDefault();
						svgElem.oncontextmenu = null;
					};
				}
			} else
				return;
			manualRadio.checked = true;
			handleRadioButtons();
			
		} else if (type == "move" || type == "up") {
			if (draggingPointIndex == -1)
				return;
			points[draggingPointIndex] = {x: evX, y: evY};
			if (type == "up")
				draggingPointIndex = -1;
		} else
			throw "Assertion error";
		showPointsAndHull();
	};
}


function handleRadioButtons() {
	staticDemo.stop();
	movingDemo.stop();
	if (staticRadio.checked)
		staticDemo.start();
	if (movingRadio.checked)
		movingDemo.start();
}


var staticDemo = new function() {
	var timeout = null;
	
	this.start = function() {
		var numPoints = Math.round(Math.pow(30, Math.random()) * 3);
		points = [];
		for (var i = 0; i < numPoints; i++) {
			points.push({
				x: randomGaussian() * 0.17,
				y: randomGaussian() * 0.17,
			});
		}
		showPointsAndHull();
		timeout = setTimeout(staticDemo.start, 3000);
	};
	
	this.stop = function() {
		if (timeout != null) {
			clearTimeout(timeout);
			timeout = null;
		}
	};
};


var movingDemo = new function() {
	var prevTime = null;
	var timeout = null;
	
	this.start = function() {
		var numPoints = 15;
		points = [];
		for (var i = 0; i < numPoints; i++) {
			points.push({
				x: randomGaussian() * 0.05,
				y: randomGaussian() * 0.05,
				vx: randomGaussian() * 0.10,
				vy: randomGaussian() * 0.10,
			});
		}
		update(performance.now());
	};
	
	function update(time) {
		showPointsAndHull();
		var dt = Math.min(time - prevTime, 1000) / 1000;
		var bounds = svgElem.getBoundingClientRect()
		var width  = bounds.width  / Math.min(bounds.width, bounds.height);
		var height = bounds.height / Math.min(bounds.width, bounds.height);
		for (var i = 0; i < points.length; i++) {
			var p = points[i];
			p.x += p.vx * dt;
			p.y += p.vy * dt;
			if (Math.abs(p.x) > width / 2 || Math.abs(p.y) > height / 2) {
				points[i] = {
					x: randomGaussian() * 0.05,
					y: randomGaussian() * 0.05,
					vx: randomGaussian() * 0.10,
					vy: randomGaussian() * 0.10,
				};
			}
		}
		prevTime = time;
		timeout = requestAnimationFrame(update);
	}
	
	this.stop = function() {
		prevTime = null;
		if (timeout != null) {
			cancelAnimationFrame(timeout);
			timeout = null;
		}
	};
};


function showPointsAndHull() {
	while (offHullGroupElem.firstChild != null)
		offHullGroupElem.removeChild(offHullGroupElem.firstChild);
	while (onHullGroupElem.firstChild != null)
		onHullGroupElem.removeChild(onHullGroupElem.firstChild);
	
	var hull = convexhull.makeHull(points);
	var s = hull.map(function(point, i) {
		return (i == 0 ? "M" : "L") + point.x + "," + point.y;
	}).join("") + "Z";
	pathElem.setAttribute("d", s);
	
	var hullSet = new Set(hull);
	points.forEach(function(point) {
		var circElem = document.createElementNS(svgElem.namespaceURI, "circle");
		circElem.setAttribute("cx", point.x);
		circElem.setAttribute("cy", point.y);
		circElem.setAttribute("r", POINT_RADIUS);
		if (hullSet.has(point))
			onHullGroupElem.appendChild(circElem);
		else
			offHullGroupElem.appendChild(circElem);
	});
}


function randomGaussian() {
	return Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(Math.random() * Math.PI * 2);
}


if (!("hypot" in Math)) {  // Polyfill
	Math.hypot = function(x, y) {
		return Math.sqrt(x * x + y * y);
	};
}


window.addEventListener("DOMContentLoaded", initialize);
