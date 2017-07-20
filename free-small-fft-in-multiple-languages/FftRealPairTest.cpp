/* 
 * FFT and convolution test (C++)
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/free-small-fft-in-multiple-languages
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * - The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 * - The Software is provided "as is", without warranty of any kind, express or
 *   implied, including but not limited to the warranties of merchantability,
 *   fitness for a particular purpose and noninfringement. In no event shall the
 *   authors or copyright holders be liable for any claim, damages or other
 *   liability, whether in an action of contract, tort or otherwise, arising from,
 *   out of or in connection with the Software or the use or other dealings in the
 *   Software.
 */

#include <algorithm>
#include <cmath>
#include <cstdlib>
#include <iomanip>
#include <iostream>
#include <random>
#include <vector>
#include "FftRealPair.hpp"

using std::cout;
using std::endl;
using std::vector;


// Private function prototypes
static void testFft(int n);
static void testConvolution(int n);
static void naiveDft(const vector<double> &inreal, const vector<double> &inimag,
	vector<double> &outreal, vector<double> &outimag, bool inverse);
static void naiveConvolve(const vector<double> &xreal, const vector<double> &ximag,
	const vector<double> &yreal, const vector<double> &yimag,
	vector<double> &outreal, vector<double> &outimag);
static double log10RmsErr(const vector<double> &xreal, const vector<double> &ximag,
	const vector<double> &yreal, const vector<double> &yimag);
static vector<double> randomReals(int n);

// Mutable global variable
static double maxLogError = -INFINITY;

// Random number generation
std::default_random_engine randGen((std::random_device())());


/*---- Main and test functions ----*/

int main() {
	// Test power-of-2 size FFTs
	for (int i = 0; i <= 12; i++)
		testFft(1 << i);
	
	// Test small size FFTs
	for (int i = 0; i < 30; i++)
		testFft(i);
	
	// Test diverse size FFTs
	for (int i = 0, prev = 0; i <= 100; i++) {
		int n = static_cast<int>(std::lround(std::pow(1500.0, i / 100.0)));
		if (n > prev) {
			testFft(n);
			prev = n;
		}
	}
	
	// Test power-of-2 size convolutions
	for (int i = 0; i <= 12; i++)
		testConvolution(1 << i);
	
	// Test diverse size convolutions
	for (int i = 0, prev = 0; i <= 100; i++) {
		int n = static_cast<int>(std::lround(std::pow(1500.0, i / 100.0)));
		if (n > prev) {
			testConvolution(n);
			prev = n;
		}
	}
	
	cout << endl;
	cout << "Max log err = " << std::setprecision(3) << maxLogError << endl;
	cout << "Test " << (maxLogError < -10 ? "passed" : "failed") << endl;
	return EXIT_SUCCESS;
}


static void testFft(int n) {
	vector<double> inputreal(randomReals(n));
	vector<double> inputimag(randomReals(n));
	
	vector<double> refoutreal(n);
	vector<double> refoutimag(n);
	naiveDft(inputreal, inputimag, refoutreal, refoutimag, false);
	
	vector<double> actualoutreal(inputreal);
	vector<double> actualoutimag(inputimag);
	Fft::transform(actualoutreal, actualoutimag);
	
	cout << "fftsize=" << std::setw(4) << std::setfill(' ') << n << "  "
	     << "logerr=" << std::setw(5) << std::setprecision(3) << std::setiosflags(std::ios::showpoint)
	     << log10RmsErr(refoutreal, refoutimag, actualoutreal, actualoutimag) << endl;
}


static void testConvolution(int n) {
	vector<double> input0real(randomReals(n));
	vector<double> input0imag(randomReals(n));
	vector<double> input1real(randomReals(n));
	vector<double> input1imag(randomReals(n));
	
	vector<double> refoutreal(n);
	vector<double> refoutimag(n);
	naiveConvolve(input0real, input0imag, input1real, input1imag, refoutreal, refoutimag);
	
	vector<double> actualoutreal(n);
	vector<double> actualoutimag(n);
	Fft::convolve(input0real, input0imag, input1real, input1imag, actualoutreal, actualoutimag);
	
	cout << "convsize=" << std::setw(4) << std::setfill(' ') << n << "  "
	     << "logerr=" << std::setw(5) << std::setprecision(3) << std::setiosflags(std::ios::showpoint)
	     << log10RmsErr(refoutreal, refoutimag, actualoutreal, actualoutimag) << endl;
}


/*---- Naive reference computation functions ----*/

static void naiveDft(const vector<double> &inreal, const vector<double> &inimag,
		vector<double> &outreal, vector<double> &outimag, bool inverse) {
	
	int n = static_cast<int>(inreal.size());
	double coef = (inverse ? 2 : -2) * M_PI / n;
	for (int k = 0; k < n; k++) {  // For each output element
		double sumreal = 0;
		double sumimag = 0;
		for (int t = 0; t < n; t++) {  // For each input element
			double angle = coef * (static_cast<long long>(t) * k % n);
			sumreal += inreal[t] * std::cos(angle) - inimag[t] * std::sin(angle);
			sumimag += inreal[t] * std::sin(angle) + inimag[t] * std::cos(angle);
		}
		outreal[k] = sumreal;
		outimag[k] = sumimag;
	}
}


static void naiveConvolve(
		const vector<double> &xreal, const vector<double> &ximag,
		const vector<double> &yreal, const vector<double> &yimag,
		vector<double> &outreal, vector<double> &outimag) {
	
	int n = static_cast<int>(xreal.size());
	std::fill(outreal.begin(), outreal.end(), 0.0);
	std::fill(outimag.begin(), outimag.end(), 0.0);
	
	for (int i = 0; i < n; i++) {
		for (int j = 0; j < n; j++) {
			int k = (i + j) % n;
			outreal[k] += xreal[i] * yreal[j] - ximag[i] * yimag[j];
			outimag[k] += xreal[i] * yimag[j] + ximag[i] * yreal[j];
		}
	}
}


/*---- Utility functions ----*/

static double log10RmsErr(const vector<double> &xreal, const vector<double> &ximag,
		const vector<double> &yreal, const vector<double> &yimag) {
	
	int n = static_cast<int>(xreal.size());
	double err = std::pow(10, -99 * 2);
	for (int i = 0; i < n; i++) {
		double real = xreal.at(i) - yreal.at(i);
		double imag = ximag.at(i) - yimag.at(i);
		err += real * real + imag * imag;
	}
	
	err /= n > 0 ? n : 1;
	err = std::sqrt(err);  // Now this is a root mean square (RMS) error
	err = std::log10(err);
	maxLogError = std::max(err, maxLogError);
	return err;
}


static vector<double> randomReals(int n) {
	std::uniform_real_distribution<double> valueDist(-1.0, 1.0);
	vector<double> result;
	for (int i = 0; i < n; i++)
		result.push_back(valueDist(randGen));
	return result;
}
