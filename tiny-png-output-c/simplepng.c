/* 
 * Simple sample image for Tiny PNG Output (C)
 * 
 * Copyright (c) 2013 Nayuki Minase
 * http://nayuki.eigenstate.org/page/tiny-png-output-c
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program (see COPYING.txt).
 * If not, see <http://www.gnu.org/licenses/>.
 */

#include <stdint.h>
#include <stdio.h>
#include "TinyPngOut.h"


int main(int argc, char **argv) {
	// Sample image data:
	//   [red    , green , blue]
	//   [magenta, yellow, cyan]
	const int width = 3;
	const int height = 2;
	uint8_t pixels[] = {
		0xFF, 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0xFF,
		0xFF, 0x00, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0xFF, 0xFF,
	};
	
	// Initialize file and Tiny Png Output
	FILE *fout = fopen("demo-rgb.png", "w");
	struct TinyPngOut pngout;
	if (TinyPngOut_init(&pngout, fout, width, height) != TINYPNGOUT_OK) {
		fprintf(stderr, "Error\n");
		return 1;
	}
	
	// Write image data
	if (TinyPngOut_write(&pngout, pixels, width * height) != TINYPNGOUT_OK) {
		fprintf(stderr, "Error\n");
		return 1;
	}
	
	// Check for proper completion
	if (TinyPngOut_write(&pngout, NULL, 0) != TINYPNGOUT_DONE) {
		fprintf(stderr, "Error\n");
		return 1;
	}
	fclose(fout);
	
	return 0;
}
