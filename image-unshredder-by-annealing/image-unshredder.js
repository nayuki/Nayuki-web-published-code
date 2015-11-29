/* 
 * Image unshredder demo (JavaScript)
 * 
 * Copyright (c) 2015 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * http://www.nayuki.io/page/image-unshredder-by-annealing
 */

"use strict";


/*---- Global variables and initialization ----*/

// HTML elements
var canvasElem = element("canvas");
var graphics = canvasElem.getContext("2d");
var imageSelectElem = element("image-select"     );
var shuffleButton   = element("shuffle-button"   );
var annealButton    = element("anneal-button"    );
var stopButton      = element("stop-button"      );
var imageAttribElem = element("image-attribution");
var imageAttribText    = makeTextNodeChild("image-attribution"  , ""      );
var curIterationsText  = makeTextNodeChild("current-iterations" , "\u2012");
var curTemperatureText = makeTextNodeChild("current-temperature", "\u2012");
var curEnergyText      = makeTextNodeChild("current-energy"     , "\u2012");

// List of images to play with
var IMAGE_LIST = [
	["Abstract Light Painting", "abstract-light-painting.png", "Alexander Nie"           , "https://www.flickr.com/photos/niephotography/15821646318/"],
	["Alaska Railroad"        , "alaska-railroad.png"        , "Luke Jones"              , "https://www.flickr.com/photos/befuddledsenses/7392384974/"],
	["Blue Hour in Paris"     , "blue-hour-paris.png"        , "Falcon\u00AE Photography", "https://www.flickr.com/photos/falcon_33/15178077733/"     ],
	["Lower Kananaskis Lake"  , "lower-kananaskis-lake.png"  , "davebloggs007"           , "https://www.flickr.com/photos/davebloggs007/15223201038/" ],
	["Marlet 2 Radio Board"   , "marlet2-radio-board.png"    , "Adam Greig"              , "https://www.flickr.com/photos/randomskk/14915187162/"     ],
	["Nikos\u2019s Cat"       , "nikos-cat.png"              , "Nikos Koutoulas"         , "https://www.flickr.com/photos/33284937@N04/8854205418/"   ],
	["Pizza food wallpaper"   , "pizza-food-wallpaper.png"   , "Michael Stern"           , "https://www.flickr.com/photos/68711844@N07/15204301893/"  ],
	["The Enchanted Garden"   , "the-enchanted-garden.png"   , "Julie Geiger"            , "https://www.flickr.com/photos/julesbeans/11318885443/"    ],
	["Tokyo Skytree Aerial"   , "tokyo-skytree-aerial.png"   , "IQRemix"                 , "https://www.flickr.com/photos/iqremix/18088821468/"       ],
];

// Base image properties
var baseImage = new Image();
var width = -1;
var height = -1;

// Variables for image shuffling
var shuffleStartColumn = -1;
var shuffledImage = null;

// Variables for image annealing
var numIterations = -1;
var startTemperature = -1;
var curIteration = -1;
var curEnergy = -1;
var columnDiffs = null;  // columnDiffs[x0][x1] is the amount of difference between column x0 and column x1 in shuffledImage
var colPermutation = null;
var annealingLastDrawTime = null;

// Performance tuning
var YIELD_AFTER_TIME = 20;  // In milliseconds; a long computation relinquishes/yields after this amount of time; short will mean high execution overhead; long will mean the GUI hangs
var ANNEAL_REDRAW_TIME = 300;  // In milliseconds; the minimum amount of time between image and text updates when performing annealing


function init() {
	baseImage.onload = function() {
		canvasElem.width = width = baseImage.width;
		canvasElem.height = height = baseImage.height;
		graphics.drawImage(baseImage, 0, 0, width, height);
		setButtonState(1);
		shuffleStartColumn = 0;
		shuffledImage = null;
		columnDiffs = null;
	};
	
	shuffleButton.onclick = doShuffle;
	annealButton .onclick = doAnneal;
	stopButton   .onclick = doStop;
	
	while (imageSelectElem.firstChild != null)
		imageSelectElem.removeChild(imageSelectElem.firstChild);
	IMAGE_LIST.forEach(function(entry) {
		var option = document.createElement("option");
		option.appendChild(document.createTextNode(entry[0]));
		imageSelectElem.appendChild(option);
	});
	
	imageSelectElem.selectedIndex = Math.floor(Math.random() * IMAGE_LIST.length);
	imageSelectElem.onchange = function() {
		width = -1;
		height = -1;
		setButtonState(0);
		var entry = IMAGE_LIST[imageSelectElem.selectedIndex];
		baseImage.src = "/res/image-unshredder-by-annealing/" + entry[1];
		imageAttribText.data = "by " + entry[2];
		imageAttribElem.href = entry[3];
	};
	imageSelectElem.onchange();
}


