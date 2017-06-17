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
var gElem0 = svgElem.querySelectorAll("g")[0];
var gElem1 = svgElem.querySelectorAll("g")[1];
var pathElem = svgElem.querySelector("path");

var staticRadio = document.getElementById("random-static");
var movingRadio = document.getElementById("random-moving");

var heightRatio;
var POINT_RADIUS = 0.008;


function initialize() {
	var boundRect = svgElem.getBoundingClientRect();
	heightRatio = boundRect.height / boundRect.width;
	svgElem.setAttribute("viewBox", "0 0 1 " + heightRatio);
	handleRadioButtons();
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
		var points = [];
		for (var i = 0; i < numPoints; i++) {
			points.push({
				x: randomGaussian() * 0.08 + 0.5,
				y: randomGaussian() * 0.08 + heightRatio / 2,
			});
		}
		showPointsAndHull(points, convexhull.makeHull(points));
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
	var points = null;
	var prevTime = null;
	var timeout = null;
	
	this.start = function() {
		points = [];
		for (var i = 0; i < 15; i++) {
			points.push({
				x: randomGaussian() * 0.05 + 0.5,
				y: randomGaussian() * 0.05 + heightRatio / 2,
				vx: randomGaussian() * 0.05,
				vy: randomGaussian() * 0.05,
			});
		}
		update(performance.now());
	};
	
	function update(time) {
		showPointsAndHull(points, convexhull.makeHull(points));
		var dt = Math.min(time - prevTime, 1000) / 1000;
		for (var i = 0; i < points.length; i++) {
			var p = points[i];
			p.x += p.vx * dt;
			p.y += p.vy * dt;
			if (p.x < 0 || p.x > 1 || p.y < 0 || p.y > heightRatio) {
				points[i] = {
					x: randomGaussian() * 0.1 + 0.5,
					y: randomGaussian() * 0.1 + heightRatio / 2,
					vx: randomGaussian() * 0.05,
					vy: randomGaussian() * 0.05,
				};
			}
		}
		prevTime = time;
		timeout = requestAnimationFrame(update);
	}
	
	this.stop = function() {
		points = [];
		prevTime = null;
		if (timeout != null) {
			cancelAnimationFrame(timeout);
			timeout = null;
		}
	};
};


function showPointsAndHull(points, hull) {
	while (gElem0.firstChild != null)
		gElem0.removeChild(gElem0.firstChild);
	while (gElem1.firstChild != null)
		gElem1.removeChild(gElem1.firstChild);
	
	var hullSet = new Set(hull);
	points.forEach(function(point) {
		var circElem = document.createElementNS(svgElem.namespaceURI, "circle");
		circElem.setAttribute("cx", point.x);
		circElem.setAttribute("cy", point.y);
		circElem.setAttribute("r", POINT_RADIUS);
		if (hullSet.has(point))
			gElem1.appendChild(circElem);
		else
			gElem0.appendChild(circElem);
	});
	
	var s = hull.map(function(point, i) {
		return (i == 0 ? "M" : "L") + point.x + "," + point.y;
	}).join("") + "Z";
	pathElem.setAttribute("d", s);
}


function randomGaussian() {
	return Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(Math.random() * Math.PI * 2);
}


window.addEventListener("DOMContentLoaded", initialize);
