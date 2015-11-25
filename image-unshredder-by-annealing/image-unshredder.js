/* 
 * Image unshredder demo (JavaScript)
 * 
 * Copyright (c) 2015 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * http://www.nayuki.io/page/image-unshredder-by-annealing
 */

"use strict";


/*---- Global variables and initialization ----*/

// Canvas element
var canvasElem = document.getElementById("canvas");
var graphics = canvasElem.getContext("2d");

// Button elements
var shuffleButton = document.getElementById("shuffle-button");
var annealButton  = document.getElementById("anneal-button");
var stopButton    = document.getElementById("stop-button");
shuffleButton.disabled = true;
annealButton .disabled = true;
stopButton   .disabled = true;
shuffleButton.onclick = doShuffle;
annealButton .onclick = doAnneal;
stopButton   .onclick = doStop;

// Text nodes
var curIterationsText  = document.createTextNode("\u2012");
var curTemperatureText = document.createTextNode("\u2012");
var curEnergyText      = document.createTextNode("\u2012");
document.getElementById("current-iterations" ).appendChild(curIterationsText );
document.getElementById("current-temperature").appendChild(curTemperatureText);
document.getElementById("current-energy"     ).appendChild(curEnergyText     );

// List of images and selection logic
var IMAGE_LIST = [
	["Abstract Light Painting", "abstract-light-painting.png", "Alexander Nie", "https://www.flickr.com/photos/niephotography/15821646318/"],
	["Alaska Railroad", "alaska-railroad.png", "Luke Jones", "https://www.flickr.com/photos/befuddledsenses/7392384974/"],
	["Blue Hour in Paris", "blue-hour-paris.png", "Falcon\u00AE Photography", "https://www.flickr.com/photos/falcon_33/15178077733/"],
];
var imageAttributionElem = document.getElementById("image-attribution");
var imageSelectElem = document.getElementById("image-select");
imageSelectElem.disabled = false;
imageSelectElem.onchange = function() {
	selectImage(imageSelectElem.selectedIndex);
};
while (imageSelectElem.firstChild != null)
	imageSelectElem.removeChild(imageSelectElem.firstChild);
IMAGE_LIST.forEach(function(entry) {
	var option = document.createElement("option");
	option.appendChild(document.createTextNode(entry[0]));
	imageSelectElem.appendChild(option);
});
function selectImage(index) {
	isImageLoaded = false;
	width = -1;
	height = -1;
	shuffleButton.disabled = true;
	annealButton .disabled = true;
	stopButton   .disabled = true;
	var entry = IMAGE_LIST[index];
	baseImage.src = "/res/image-unshredder-by-annealing/" + entry[1];
	while (imageAttributionElem.firstChild != null)
		imageAttributionElem.removeChild(imageAttributionElem.firstChild);
	imageAttributionElem.appendChild(document.createTextNode("by " + entry[2]));
	imageAttributionElem.href = entry[3];
}

// Base image
var isImageLoaded = false;
var width = -1;
var height = -1;
var baseImage = new Image();
baseImage.onload = function() {
	var img = baseImage;
	width = img.width;
	height = img.height;
	canvasElem.width = width;
	canvasElem.height = height;
	graphics.drawImage(img, 0, 0, width, height);
	isImageLoaded = true;
	shuffleButton.disabled = false;
	shuffleStartColumn = 0;
	shuffledImage = null;
	columnDiffs = null;
};
imageSelectElem.selectedIndex = 1;
imageSelectElem.onchange();

// Operation state/progress
var shuffleStartColumn = -1;
var shuffledImage = null;

var numIterations = -1;
var startTemperature = -1;
var curIteration = -1;
var curEnergy = -1;
var columnDiffs = null;  // columnDiffs[x0][x1] is the amount of difference between column x0 and column x1 in shuffledImage
var colPermutation = null;
var annealingLastDrawTime = null;



/*---- Main functions ----*/

function doStop() {
	shuffleStartColumn = width;
	curIteration = -1;
}


function doShuffle() {
	if (shuffleStartColumn == 0) {
		shuffleButton.disabled = true;
		annealButton.disabled = true;
		stopButton.disabled = false;
		imageSelectElem.disabled = true;
		graphics.drawImage(baseImage, 0, 0, width, height);
		shuffledImage = graphics.getImageData(0, 0, width, height);
	}
	
	var startTime = Date.now();
	var pixels = shuffledImage.data;
	while (shuffleStartColumn < width) {
		var i = shuffleStartColumn;
		var j = i + Math.floor(Math.random() * (width - i));
		for (var y = 0; y < height; y++) {
			for (var x = j - 1; x >= i; x--) {
				var off = (y * width + x) * 4;
				for (var k = 0; k < 4; k++) {
					var temp = pixels[off + k];
					pixels[off + k] = pixels[off + 4 + k];
					pixels[off + 4 + k] = temp;
				}
			}
		}
		shuffleStartColumn++;
		if (Date.now() - startTime > 20)
			break;
	}
	
	graphics.putImageData(shuffledImage, 0, 0);
	if (shuffleStartColumn < width)
		setTimeout(doShuffle, 0);
	else {
		shuffleButton.disabled = false;
		annealButton.disabled = false;
		stopButton.disabled = true;
		imageSelectElem.disabled = false;
		shuffleStartColumn = 0;
		curIteration = 0;
		curEnergy = -1;
		columnDiffs = null;
	}
}


