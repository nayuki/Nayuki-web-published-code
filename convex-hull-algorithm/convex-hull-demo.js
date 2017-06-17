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

// Constants
var HEIGHT_RATIO = 0.6;
var POINT_RADIUS = 0.008;


function initialize() {
	svgElem.setAttribute("viewBox", "0 0 1 " + HEIGHT_RATIO);
	setInterval(doRandomDemo, 3000);
	doRandomDemo();
}


function doRandomDemo() {
	var numPoints = Math.round(Math.pow(30, Math.random()) * 3);
	var points = [];
	for (var i = 0; i < numPoints; i++) {
		points.push({
			x: Math.random(),
			y: Math.random() * HEIGHT_RATIO,
		});
	}
	showPointsAndHull(points, convexhull.makeHull(points));
}


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


initialize();
