/* 
 * Simulated annealing on image demo (JavaScript)
 * 
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/simulated-annealing-demo
 */

"use strict";


{
	let imgElem = document.getElementById("sim-anea-image");
	let linkElems = document.querySelectorAll("#sim-anea-table a");
	for (let linkElem of linkElems) {
		ImageSwitcher.register(linkElem, imgElem, null, "mouseover");
		ImageSwitcher.register(linkElem, imgElem, null, "click");
	}
}


let canvas   = document.getElementById("canvas");
let graphics = canvas.getContext("2d");
let width    = null;
let height   = null;
let image    = null;
let pixels   = null;
setImageSize();

let isRunning         = false;
let numIterations     = null;
let startTemperature  = null;
let curIterations     = null;
let curTemperature    = null;
let curEnergy         = null;
let blockOfIterations = null;


function setImageSize() {
	const size = parseInt(document.getElementById("image-size").value, 10);
	width = canvas.width = size;
	height = canvas.height = size;
	image = graphics.createImageData(width, height);
	pixels = image.data;
	
	// Make random image
	for (let i = 0; i < width * height * 4; i++) {
		if (i % 4 != 3)
			pixels[i] = Math.floor(Math.random() * 255);
		else
			pixels[i] = 255;  // Opaque
	}
	graphics.putImageData(image, 0, 0);
}


function startAnnealing() {
	if (isRunning)
		return;
	
	// Calculate energy
	setImageSize();
	curEnergy = 0;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) << 2;
			const r = pixels[i + 0];
			const g = pixels[i + 1];
			const b = pixels[i + 2];
			if (x + 1 < width)
				curEnergy += pixelDiff(r, g, b, i + 4);
			if (y + 1 < height)
				curEnergy += pixelDiff(r, g, b, i + (width << 2));
		}
	}
	
	// Set variables and start
	numIterations = Math.round(parseFloat(document.getElementById("number-iterations").value) * 1000000);
	startTemperature = parseFloat(document.getElementById("start-temperature").value);
	isRunning = true;
	curIterations = 0;
	curTemperature = NaN;
	blockOfIterations = 1;
	doAnnealing();
}


function doAnnealing() {
	const startTime = Date.now();
	for (let i = 0; i < blockOfIterations && curIterations < numIterations; i++, curIterations++) {
		const t = curIterations / numIterations;  // Normalized time from 0.0 to 1.0
		curTemperature = (1 - t) * startTemperature;  // Cooling schedule function
		
		const dir = Math.random() < 0.5;
		let x0, y0, x1, y1;
		if (dir) {  // Horizontal swap with (x + 1, y)
			x0 = Math.floor(Math.random() * (width - 1));
			y0 = Math.floor(Math.random() * height);
			x1 = x0 + 1;
			y1 = y0;
		} else {  // Vertical swap with (x, y + 1)
			x0 = Math.floor(Math.random() * width);
			y0 = Math.floor(Math.random() * (height - 1));
			x1 = x0;
			y1 = y0 + 1;
		}
		const index0 = (y0 * width + x0) << 2;
		const index1 = (y1 * width + x1) << 2;
		const r0 = pixels[index0 + 0];
		const g0 = pixels[index0 + 1];
		const b0 = pixels[index0 + 2];
		const r1 = pixels[index1 + 0];
		const g1 = pixels[index1 + 1];
		const b1 = pixels[index1 + 2];
		let energyDiff = 0;
		
		// Subtract old local energies, then add new
		if (dir) {
			if (x0 > 0) {
				energyDiff -= pixelDiff(r0, g0, b0, index0 - 4);
				energyDiff += pixelDiff(r1, g1, b1, index0 - 4);
			}
			if (x1 + 1 < width) {
				energyDiff -= pixelDiff(r1, g1, b1, index1 + 4);
				energyDiff += pixelDiff(r0, g0, b0, index1 + 4);
			}
			if (y0 > 0) {
				energyDiff -= pixelDiff(r0, g0, b0, index0 - (width << 2));
				energyDiff += pixelDiff(r1, g1, b1, index0 - (width << 2));
				energyDiff -= pixelDiff(r1, g1, b1, index1 - (width << 2));
				energyDiff += pixelDiff(r0, g0, b0, index1 - (width << 2));
			}
			if (y1 + 1 < height) {
				energyDiff -= pixelDiff(r0, g0, b0, index0 + (width << 2));
				energyDiff += pixelDiff(r1, g1, b1, index0 + (width << 2));
				energyDiff -= pixelDiff(r1, g1, b1, index1 + (width << 2));
				energyDiff += pixelDiff(r0, g0, b0, index1 + (width << 2));
			}
		} else {
			if (y0 > 0) {
				energyDiff -= pixelDiff(r0, g0, b0, index0 - (width << 2));
				energyDiff += pixelDiff(r1, g1, b1, index0 - (width << 2));
			}
			if (y1 + 1 < height) {
				energyDiff -= pixelDiff(r1, g1, b1, index1 + (width << 2));
				energyDiff += pixelDiff(r0, g0, b0, index1 + (width << 2));
			}
			if (x0 > 0) {
				energyDiff -= pixelDiff(r0, g0, b0, index0 - 4);
				energyDiff += pixelDiff(r1, g1, b1, index0 - 4);
				energyDiff -= pixelDiff(r1, g1, b1, index1 - 4);
				energyDiff += pixelDiff(r0, g0, b0, index1 - 4);
			}
			if (x1 + 1 < width) {
				energyDiff -= pixelDiff(r0, g0, b0, index0 + 4);
				energyDiff += pixelDiff(r1, g1, b1, index0 + 4);
				energyDiff -= pixelDiff(r1, g1, b1, index1 + 4);
				energyDiff += pixelDiff(r0, g0, b0, index1 + 4);
			}
		}
		
		// Probabilistic conditional acceptance
		if (energyDiff < 0 || Math.random() < Math.pow(2, -energyDiff / curTemperature)) {
			// Accept new image state
			pixels[index0 + 0] = r1;
			pixels[index0 + 1] = g1;
			pixels[index0 + 2] = b1;
			pixels[index1 + 0] = r0;
			pixels[index1 + 1] = g0;
			pixels[index1 + 2] = b0;
			curEnergy += energyDiff;
		}
	}
	
	graphics.putImageData(image, 0, 0);
	document.getElementById("current-iterations").textContent = formatWithThousandsSeparators(curIterations) + " (" + (curIterations / numIterations * 100).toFixed(2) + "%)";
	document.getElementById("current-temperature").textContent = curTemperature.toFixed(2);
	document.getElementById("current-energy").textContent = formatWithThousandsSeparators(curEnergy);
	
	if (isRunning && curIterations < numIterations) {
		// Try to target 30 ms run time
		let factor = 30 / (Date.now() - startTime);
		factor = Math.max(Math.min(factor, 10), 0.1);
		blockOfIterations = Math.max(Math.round(blockOfIterations * factor), 1);
		setTimeout(doAnnealing);
	} else {
		isRunning = false;
		numIterations = null;
		startTemperature = null;
		curIterations = null;
		curTemperature = null;
		curEnergy = null;
		blockOfIterations = null;
	}
}


function formatWithThousandsSeparators(n) {
	let s = n.toString();
	for (let i = s.length - 3; i > 0; i -= 3)
		s = s.substring(0, i) + " " + s.substring(i);
	return s;
}


function pixelDiff(r0, g0, b0, index1) {
	return Math.abs(r0 - pixels[index1    ])
	     + Math.abs(g0 - pixels[index1 + 1])
	     + Math.abs(b0 - pixels[index1 + 2]);
}
