/* 
 * Symmetry sketcher
 * 
 * Copyright (c) 2015 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * http://www.nayuki.io/page/symmetry-sketcher-javascript
 */

"use strict";


/*---- Global variables ----*/

// HTML elements
var mainCanvasElem      = element("main-canvas"     );
var guideCanvasElem     = element("guide-canvas"    );
var hoverCanvasElem     = element("hover-canvas"    );
var canvasContainerElem = element("canvas-container");
var undoButtonElem      = element("undo-button"     );
var doneButtonElem      = element("done-button"     );
undoButtonElem.disabled = true;  // Invariant: This is true iff undoImages.length == 0
doneButtonElem.value = "Done";

// Graphics initialization
var mainGfx  = mainCanvasElem .getContext("2d");
var guideGfx = guideCanvasElem.getContext("2d");
var hoverGfx = hoverCanvasElem.getContext("2d");

// Cached values from form inputs
var strokeWidth      = null;  // Type number, positive
var paintColor       = null;  // Type string
var backgroundColor  = null;  // Type string
var rotationSymmetry = null;  // Type integer, positive
var mirrorSymmetry   = null;  // Type boolean
var showGuidelines   = null;  // Type boolean

// State variables
var isMouseDown = false;
var lastCoord = null;  // Is null iff isMouseDown is false
var undoImages = [];

// Internal configuration
var MAX_UNDO_IMAGES = 5;
guideGfx.strokeStyle = "#C0C0FF";



/*---- Drawing functions ----*/

function drawHover(x, y) {
	hoverGfx.clearRect(0, 0, hoverCanvasElem.width, hoverCanvasElem.height);
	hoverGfx.fillStyle = backgroundColor;
	var temp = strokeWidth;
	strokeWidth *= 1.2;
	drawPoint(hoverGfx, x, y);
	strokeWidth = temp;
	hoverGfx.fillStyle = paintColor;
	drawPoint(hoverGfx, x, y);
	
	var crossSize = Math.max(strokeWidth * 2.5, 10);
	hoverGfx.lineWidth = Math.max(strokeWidth / 8, 1);
	hoverGfx.beginPath();
	hoverGfx.moveTo(x - crossSize / 2, y);
	hoverGfx.lineTo(x + crossSize / 2, y);
	hoverGfx.moveTo(x, y - crossSize / 2);
	hoverGfx.lineTo(x, y + crossSize / 2);
	hoverGfx.stroke();
}


function drawPoint(gfx, x, y) {
	getSymmetryPoints(x, y).forEach(function(coord) {
		gfx.beginPath();
		gfx.arc(coord[0], coord[1], strokeWidth / 2, 0, Math.PI * 2, false);
		gfx.fill();
	});
}


function drawLine(gfx, x0, y0, x1, y1) {
	var starts = getSymmetryPoints(x0, y0);
	var ends   = getSymmetryPoints(x1, y1);
	gfx.lineWidth = strokeWidth;
	gfx.beginPath();
	for (var i = 0; i < starts.length; i++) {
		gfx.moveTo(starts[i][0], starts[i][1]);
		gfx.lineTo(ends  [i][0], ends  [i][1]);
	}
	gfx.stroke();
}


function getSymmetryPoints(x, y) {
	// The coordinate system has its origin at the center of the canvas,
	// has up as 0 degrees, right as 90 deg, down as 180 deg, and left as 270 deg.
	var ctrX = mainCanvasElem.width  / 2;
	var ctrY = mainCanvasElem.height / 2;
	var relX = x - ctrX;
	var relY = ctrY - y;
	var dist  = Math.hypot(relX, relY);
	var angle = Math.atan2(relX, relY);  // Radians
	var result = [];
	for (var i = 0; i < rotationSymmetry; i++) {
		var theta = angle + Math.PI * 2 / rotationSymmetry * i;  // Radians
		x = ctrX + Math.sin(theta) * dist;
		y = ctrY - Math.cos(theta) * dist;
		result.push([x, y]);
		if (mirrorSymmetry) {
			x = ctrX - Math.sin(theta) * dist;
			result.push([x, y]);
		}
	}
	return result;
}


function drawGuidelines() {
	guideGfx.clearRect(0, 0, guideCanvasElem.width, guideCanvasElem.height);
	if (!showGuidelines)
		return;
	
	var halfwidth  = guideCanvasElem.width  / 2;
	var halfheight = guideCanvasElem.height / 2;
	guideGfx.clearRect(0, 0, halfwidth * 2, halfheight * 2);
	guideGfx.lineWidth = 1;
	guideGfx.beginPath();
	var dist = Math.min(halfwidth, halfheight);
	guideGfx.arc(halfwidth, halfwidth, dist, Math.PI * 2, false);
	guideGfx.stroke();
	
	guideGfx.beginPath();
	guideGfx.moveTo(halfwidth, halfwidth);
	var theta = mirrorSymmetry ? 0 : -Math.PI / rotationSymmetry;  // Radians
	var x = halfwidth  + Math.sin(theta) * dist;
	var y = halfheight - Math.cos(theta) * dist;
	guideGfx.lineTo(x, y);
	
	guideGfx.moveTo(halfwidth, halfwidth);
	theta = Math.PI / rotationSymmetry;  // Radians
	x = halfwidth  + Math.sin(theta) * dist;
	y = halfheight - Math.cos(theta) * dist;
	guideGfx.lineTo(x, y);
	guideGfx.stroke();
}