function doAnneal() {
	if (curIteration == 0) {  // Initialize the annealing
		shuffleButton.disabled = true;
		annealButton.disabled = true;
		stopButton.disabled = false;
		imageSelectElem.disabled = true;
		numIterations = Math.round(parseFloat(document.getElementById("number-iterations").value) * 1000000);
		startTemperature = Math.round(parseFloat(document.getElementById("start-temperature").value));
		
		if (columnDiffs == null) {
			columnDiffs = [];
			var pixels = shuffledImage.data;
			for (var i = 0; i < width; i++) {
				var entry = new Uint32Array(width);
				for (var j = 0; j < width; j++) {
					if (i <= j)
						entry[j] = lineDiff(pixels, width, height, i, j);
					else
						entry[j] = columnDiffs[j][i];
				}
				columnDiffs.push(entry);
			}
		}
		
		curEnergy = 0;
		for (var i = 0; i < width - 1; i++)
			curEnergy += columnDiffs[i][i + 1];
		colPermutation = [];
		for (var i = 0; i < width; i++)
			colPermutation.push(i);
		annealingLastDrawTime = Date.now();
	
	} else if (curIteration == -1) {  // Stop requested
		curIteration = 0;
		colPermutation = null;
		shuffleButton.disabled = false;
		annealButton.disabled = false;
		stopButton.disabled = true;
		imageSelectElem.disabled = false;
		return;
	}
	
	var startTime = Date.now();
	var t;
	var temperature;
	var perm = colPermutation;
	while (curIteration < numIterations) {
		t = curIteration / numIterations;
		temperature = (1 - t) * startTemperature;
		
		// Randomly choose two distinct columns
		var col0 = Math.floor(Math.random() * width);
		var col1 = Math.floor(Math.random() * width);
		if (col0 != col1) {
			// Calculate the change in energy if the col0 was removed and inserted at col1
			var energyDiff = 0;
			if (col0 >= 1)
				energyDiff -= columnDiffs[perm[col0 - 1]][perm[col0]];
			if (col0 + 1 < width)
				energyDiff -= columnDiffs[perm[col0]][perm[col0 + 1]];
			if (col0 >= 1 && col0 + 1 < width)
				energyDiff += columnDiffs[perm[col0 - 1]][perm[col0 + 1]];
			if (col1 < col0) {
				if (col1 >= 1) {
					energyDiff -= columnDiffs[perm[col1 - 1]][perm[col1]];
					energyDiff += columnDiffs[perm[col1 - 1]][perm[col0]];
				}
				energyDiff += columnDiffs[perm[col0]][perm[col1]];
			} else {  // col1 > col0
				energyDiff += columnDiffs[perm[col1]][perm[col0]];
				if (col1 + 1 < width) {
					energyDiff -= columnDiffs[perm[col1]][perm[col1 + 1]];
					energyDiff += columnDiffs[perm[col0]][perm[col1 + 1]];
				}
			}
			// Accept the proposed change if energy improves or is within the simulated annealing probability
			if (energyDiff < 0 || Math.random() < Math.pow(2, -energyDiff / temperature)) {
				var temp = perm[col0];
				perm.splice(col0, 1);
				perm.splice(col1, 0, temp);
				curEnergy += energyDiff;
			}
		}
		curIteration++;
		if (Date.now() - startTime > 20)
			break;
	}
	
	// Show image and statistics on screen periodically
	if (curIteration == numIterations || Date.now() - annealingLastDrawTime > 300) {
		curIterationsText.data = formatWithThousandsSeparators(curIteration) + " (" + (t * 100).toFixed(2) + "%)";
		curTemperatureText.data = temperature.toFixed(2);
		curEnergyText.data = formatWithThousandsSeparators(curEnergy);
		var annealedImage = new ImageData(width, height);
		var shuffledPixels = shuffledImage.data;
		var annealedPixels = annealedImage.data;
		for (var x = 0; x < width; x++) {
			for (var y = 0; y < height; y++) {
				var off0 = (y * width + perm[x]) * 4;
				var off1 = (y * width + x) * 4;
				for (var i = 0; i < 4; i++)
					annealedPixels[off1 + i] = shuffledPixels[off0 + i];
			}
		}
		graphics.putImageData(annealedImage, 0, 0);
		annealingLastDrawTime = Date.now();
	}
	
	// Continue annealing or finish
	if (curIteration < numIterations)
		setTimeout(doAnneal, 0);
	else {
		curIteration = 0;
		colPermutation = null;
		shuffleButton.disabled = false;
		annealButton.disabled = false;
		stopButton.disabled = true;
		imageSelectElem.disabled = false;
	}
}


/*---- Helper functions ----*/

function lineDiff(pixels, width, height, x0, x1) {
	var sum = 0;
	for (var y = 0; y < height; y++) {
		var off0 = (y * width + x0) * 4;
		var off1 = (y * width + x1) * 4;
		for (var i = 0; i < 3; i++)
			sum += Math.abs(pixels[off0 + i] - pixels[off1 + i]);
	}
	return sum;
}


function formatWithThousandsSeparators(n) {
	var s = n.toString();
	for (var i = s.length - 3; i > 0; i -= 3)
		s = s.substr(0, i) + " " + s.substring(i);
	return s;
}