/*---- Main functions ----*/

function doStop() {
	shuffleStartColumn = width;
	curIteration = -1;
}


function doShuffle() {
	if (shuffleStartColumn == 0) {
		setButtonState(2);
		graphics.drawImage(baseImage, 0, 0, width, height);
		shuffledImage = graphics.getImageData(0, 0, width, height);
	}
	
	var startTime = Date.now();
	var pixels = shuffledImage.data;
	while (shuffleStartColumn < width) {
		// Pick a random column j in the range [i, width) and move it to position i.
		// This is effectively an inefficient but more animatedly appealing variant of the unbiased Fisher-Yates shuffle.
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
		if (Date.now() - startTime > YIELD_AFTER_TIME)
			break;
	}
	graphics.putImageData(shuffledImage, 0, 0);
	
	// Continue shuffling or finish
	if (shuffleStartColumn < width)
		setTimeout(doShuffle, 0);
	else {
		setButtonState(3);
		shuffleStartColumn = 0;
		curIteration = 0;
		curEnergy = -1;
		columnDiffs = null;
	}
}


function doAnneal() {
	if (curIteration == -1) {  // Stop requested
		curIteration = 0;
		colPermutation = null;
		setButtonState(3);
		return;
	}
	
	var startTime = Date.now();
	if (curIteration == 0) {  // Initialize the annealing
		if (colPermutation == null) {
			setButtonState(2);
			numIterations = Math.round(parseFloat(element("number-iterations").value) * 1000000);
			startTemperature = Math.round(parseFloat(element("start-temperature").value));
			colPermutation = [];
			for (var i = 0; i < width; i++)
				colPermutation.push(i);
		}
		
		if (columnDiffs == null) {
			columnDiffs = [];
			curIterationsText.data = "Precomputing...";
		}
		if (columnDiffs.length < width) {
			var pixels = shuffledImage.data;
			while (columnDiffs.length < width && Date.now() - startTime < YIELD_AFTER_TIME) {
				var i = columnDiffs.length;
				var entry = new Uint32Array(width);
				for (var j = 0; j < width; j++) {
					if (i <= j)
						entry[j] = lineDiff(pixels, width, height, i, j);
					else
						entry[j] = columnDiffs[j][i];
				}
				columnDiffs.push(entry);
			}
			if (columnDiffs.length < width) {
				setTimeout(doAnneal, 0);
				return;
			}
		}
		
		curEnergy = 0;
		for (var i = 0; i < width - 1; i++)
			curEnergy += columnDiffs[i][i + 1];
		annealingLastDrawTime = Date.now();
	}
	
	var t = -1;
	var temperature = -1;
	var perm = colPermutation;
	while (curIteration < numIterations) {
		t = curIteration / numIterations;
		temperature = (1 - t) * startTemperature;
		
		// Randomly choose two distinct columns
		var col0 = Math.floor(Math.random() * width);
		var col1 = Math.floor(Math.random() * width);
		if (col0 != col1) {
			// Calculate the change in energy if the col0 were removed and inserted at col1
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
		if (Date.now() - startTime > YIELD_AFTER_TIME)
			break;
	}
	
	// Show image and statistics on screen periodically
	if (curIteration == numIterations || Date.now() - annealingLastDrawTime > ANNEAL_REDRAW_TIME) {
		curIterationsText.data = formatWithThousandsSeparators(curIteration) + " (" + (t * 100).toFixed(2) + "%)";
		curTemperatureText.data = temperature.toFixed(2);
		curEnergyText.data = formatWithThousandsSeparators(curEnergy);
		var annealedImage = new ImageData(width, height);
		var shuffledPixels = shuffledImage.data;
		var annealedPixels = annealedImage.data;
		for (var y = 0; y < height; y++) {
			for (var x = 0; x < width; x++) {
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
		setButtonState(3);
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


// 0: Loading image, 1: Image loaded, 2: Currently shuffling or annealing, 3: Image shuffled
function setButtonState(state) {
	imageSelectElem.disabled = state == 2;
	shuffleButton.disabled = state == 0 || state == 2;
	annealButton.disabled = state != 3;
	stopButton.disabled = state != 2;
}


function makeTextNodeChild(elemId, initText) {
	var result = document.createTextNode(initText);
	element(elemId).appendChild(result);
	return result;
}


function element(elemId) {
	return document.getElementById(elemId);
}


// We put this call after all global variables are declared
init();
