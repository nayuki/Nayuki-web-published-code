/* 
 * FFT and convolution test (C++)
 * 
 * Copyright (c) 2021 Project Nayuki. (MIT License)
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
#include <complex>
#include <cstdlib>
#include <iomanip>
#include <iostream>
#include <random>
#include <utility>
#include <vector>
#include "FftComplex.hpp"

using std::complex;
using std::cout;
using std::endl;
using std::vector;


// Private function prototypes
static void testFft(int n);
static void testConvolution(int n);
static vector<complex<double> > naiveDft(const vector<complex<double> > &input, bool inverse);
static vector<complex<double> > naiveConvolve(const vector<complex<double> > &xvec, const vector<complex<double> > &yvec);
static double log10RmsErr(const vector<complex<double> > &xvec, const vector<complex<double> > &yvec);
static vector<complex<double> > randomComplexes(int n);

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
	const vector<complex<double> > input = randomComplexes(n);
	const vector<complex<double> > expect = naiveDft(input, false);
	vector<complex<double> > actual = input;
	Fft::transform(actual, false);
	double err = log10RmsErr(expect, actual);
	
	for (auto it = actual.begin(); it != actual.end(); ++it)
		*it /= n;
	Fft::transform(actual, true);
	err = std::max(log10RmsErr(input, actual), err);
	cout << "fftsize=" << std::setw(4) << std::setfill(' ') << n << "  "
	     << "logerr=" << std::setw(5) << std::setprecision(3) << std::setiosflags(std::ios::showpoint)
	     << err << endl;
}


static void testConvolution(int n) {
	const vector<complex<double> > input0 = randomComplexes(n);
	const vector<complex<double> > input1 = randomComplexes(n);
	const vector<complex<double> > expect = naiveConvolve(input0, input1);
	const vector<complex<double> > actual = Fft::convolve(std::move(input0), std::move(input1));
	cout << "convsize=" << std::setw(4) << std::setfill(' ') << n << "  "
	     << "logerr=" << std::setw(5) << std::setprecision(3) << std::setiosflags(std::ios::showpoint)
	     << log10RmsErr(expect, actual) << endl;
}


/*---- Naive reference computation functions ----*/

static vector<complex<double> > naiveDft(const vector<complex<double> > &input, bool inverse) {
	int n = static_cast<int>(input.size());
	vector<complex<double> > output;
	double coef = (inverse ? 2 : -2) * M_PI / n;
	for (int k = 0; k < n; k++) {  // For each output element
		complex<double> sum(0);
		for (int t = 0; t < n; t++) {  // For each input element
			double angle = coef * (static_cast<long long>(t) * k % n);
			sum += input[t] * std::polar(1.0, angle);
		}
		output.push_back(sum);
	}
	return output;
}


static vector<complex<double> > naiveConvolve(
		const vector<complex<double> > &xvec, const vector<complex<double> > &yvec) {
	int n = static_cast<int>(xvec.size());
	vector<complex<double> > result(n);  // All zeros
	for (int i = 0; i < n; i++) {
		for (int j = 0; j < n; j++) {
			int k = (i + j) % n;
			result[k] += xvec[i] * yvec[j];
		}
	}
	return result;
}


/*---- Utility functions ----*/

static double log10RmsErr(const vector<complex<double> > &xvec, const vector<complex<double> > &yvec) {
	int n = static_cast<int>(xvec.size());
	double err = std::pow(10, -99 * 2);
	for (int i = 0; i < n; i++)
		err += std::norm(xvec.at(i) - yvec.at(i));
	err /= n > 0 ? n : 1;
	err = std::sqrt(err);  // Now this is a root mean square (RMS) error
	err = std::log10(err);
	maxLogError = std::max(err, maxLogError);
	return err;
}


static vector<complex<double> > randomComplexes(int n) {
	std::uniform_real_distribution<double> valueDist(-1.0, 1.0);
	vector<complex<double> > result;
	for (int i = 0; i < n; i++)
		result.push_back(complex<double>(valueDist(randGen), valueDist(randGen)));
	return result;
}
