/* 
 * Simple sample image using Tiny PNG Output (C)
 * 
 * Copyright (c) 2017 Project Nayuki
 * https://www.nayuki.io/page/tiny-png-output-c
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

#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include "TinyPngOut.h"


int main(void) {
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
	FILE *fout = fopen("demo-rgb.png", "wb");
	struct TinyPngOut pngout;
	if (fout == NULL || TinyPngOut_init(&pngout, fout, width, height) != TINYPNGOUT_OK)
		goto error;
	
	// Write image data
	if (TinyPngOut_write(&pngout, pixels, width * height) != TINYPNGOUT_OK)
		goto error;
	
	// Check for proper completion
	if (TinyPngOut_write(&pngout, NULL, 0) != TINYPNGOUT_DONE)
		goto error;
	fclose(fout);
	return EXIT_SUCCESS;
	
error:
	fprintf(stderr, "Error\n");
	if (fout != NULL)
		fclose(fout);
	return EXIT_FAILURE;
}
