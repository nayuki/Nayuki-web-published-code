/* 
 * Fast Fourier transform test
 * 
 * Copyright (c) 2020 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/fast-fourier-transform-in-x86-assembly
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

#include <chrono>
#include <cmath>
#include <complex>
#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <iomanip>
#include <ios>
#include <iostream>
#include <new>
#include <random>
#include <ratio>
#include <vector>
#include "Fft.hpp"

using std::complex;
using std::size_t;
using std::uint64_t;
using std::vector;


// Private function prototypes
static bool selfCheck(size_t n);
static vector<complex<double> > naiveDft(const complex<double> *input, size_t n);
static double benchmarkTime(size_t n, const Fft &fft, complex<double> *vec, uint64_t iterations);


// Global variables
static std::default_random_engine randGen((std::random_device())());
static std::uniform_real_distribution<double> realDist(-1, 1);


/*---- Function implementations ----*/

int main() {
	// Self-test
	for (int i = 3; i <= 10; i++) {  // Test FFT sizes 8, 16, ..., 512, 1024
		if (!selfCheck((static_cast<size_t>(1) + 0U) << i)) {
			std::cout << "Self-test failed" << std::endl;
			return EXIT_FAILURE;
		}
	}
	std::cout << "Self-test passed" << std::endl;
	std::cout << std::endl;
	
	// Speed benchmark
	const double TARGET_TIME = 100'000'000;  // In nanoseconds
	const int TRIALS = 10;
	const size_t START_SIZE = (static_cast<size_t>(1) + 0U) <<  3;
	const size_t END_SIZE   = (static_cast<size_t>(1) + 0U) << 20;
	std::cout << std::setw(9) << "Size" << std::setw(0) << "    " << "Time per FFT (ns)" << std::endl;
	for (size_t n = START_SIZE; n <= END_SIZE; n *= 2) {
		// Initialize data sets
		const Fft fft(n);
		complex<double> *vec = new (std::align_val_t(32)) complex<double>[n];
		
		// Determine number of iterations to run to spend TARGET_TIME
		uint64_t iterations = 1;
		while (true) {
			double time = benchmarkTime(n, fft, vec, iterations);
			if (time >= TARGET_TIME) {
				iterations = static_cast<uint64_t>(TARGET_TIME / time * iterations + 0.5);
				if (iterations == 0)
					iterations = 1;
				break;
			}
			iterations *= 2;
		}
		
		// Run trials and store timing
		vector<double> runTimes;
		for (int i = 0; i < TRIALS; i++)
			runTimes.push_back(benchmarkTime(n, fft, vec, iterations) / iterations);
		::operator delete[](vec, std::align_val_t(32));
		
		// Compute statistics
		double min = 1e300;
		double sum = 0;
		for (double t : runTimes) {
			if (t < min)
				min = t;
			sum += t;
		}
		double mean = sum / runTimes.size();
		double sqrDiffSum = 0;
		for (double t : runTimes)
			sqrDiffSum += (t - mean) * (t - mean);
		double stdDev = std::sqrt(sqrDiffSum / runTimes.size());
		std::cout << std::setw(9) << n << std::setw(0) << "    "
			<< "min=" << static_cast<uint64_t>(min + 0.5) << "  "
			<< "mean=" << static_cast<uint64_t>(mean + 0.5) << "  "
			<< "sd=" << std::fixed << std::setprecision(2) << (stdDev / mean * 100) << "%" << std::endl;
	}
	return EXIT_SUCCESS;
}


static bool selfCheck(size_t n) {
	// Create random complex vector
	complex<double> *vec = new (std::align_val_t(32)) complex<double>[n];
	for (size_t i = 0; i < n; i++)
		vec[i] = complex<double>(realDist(randGen), realDist(randGen));
	
	// Calculate transforms
	vector<complex<double> > ref = naiveDft(vec, n);
	Fft(n).transform(vec);
	
	// Calculate root-mean-square error
	double err = 0;
	for (size_t i = 0; i < n; i++)
		err += std::norm(vec[i] - ref.at(i));
	::operator delete[](vec, std::align_val_t(32));
	return std::sqrt(err / n) < 1e-10;
}


// Computes the discrete Fourier transform using the naive O(n^2) time algorithm.
static vector<complex<double> > naiveDft(const complex<double> *input, size_t n) {
	vector<complex<double> > output;
	for (size_t k = 0; k < n; k++) {  // For each output element
		complex<double> sum(0.0, 0.0);
		for (size_t t = 0; t < n; t++) {  // For each input element
			double angle = 2 * M_PI * t * k / n;
			sum += input[t] * exp(complex<double>(0, -angle));
		}
		output.push_back(sum);
	}
	return output;
}


// Returns the number of nanoseconds to run the given number of iterations of the given FFT size.
static double benchmarkTime(size_t n, const Fft &fft, complex<double> *vec, uint64_t iterations) {
	for (size_t i = 0; i < n; i++)
		vec[i] = complex<double>(realDist(randGen), realDist(randGen));
	
	using std::chrono::high_resolution_clock;
	using std::chrono::time_point;
	
	double result = 0;
	for (uint64_t i = 0; i < iterations; i++) {
		time_point<high_resolution_clock> startTime = high_resolution_clock::now();
		fft.transform(vec);
		time_point<high_resolution_clock> endTime = high_resolution_clock::now();
		result += std::chrono::duration<double,std::nano>(endTime - startTime).count();
		
		if (i % 2 == 1) {  // Normalize vector to avoid going to infinity
			double scaler = 1.0 / n;
			for (size_t j = 0; j < n; j++)
				vec[j] *= scaler;
		}
	}
	return result;
}
