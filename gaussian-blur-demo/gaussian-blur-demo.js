/* 
 * Gaussian blur demo (JavaScript)
 * 
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/gaussian-blur-demo
 */

"use strict";


/*---- Global variables ----*/

// Input image
let image = new Image();
let width  = -1;
let height = -1;
let numPixels = -1;

// Intermediate computation
let radius = -1;
let imageFloatLinear = null;
let imageData = null;
let imageTemp = null;

// Output objects
let canvasElem = document.getElementById("canvas");
let graphics = canvasElem.getContext("2d");



/*---- Functions ----*/

// The main entry point from the HTML code.
function doGaussianBlur() {
	const startTime = performance.now();
	if (!updateRadius())
		return;
	
	function doRowConvolutions(imageIn, imageOut) {
		let kernel = makeGaussianKernel(radius, width);
		const length = kernel.length;
		const convolver = new FftConvolver(kernel);
		let lineReal = new Float32Array(length);
		let lineImag = new Float32Array(length);
		for (let ch = 0; ch < 4; ch += 2) {
			for (let y = 0; y < height; y++) {
				const off0 = (ch + 0) * numPixels + y * width;
				const off1 = (ch + 1) * numPixels + y * width;
				let x;
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
		let kernel = makeGaussianKernel(radius, height);
		const length = kernel.length;
		const convolver = new FftConvolver(kernel);
		let lineReal = new Float32Array(length);
		let lineImag = new Float32Array(length);
		for (let ch = 0; ch < 4; ch += 2) {
			for (let x = 0; x < width; x++) {
				const off0 = (ch + 0) * numPixels + x;
				const off1 = (ch + 1) * numPixels + x;
				let y;
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
		const lgSteps = linearToGamma.length - 1;
		for (let i = 0; i < numPixels; i++) {
			const weight = imageIn[3 * numPixels + i];
			for (let ch = 0; ch < 3; ch++) {
				const val = imageIn[ch * numPixels + i] / weight;
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
	const raw = parseFloat(document.getElementById("radius-in").value) / 100;  // Normalized from 0.0 to 1.0
	let newRad = Math.pow(raw, 2.5) * 100;
	if (newRad == 0)
		newRad = 0.000001;  // To avoid division by zero
	if (newRad == radius)
		return false;
	radius = newRad;
	
	document.getElementById("radius-out").textContent = radius.toFixed(2);
	return true;
}


// Returns a cyclic array representing a non-normalized discrete Gaussian distribution of the given standard deviation,
// such that the returned array's length is a power of 2 and the number of zero elements is at least (dataLen - 1).
function makeGaussianKernel(stdDev, dataLen) {
	// Create one-sided kernel
	let kernel = [];
	const scaler = -1 / (2 * stdDev * stdDev);
	for (let i = 0; i < dataLen; i++) {
		const temp = Math.exp(i * i * scaler);
		kernel.push(temp);
		if (temp < 1e-6)
			break;
	}
	
	// Calculate length for full padded kernel
	let length = 1;
	while (length < dataLen + kernel.length - 1)
		length *= 2;
	let result = new Float32Array(length);
	
	// Copy kernel like this: [a,b,c] -> [a,b,c,0,0,...,0,0,c,b]
	result[0] = kernel[0];
	for (let i = 0; i < kernel.length; i++) {
		result[i] = kernel[i];
		result[length - i] = kernel[i];
	}
	return result;
}


let linearToGamma = new Array(4096 + 1);
for (let i = 0; i < linearToGamma.length; i++)
	linearToGamma[i] = Math.round(Math.pow(i / (linearToGamma.length - 1), 1 / 2.2) * 255);


// Precomputes some tables, and performs non-normalized circular convolutions with the given kernel.
// A heavily modified version of https://www.nayuki.io/page/free-small-fft-in-multiple-languages .
function FftConvolver(kernelReal, kernelImag) {
	if (kernelImag === undefined)
		kernelImag = new Float32Array(kernelReal.length);
	
	// Compute number of levels
	const length = kernelReal.length;
	if (length == 1)
		throw new RangeError("Trivial transform");
	let levels = -1;
	for (let i = 0; i < 32; i++) {
		if (1 << i == length)
			levels = i;
	}
	if (levels == -1)
		throw new RangeError("Length is not a power of 2");
	
	// Pre-compute tables
	let cosTable = new Float32Array(length / 2);
	let sinTable = new Float32Array(length / 2);
	for (let i = 0; i < length / 2; i++) {
		cosTable[i] = Math.cos(2 * Math.PI * i / length);
		sinTable[i] = Math.sin(2 * Math.PI * i / length);
	}
	let bitRevTable = new Uint32Array(length);
	for (let i = 0; i < length; i++)
		bitRevTable[i] = reverseBits(i, levels);
	
	// Pre-compute transformed kernel
	transform(kernelReal, kernelImag);
	
	
	// Exported method
	this.convolve = function(real, imag) {
		transform(real, imag);
		for (let i = 0; i < length; i++) {
			const temp = real[i] * kernelReal[i] - imag[i] * kernelImag[i];
			imag[i]  = imag[i] * kernelReal[i] + real[i] * kernelImag[i];
			real[i]  = temp;
		}
		transform(imag, real);
	};
	
	
	// Radix 2 fast Fourier transform
	function transform(real, imag) {
		if (real.length != length || imag.length != length)
			throw new RangeError("Mismatched lengths");
		
		for (let i = 0; i < length; i++) {
			const j = bitRevTable[i];
			if (j > i) {
				let temp = real[i];
				real[i] = real[j];
				real[j] = temp;
				temp = imag[i];
				imag[i] = imag[j];
				imag[j] = temp;
			}
		}
		
		for (let size = 2; size <= length; size *= 2) {
			const halfsize = size / 2;
			const tablestep = length / size;
			for (let i = 0; i < length; i += size) {
				for (let j = i, k = 0; j < i + halfsize; j++, k += tablestep) {
					const tpre =  real[j+halfsize] * cosTable[k] + imag[j+halfsize] * sinTable[k];
					const tpim = -real[j+halfsize] * sinTable[k] + imag[j+halfsize] * cosTable[k];
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
		let y = 0;
		for (let i = 0; i < bits; i++) {
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
	image.onload = () => {
		// Set numbers
		canvasElem.width  = width  = image.width;
		canvasElem.height = height = image.height;
		numPixels = width * height;
		
		// Precomputation
		imageFloatLinear = new Float32Array(numPixels * 4);
		imageTemp = new Float32Array(imageFloatLinear.length);
		graphics.drawImage(image, 0, 0, width, height);
		imageData = graphics.getImageData(0, 0, width, height);
		const buffer = imageData.data;
		for (let ch = 0; ch < 3; ch++) {
			for (let i = 0; i < numPixels; i++)
				imageFloatLinear[ch * numPixels + i] = Math.pow(buffer[i * 4 + ch] / 255, 2.2);  // Gamma to linear
		}
		for (let i = 0; i < numPixels; i++)
			imageFloatLinear[3 * numPixels + i] = 1;
		
		// Clear cached radius and compute blur
		radius = -1;
		doGaussianBlur();
	};
}


// Initialization code
loadImage("/res/gaussian-blur-demo/autumn-city.png");
