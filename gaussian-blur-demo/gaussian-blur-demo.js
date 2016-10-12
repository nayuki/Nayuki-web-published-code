/* 
 * Gaussian blur demo (JavaScript)
 * 
 * Copyright (c) 2016 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/gaussian-blur-demo
 */

"use strict";


/*---- Global variables ----*/

// Input image
var image = new Image();
var width  = -1;
var height = -1;
var numPixels = -1;

// Intermediate computation
var radius = -1;
var imageFloatLinear = null;
var imageData = null;
var imageTemp = null;

// Output objects
var canvasElem = document.getElementById("canvas");
var graphics = canvasElem.getContext("2d");



/*---- Functions ----*/

// The main entry point from the HTML code.
function doGaussianBlur() {
	var startTime = performance.now();
	if (!updateRadius())
		return;
	
	function doRowConvolutions(imageIn, imageOut) {
		var kernel = makeGaussianKernel(radius, width);
		var length = kernel.length;
		var convolver = new FftConvolver(kernel);
		var lineReal = new Float32Array(length);
		var lineImag = new Float32Array(length);
		for (var ch = 0; ch < 4; ch += 2) {
			for (var y = 0; y < height; y++) {
				var off0 = (ch + 0) * numPixels + y * width;
				var off1 = (ch + 1) * numPixels + y * width;
				var x;
				for (x = 0; x < width; x++) {
					lineReal[x] = imageIn[off0 + x];
					lineImag[x] = imageIn[off1 + x];
				}
				for (; x < length; x++)
					lineReal[x] = lineImag[x] = 0;
				convolver.convolve(lineReal, lineImag);
				for (x = 0; x < width; x++) {
					imageOut[off0 + x] = lineReal[x];
					imageOut[off1 + x] = lineImag[x];
				}
			}
		}
	}
	
	function doColumnConvolutions(imageIn, imageOut) {
		var kernel = makeGaussianKernel(radius, height);
		var length = kernel.length;
		var convolver = new FftConvolver(kernel);
		var lineReal = new Float32Array(length);
		var lineImag = new Float32Array(length);
		for (var ch = 0; ch < 4; ch += 2) {
			for (var x = 0; x < width; x++) {
				var off0 = (ch + 0) * numPixels + x;
				var off1 = (ch + 1) * numPixels + x;
				var y;
				for (y = 0; y < height; y++) {
					lineReal[y] = imageIn[off0 + y * width];
					lineImag[y] = imageIn[off1 + y * width];
				}
				for (; y < length; y++)
					lineReal[y] = lineImag[y] = 0;
				convolver.convolve(lineReal, lineImag);
				for (y = 0; y < height; y++) {
					imageOut[off0 + y * width] = lineReal[y];
					imageOut[off1 + y * width] = lineImag[y];
				}
			}
		}
	}
	
	function convertToByteGamma(imageIn, imageOut) {
		var lgSteps = linearToGamma.length - 1;
		for (var i = 0; i < numPixels; i++) {
			var weight = imageIn[3 * numPixels + i];
			for (var ch = 0; ch < 3; ch++) {
				var val = imageIn[ch * numPixels + i] / weight;
				imageOut[i * 4 + ch] = linearToGamma[Math.round(val * lgSteps)];
			}
		}
	}
	
	doRowConvolutions(imageFloatLinear, imageTemp);
	doColumnConvolutions(imageTemp, imageTemp);
	convertToByteGamma(imageTemp, imageData.data);
	graphics.putImageData(imageData, 0, 0);
	console.log("radius=" + radius.toFixed(2) + ", time=" + (performance.now() - startTime).toFixed(1) + "ms");
}


// Returns true/false to indicate whether the radius has changed since the last call.
function updateRadius() {
	if (width == -1)
		return false;
	var raw = parseFloat(document.getElementById("radius-in").value) / 100;  // Normalized from 0.0 to 1.0
	var newRad = Math.pow(raw, 1.5) * 100;
	if (newRad == 0)
		newRad = 0.000001;  // To avoid division by zero
	if (newRad == radius)
		return false;
	radius = newRad;
	
	var radiusOutElem = document.getElementById("radius-out");
	while (radiusOutElem.firstChild != null)
		radiusOutElem.removeChild(radiusOutElem.firstChild);
	radiusOutElem.appendChild(document.createTextNode(radius.toFixed(2)));
	return true;
}


