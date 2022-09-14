/* 
 * Symmetry sketcher
 * 
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/symmetry-sketcher-javascript
 */

"use strict";


/*---- Global variables ----*/

// HTML elements
var canvasElem     = element("canvas");
var undoButtonElem = element("undo-button");
var doneButtonElem = element("done-button");

// Graphics initialization
var width  = null;
var height = null;
var baseCanvas  = document.createElement('canvas');  // Off-screen
var guideCanvas = document.createElement('canvas');  // Off-screen
var baseGfx   = baseCanvas .getContext("2d");
var guideGfx  = guideCanvas.getContext("2d");
var screenGfx = canvasElem .getContext("2d");
initCanvasesSize();

// Cached values from form inputs
var strokeWidth      = null;  // Type number, positive
var paintColor       = null;  // Type string
var backgroundColor  = null;  // Type string
var rotationSymmetry = null;  // Type integer, positive
var mirrorSymmetry   = null;  // Type boolean
var showGuidelines   = null;  // Type boolean

// State variables
var isDone = true;
var isMouseDown = false;
var lastCoord = null;  // Is null iff isMouseDown is false
var undoImages = [];
undoButtonElem.disabled = undoImages.length == 0;

// Internal configuration
const MAX_UNDO_IMAGES = 5;


function initCanvasesSize() {
	width = height = parseInt(document.getElementById("canvas-size").value, 10);
	canvasElem.width  = guideCanvas.width  = baseCanvas.width  = width;
	canvasElem.height = guideCanvas.height = baseCanvas.height = height;
	guideGfx.strokeStyle = "#C0C0FF";
}



/*---- Drawing functions ----*/

// Refreshes the on-screen canvas, and draws onto it a cursor centered at the given coordinates.
function drawHover(x, y) {
	screenGfx.drawImage(guideCanvas, 0, 0);
	screenGfx.fillStyle = backgroundColor;
	const temp = strokeWidth;
	strokeWidth *= 1.2;
	drawPoint(screenGfx, x, y);
	strokeWidth = temp;
	screenGfx.fillStyle = paintColor;
	drawPoint(screenGfx, x, y);
	
	const crossSize = Math.max(strokeWidth * 2.5, 10);
	screenGfx.lineWidth = Math.max(strokeWidth / 8, 1);
	screenGfx.beginPath();
	screenGfx.moveTo(x - crossSize / 2, y);
	screenGfx.lineTo(x + crossSize / 2, y);
	screenGfx.moveTo(x, y - crossSize / 2);
	screenGfx.lineTo(x, y + crossSize / 2);
	screenGfx.stroke();
}


// Symmetrizes the point at the given coordinates, and draws them on the given
// graphics context,using the global stroke width and the graphics context's stroke style.
function drawPoint(gfx, x, y) {
	for (const coord of getSymmetryPoints(x, y)) {
		gfx.beginPath();
		gfx.arc(coord[0], coord[1], strokeWidth / 2, 0, Math.PI * 2, false);
		gfx.fill();
	}
}


// Symmetrizes the line between the given coordinates, and draws them on the given
// graphics context, using the global stroke width and the graphics context's stroke style.
function drawLine(gfx, x0, y0, x1, y1) {
	const starts = getSymmetryPoints(x0, y0);
	const ends   = getSymmetryPoints(x1, y1);
	gfx.lineWidth = strokeWidth;
	gfx.beginPath();
	for (var i = 0; i < starts.length; i++) {
		gfx.moveTo(starts[i][0], starts[i][1]);
		gfx.lineTo(ends  [i][0], ends  [i][1]);
	}
	gfx.stroke();
}


