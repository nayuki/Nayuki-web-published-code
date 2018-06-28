/* 
 * Mandlebrot image using Tiny PNG Output (C++)
 * 
 * Copyright (c) 2018 Project Nayuki
 * https://www.nayuki.io/page/tiny-png-output
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program (see COPYING.txt and COPYING.LESSER.txt).
 * If not, see <http://www.gnu.org/licenses/>.
 */

#include <cmath>
#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <fstream>
#include <iostream>
#include <vector>
#include "TinyPngOut.hpp"

using std::uint8_t;
using std::uint32_t;
using std::size_t;


/* Image parameters */

static const int width  = 512;
static const int height = 512;

static const double xMin = -1.9;
static const double xMax =  0.5;
static const double yMin = -1.2;
static const double yMax =  1.2;

static const int iterations = 1000;


static uint32_t mandelbrot(int x, int y);


/* Function implementations */

int main() {
	try {
		std::ofstream out("demo-mandelbrot.png", std::ios::binary);
		TinyPngOut pngout(static_cast<uint32_t>(width), static_cast<uint32_t>(height), out);
		std::vector<uint8_t> line(static_cast<size_t>(width) * 3);
		
		// Compute and write Mandelbrot one line at a time
		for (int y = 0; y < height; y++) {
			for (int x = 0; x < width; x++) {
				uint32_t pix = mandelbrot(x, y);
				line[x * 3 + 0] = static_cast<uint8_t>(pix >> 16);
				line[x * 3 + 1] = static_cast<uint8_t>(pix >>  8);
				line[x * 3 + 2] = static_cast<uint8_t>(pix >>  0);
			}
			pngout.write(line.data(), static_cast<size_t>(width));
		}
		return EXIT_SUCCESS;
		
	} catch (const char *msg) {
		std::cerr << msg << std::endl;
		return EXIT_FAILURE;
	}
}


static uint32_t mandelbrot(int x, int y) {
	double cr = xMin + (x + 0.5) / width  * (xMax - xMin);
	double ci = yMax - (y + 0.5) / height * (yMax - yMin);
	double zr = 0;
	double zi = 0;
	int i;
	for (i = 0; i < iterations; i++) {
		if (zr * zr + zi * zi > 4)
			break;
		double temp = zr * zr - zi * zi + cr;
		zi = 2 * zr * zi + ci;
		zr = temp;
	}
	double j = (double)i / iterations;
	return static_cast<uint32_t>(std::pow(j, 0.6) * 255 + 0.5) << 16
	     | static_cast<uint32_t>(std::pow(j, 0.3) * 255 + 0.5) <<  8
	     | static_cast<uint32_t>(std::pow(j, 0.1) * 255 + 0.5) <<  0;
}