// Returns a cyclic array representing a non-normalized discrete Gaussian distribution of the given standard deviation,
// such that the returned array's length is a power of 2 and the number of zero elements is at least (dataLen - 1).
function makeGaussianKernel(stdDev, dataLen) {
	// Create one-sided kernel
	var kernel = [];
	var scaler = -1 / (2 * stdDev * stdDev);
	for (var i = 0; i < dataLen; i++) {
		var temp = Math.exp(i * i * scaler);
		kernel.push(temp);
		if (temp < 1e-6)
			break;
	}
	
	// Calculate length for full padded kernel
	var length = 1;
	while (length < (kernel.length - 1) * 2 + dataLen)
		length *= 2;
	var result = new Float32Array(length);
	
	// Copy kernel like this: [a,b,c] -> [a,b,c,0,0,...,0,0,c,b]
	result[0] = kernel[0];
	for (var i = 0; i < kernel.length; i++) {
		result[i] = kernel[i];
		result[length - i] = kernel[i];
	}
	return result;
}


var linearToGamma = new Array(4096 + 1);
for (var i = 0; i < linearToGamma.length; i++)
	linearToGamma[i] = Math.round(Math.pow(i / (linearToGamma.length - 1), 1 / 2.2) * 255);


// Precomputes some tables, and performs non-normalized circular convolutions with the given kernel.
// A heavily modified version of https://www.nayuki.io/page/free-small-fft-in-multiple-languages .
function FftConvolver(kernelReal, kernelImag) {
	if (kernelImag === undefined)
		kernelImag = new Float32Array(kernelReal.length);
	
	// Compute number of levels
	var length = kernelReal.length;
	if (length == 1)
		throw "Trivial transform";
	var levels = -1;
	for (var i = 0; i < 32; i++) {
		if (1 << i == length)
			levels = i;
	}
	if (levels == -1)
		throw "Length is not a power of 2";
	
	// Pre-compute tables
	var cosTable = new Float32Array(length / 2);
	var sinTable = new Float32Array(length / 2);
	for (var i = 0; i < length / 2; i++) {
		cosTable[i] = Math.cos(2 * Math.PI * i / length);
		sinTable[i] = Math.sin(2 * Math.PI * i / length);
	}
	var bitRevTable = new Uint32Array(length);
	for (var i = 0; i < length; i++)
		bitRevTable[i] = reverseBits(i, levels);
	
	// Pre-compute transformed kernel
	transform(kernelReal, kernelImag);
	
	
	// Exported method
	this.convolve = function(real, imag) {
		transform(real, imag);
		for (var i = 0; i < length; i++) {
			var temp = real[i] * kernelReal[i] - imag[i] * kernelImag[i];
			imag[i]  = imag[i] * kernelReal[i] + real[i] * kernelImag[i];
			real[i]  = temp;
		}
		transform(imag, real);
	};
	
	
	// Radix 2 fast Fourier transform
	function transform(real, imag) {
		if (real.length != length || imag.length != length)
			throw "Mismatched lengths";
		
		for (var i = 0; i < length; i++) {
			var j = bitRevTable[i];
			if (j > i) {
				var temp = real[i];
				real[i] = real[j];
				real[j] = temp;
				temp = imag[i];
				imag[i] = imag[j];
				imag[j] = temp;
			}
		}
		
		for (var size = 2; size <= length; size *= 2) {
			var halfsize = size / 2;
			var tablestep = length / size;
			for (var i = 0; i < length; i += size) {
				for (var j = i, k = 0; j < i + halfsize; j++, k += tablestep) {
					var tpre =  real[j+halfsize] * cosTable[k] + imag[j+halfsize] * sinTable[k];
					var tpim = -real[j+halfsize] * sinTable[k] + imag[j+halfsize] * cosTable[k];
					real[j + halfsize] = real[j] - tpre;
					imag[j + halfsize] = imag[j] - tpim;
					real[j] += tpre;
					imag[j] += tpim;
				}
			}
		}
	}
	
	// Helper function
	function reverseBits(x, bits) {
		var y = 0;
		for (var i = 0; i < bits; i++) {
			y = (y << 1) | (x & 1);
			x >>>= 1;
		}
		return y;
	}
}


// Requests the main image to load from the given URL, and sets a
// callback to precompute and paint things when the image is loaded.
function loadImage(url) {
	image.src = url;
	image.onload = function() {
		// Set numbers
		canvasElem.width  = width  = image.width;
		canvasElem.height = height = image.height;
		numPixels = width * height;
		
		// Precomputation
		imageFloatLinear = new Float32Array(numPixels * 4);
		imageTemp = new Float32Array(imageFloatLinear.length);
		graphics.drawImage(image, 0, 0, width, height);
		imageData = graphics.getImageData(0, 0, width, height);
		var buffer = imageData.data;
		for (var ch = 0; ch < 3; ch++) {
			for (var i = 0; i < numPixels; i++)
				imageFloatLinear[ch * numPixels + i] = Math.pow(buffer[i * 4 + ch] / 255, 2.2);  // Gamma to linear
		}
		for (var i = 0; i < numPixels; i++)
			imageFloatLinear[3 * numPixels + i] = 1;
		
		// Clear cached radius and compute blur
		radius = -1;
		doGaussianBlur();
	};
}


// Initialization code
loadImage("/res/gaussian-blur-demo/autumn-city.png");