// Returns an array of pairs representing the symmetries of the given point coordinates,
// based on the current global rotation symmetry and mirror settings.
function getSymmetryPoints(x, y) {
	// The coordinate system has its origin at the center of the canvas,
	// has up as 0 degrees, right as 90 deg, down as 180 deg, and left as 270 deg.
	const ctrX = width  / 2;
	const ctrY = height / 2;
	const relX = x - ctrX;
	const relY = ctrY - y;
	const dist  = Math.hypot(relX, relY);
	const angle = Math.atan2(relX, relY);  // Radians
	var result = [];
	for (var i = 0; i < rotationSymmetry; i++) {
		const theta = angle + Math.PI * 2 / rotationSymmetry * i;  // Radians
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


// Refreshes the guide canvas based on the base canvas, and draws guidelines if enabled.
function redrawGuideCanvas() {
	guideGfx.drawImage(baseCanvas, 0, 0);
	if (!showGuidelines)
		return;
	
	const halfwidth  = width  / 2;
	const halfheight = height / 2;
	guideGfx.lineWidth = 1;
	guideGfx.beginPath();
	const dist = Math.min(halfwidth, halfheight);
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
	baseGfx.strokeStyle   = paintColor;
	baseGfx.fillStyle     = paintColor;
	screenGfx.strokeStyle = paintColor;
	screenGfx.fillStyle   = paintColor;
}


// Clears the base canvas, redraws the guide canvas, and redraws the on-screen canvas.
function clearBaseCanvas() {
	baseGfx.fillStyle = backgroundColor;
	baseGfx.fillRect(0, 0, width, height);
	baseGfx.fillStyle = paintColor;
	redrawGuideCanvas();
	screenGfx.drawImage(guideCanvas, 0, 0);
}


function getLocalCoordinates(ev) {
	return [ev.offsetX + 0.5, ev.offsetY + 0.5];
}



/*---- Event handlers ----*/

// Handlers for canvas element

canvasElem.onmouseover = ev => {
	if (isDone)
		return;
	const coord = getLocalCoordinates(ev);
	drawHover(coord[0], coord[1]);
};

canvasElem.onmousemove = ev => {
	if (isDone)
		return;
	const coord = getLocalCoordinates(ev);
	if (isMouseDown) {
		drawPoint(baseGfx, coord[0], coord[1]);
		if (lastCoord !== null)
			drawLine(baseGfx, coord[0], coord[1], lastCoord[0], lastCoord[1]);
		redrawGuideCanvas();
		lastCoord = coord;
	}
	drawHover(coord[0], coord[1]);
};

canvasElem.onmouseout = () => {
	if (isDone)
		return;
	screenGfx.drawImage(guideCanvas, 0, 0);
	canvasElem.onmouseup();
};

canvasElem.onmousedown = ev => {
	if (!isDone && !isMouseDown) {
		undoImages.push(baseGfx.getImageData(0, 0, width, height));
		if (undoImages.length > MAX_UNDO_IMAGES)
			undoImages.splice(0, undoImages.length - MAX_UNDO_IMAGES);
		undoButtonElem.disabled = undoImages.length == 0;
		isMouseDown = true;
		const coord = getLocalCoordinates(ev);
		drawPoint(baseGfx, coord[0], coord[1]);
		redrawGuideCanvas();
		drawHover(coord[0], coord[1]);
		lastCoord = coord;
	}
};

canvasElem.onmouseup = () => {
	isMouseDown = false;
	lastCoord = null;
};

canvasElem.onwheel = ev => {
	if (isDone)
		return;
	if (!isMouseDown && !isNaN(strokeWidth)) {
		// Scroll up to increase stroke width, down to decrease
		const step = -ev.deltaY / Math.abs(ev.deltaY);  // Signum
		strokeWidth *= Math.pow(10, step / 10);
		strokeWidth = Math.max(strokeWidth, 0.1);
		strokeWidth = Math.min(strokeWidth, 300);
		element("stroke-width").value = strokeWidth.toFixed(2);
		const coord = getLocalCoordinates(ev);
		drawHover(coord[0], coord[1]);
	}
	return false;
};

canvasElem.oncontextmenu = () => {
	if (!isDone)
		return false;
};


// Handlers for form input elements

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
	redrawGuideCanvas();
	screenGfx.drawImage(guideCanvas, 0, 0);
});

setAndCallHandler("mirror-symmetry", "onchange", function() {
	mirrorSymmetry = this.checked;
	redrawGuideCanvas();
	screenGfx.drawImage(guideCanvas, 0, 0);
});

setAndCallHandler("show-guidelines", "onchange", function() {
	showGuidelines = this.checked;
	redrawGuideCanvas();
	screenGfx.drawImage(guideCanvas, 0, 0);
});


// Handlers for button elements

element("clear-button").onclick = () => {
	if (confirm("Clear the drawing?")) {
		initCanvasesSize();
		updatePaintColor();
		clearBaseCanvas();
		if (isDone)
			doneButtonElem.onclick();
		undoImages = [];
		undoButtonElem.disabled = true;
	}
};

undoButtonElem.onclick = () => {
	baseGfx.putImageData(undoImages.pop(), 0, 0);
	undoButtonElem.disabled = undoImages.length == 0;
	redrawGuideCanvas();
	screenGfx.drawImage(guideCanvas, 0, 0);
};

doneButtonElem.onclick = () => {
	if (isDone) {
		doneButtonElem.value = "Done";
		isDone = false;
		canvasElem.style.removeProperty("cursor");
	} else {
		doneButtonElem.value = "Resume";
		isDone = true;
		undoImages = [];
		undoButtonElem.disabled = true;
		screenGfx.drawImage(baseCanvas, 0, 0);
		canvasElem.style.cursor = "unset";
	}
};

document.onkeydown = ev => {
	if (!isMouseDown && undoImages.length > 0 && ev.key == "z" && ev.ctrlKey) {
		undoButtonElem.onclick();
		return false;
	}
};

// For the text boxes, confine keystrokes to the element itself and not propagate to the document root
(function() {
	for (let elem of document.getElementsByTagName("input"))
		elem.onkeypress = ev => ev.stopPropagation();
})();



/*---- Utilities and initialization ----*/

function setAndCallHandler(elemName, eventName, func) {
	var elem = element(elemName);
	elem[eventName] = func;
	func.call(elem);
}


function element(name) {
	var result = document.getElementById(name);
	if (result === null)
		throw new RangeError("Element ID not found: " + name);
	return result;
}


// Polyfill
if (!("hypot" in Math)) {
	Math.hypot = function(x, y) {
		return Math.sqrt(x * x + y * y);
	};
}


clearBaseCanvas();
doneButtonElem.onclick();