function updatePaintColor() {
	mainGfx.strokeStyle  = paintColor;
	mainGfx.fillStyle    = paintColor;
	hoverGfx.strokeStyle = paintColor;
	hoverGfx.fillStyle   = paintColor;
}


function clearMainCanvas() {
	mainGfx.fillStyle = backgroundColor;
	mainGfx.fillRect(0, 0, mainCanvasElem.width, mainCanvasElem.height);
	mainGfx.fillStyle = paintColor;
}


function getLocalCoordinates(ev) {
	return [ev.offsetX + 0.5, ev.offsetY + 0.5];
}



/*---- Event handlers ----*/

// Handlers for canvas element

hoverCanvasElem.onmouseover = function(ev) {
	var coord = getLocalCoordinates(ev);
	drawHover(coord[0], coord[1]);
};

hoverCanvasElem.onmousemove = function(ev) {
	var coord = getLocalCoordinates(ev);
	drawHover(coord[0], coord[1]);
	if (isMouseDown) {
		drawPoint(mainGfx, coord[0], coord[1]);
		if (lastCoord != null)
			drawLine(mainGfx, coord[0], coord[1], lastCoord[0], lastCoord[1]);
		lastCoord = coord;
	}
};

hoverCanvasElem.onmouseout = function() {
	hoverGfx.clearRect(0, 0, hoverCanvasElem.width, hoverCanvasElem.height);
	this.onmouseup();
};

hoverCanvasElem.onmousedown = function(ev) {
	if (!isMouseDown) {
		undoImages.push(mainGfx.getImageData(0, 0, mainCanvasElem.width, mainCanvasElem.height));
		if (undoImages.length > MAX_UNDO_IMAGES)
			undoImages.splice(0, undoImages.length - MAX_UNDO_IMAGES);
		undoButtonElem.disabled = undoImages.length == 0;
		isMouseDown = true;
		var coord = getLocalCoordinates(ev);
		drawPoint(mainGfx, coord[0], coord[1]);
		lastCoord = coord;
	}
};

hoverCanvasElem.onmouseup = function() {
	isMouseDown = false;
	lastCoord = null;
};

hoverCanvasElem.onwheel = function(ev) {
	if (!isMouseDown && !isNaN(strokeWidth)) {
		// Scroll up to increase stroke width, down to decrease
		var step = -ev.deltaY / Math.abs(ev.deltaY);
		strokeWidth *= Math.pow(10, step / 10);
		strokeWidth = Math.max(strokeWidth, 0.1);
		strokeWidth = Math.min(strokeWidth, 300);
		element("stroke-width").value = strokeWidth.toFixed(2);
		var coord = getLocalCoordinates(ev);
		drawHover(coord[0], coord[1]);
	}
	return false;
};

hoverCanvasElem.oncontextmenu = function() {
	return false;
};


// Handlers for input form elements

setAndCallHandler("stroke-width", "oninput", function() {
	strokeWidth = parseFloat(this.value);
});

setAndCallHandler("paint-color", "oninput", function() {
	paintColor = this.value;
	updatePaintColor();
});

setAndCallHandler("background-color", "oninput", function() {
	backgroundColor = this.value;
});

setAndCallHandler("rotation-symmetry", "oninput", function() {
	rotationSymmetry = parseInt(this.value, 10);
	drawGuidelines();
});

setAndCallHandler("mirror-symmetry", "onchange", function() {
	mirrorSymmetry = this.checked;
	drawGuidelines();
});

setAndCallHandler("show-guidelines", "onchange", function() {
	showGuidelines = this.checked;
	drawGuidelines();
});


element("clear-button").onclick = function() {
	if (confirm("Clear the drawing?")) {
		clearMainCanvas();
		canvasContainerElem.className = "";
		doneButtonElem.value = "Done";
		undoImages = [];
		undoButtonElem.disabled = true;
	}
};

undoButtonElem.onclick = function() {
	mainGfx.putImageData(undoImages.pop(), 0, 0);
	this.disabled = undoImages.length == 0;
};

doneButtonElem.onclick = function() {
	if (this.value == "Done") {
		canvasContainerElem.className = "done";
		this.value = "Resume";
		undoImages = [];
		undoButtonElem.disabled = true;
	} else {
		canvasContainerElem.className = "";
		this.value = "Done";
	}
};

document.documentElement.onkeypress = function(ev) {
	if (!isMouseDown && undoImages.length > 0 && ev.key == "z" && ev.ctrlKey) {
		undoButtonElem.onclick();
		return false;
	}
};

(function() {
	var elems = document.getElementsByTagName("input");
	for (var i = 0; i < elems.length; i++)
		elems[i].onkeypress = function(ev) { ev.stopPropagation(); };
})();



/*---- Utilities and initialization ----*/

function setAndCallHandler(elemName, eventName, func) {
	var elem = element(elemName);
	elem[eventName] = func;
	func.call(elem);
}


function element(name) {
	var result = document.getElementById(name);
	if (result == null)
		throw "Element ID not found: " + name;
	return result;
}


clearMainCanvas();
