/* 
 * Simple sample image using Tiny PNG Output (C++)
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
#include <fstream>
#include <iostream>
#include "TinyPngOut.hpp"

using std::uint8_t;
using std::uint32_t;
using std::size_t;


int main() {
	// Sample image data:
	//   [red    , green , blue]
	//   [magenta, yellow, cyan]
	constexpr int WIDTH  = 3;
	constexpr int HEIGHT = 2;
	const uint8_t PIXELS[] = {
		0xFF,0x00,0x00,  0x00,0xFF,0x00,  0x00,0x00,0xFF,
		0xFF,0x00,0xFF,  0xFF,0xFF,0x00,  0x00,0xFF,0xFF,
	};
	
	try {
		std::ofstream out("demo-rgb.png", std::ios::binary);
		TinyPngOut pngout(static_cast<uint32_t>(WIDTH), static_cast<uint32_t>(HEIGHT), out);
		pngout.write(PIXELS, static_cast<size_t>(WIDTH * HEIGHT));
		return EXIT_SUCCESS;
		
	} catch (const char *msg) {
		std::cerr << msg << std::endl;
		return EXIT_FAILURE;
	}
}
