/* 
 * Split testing for Tiny PNG Output (C++)
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

#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <iostream>
#include <limits>
#include <sstream>
#include <string>
#include <random>
#include <vector>
#include "TinyPngOut.hpp"

using std::uint8_t;
using std::uint32_t;
using std::uint64_t;
using std::size_t;
using std::uniform_int_distribution;


static void test(uint32_t width, uint32_t height, long trials);


std::default_random_engine randGen((std::random_device())());
uniform_int_distribution<uint8_t> byteDist(0x00, 0xFF);


int main() {
	try {
		uniform_int_distribution<uint32_t> dimensionDist(0, 100000);
		for (long i = 0; ; ) {
			uint32_t width = dimensionDist(randGen);
			uint32_t height = dimensionDist(randGen);
			if (width > 0 && height > 0 && static_cast<uint64_t>(width) * height * 3 < 1000000) {
				std::cerr << "Test " << i << ":  ";
				std::cerr << "width=" << width << " ";
				std::cerr << "height=" << height << " ";
				std::cerr << "pixels=" << width * height << " ";
				std::cerr << "bytes=" << width * height * 3 << std::endl;
				test(width, height, 10);
				if (i < std::numeric_limits<decltype(i)>::max())
					i++;
			}
		}
		return EXIT_SUCCESS;
		
	} catch (const char *msg) {
		std::cerr << msg << std::endl;
		return EXIT_FAILURE;
	}
}


static void test(uint32_t width, uint32_t height, long trials) {
	// Generate array of random pixel values
	size_t numPixels = static_cast<size_t>(width) * height;
	std::vector<uint8_t> pixelBytes(numPixels * 3);
	for (auto it = pixelBytes.begin(); it != pixelBytes.cend(); ++it)
		*it = byteDist(randGen);
	
	// Write entire image in one shot
	std::string reference;
	{
		std::stringstream out;
		TinyPngOut pngout(static_cast<uint32_t>(width), static_cast<uint32_t>(height), out);
		pngout.write(pixelBytes.data(), numPixels);
		reference = out.str();
	}
	
	// Try writing in different splits
	for (long i = 0; i < trials; i++) {
		std::cerr << "    Trial " << i << ":  ";
		std::stringstream out;
		TinyPngOut pngout(static_cast<uint32_t>(width), static_cast<uint32_t>(height), out);
		
		size_t offset = 0;
		while (offset < numPixels) {
			uniform_int_distribution<size_t> dist(0, numPixels - offset);
			size_t count = dist(randGen);
			std::cerr << count << " " << std::flush;
			pngout.write(pixelBytes.data() + offset * 3, count);
			offset += count;
		}
		
		std::string actual = out.str();
		std::cerr << (actual == reference ? "Same" : "Different") << std::endl;
		if (actual != reference)
			throw "Data mismatch";
	}
}
