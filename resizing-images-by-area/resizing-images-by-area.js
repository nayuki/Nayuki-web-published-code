/* 
 * Resizing images by area
 * 
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/resizing-images-by-area
 */

"use strict";


var app = new function() {
	
	this.doCalculate = function() {
		function parseNumber(nodeId) {
			var text = document.getElementById(nodeId).value;
			text = text.replace(/^\s+|\s+$/g, "");  // Trim whitespace
			var result = parseFloat(text);
			if (result <= 0)
				throw new Error("Positive number expected");
			else if (result == Infinity || isNaN(result))
				throw new Error("Finite number expected");
			else
				return result;
		}
		
		// Clear outputs
		var resizedDimensions = document.getElementById("resized-dimensions");
		var resizedAreaOutput = document.getElementById("resized-area-output");
		var aspectRatio       = document.getElementById("aspect-ratio");
		resizedDimensions.textContent = "";
		resizedAreaOutput.textContent = "";
		aspectRatio      .textContent = "";
		
		try {
			// Get inputs
			var originalWidth  = parseNumber("original-width");
			var originalHeight = parseNumber("original-height");
			var resizedArea    = parseNumber("resized-area");
			
			// Format aspect ratio
			var artext;
			if (originalWidth > originalHeight)
				artext = (originalWidth / originalHeight).toFixed(3) + " : 1";
			else if (originalHeight > originalWidth)
				artext = "1 : " + (originalHeight / originalWidth).toFixed(3);
			else
				artext = "1 : 1";
			aspectRatio.textContent = artext;
			
			// Calculate outputs
			var resizedWidth  = Math.sqrt(resizedArea * originalWidth / originalHeight);
			var resizedHeight = Math.sqrt(resizedArea * originalHeight / originalWidth);
			resizedWidth  = resizedWidth  > 0.5 ? Math.round(resizedWidth)  : 1;
			resizedHeight = resizedHeight > 0.5 ? Math.round(resizedHeight) : 1;
			var area = resizedWidth * resizedHeight / 1000000;  // In megapixels
			
			// Format outputs
			resizedDimensions.textContent = resizedWidth + " " + TIMES + " " + resizedHeight;
			var areaText;
			if (area < 0.3)
				areaText = area.toFixed(3);
			else if (area < 3)
				areaText = area.toFixed(2);
			else if (area < 30)
				areaText = area.toFixed(1);
			else
				areaText = area.toFixed(0);
			resizedAreaOutput.textContent = areaText + " megapixels";
		} catch (e) {}
	};
	
	
	var TIMES = "\u00D7";  // Times sign
	
};
