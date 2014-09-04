/* 
 * Mandlebrot image using Tiny PNG Output (C)
 * 
 * Copyright (c) 2014 Nayuki Minase
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

#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include "TinyPngOut.h"


/* Image parameters */

static const int width  = 512;
static const int height = 512;

static const double xMin = -1.9;
static const double xMax =  0.5;
static const double yMin = -1.2;
static const double yMax =  1.2;

static const int iterations = 1000;


/* Local declarations */

#define MIN(x, y) ((x) <= (y) ? (x) : (y))

static uint32_t mandelbrot(double x, double y);


/* Function implementations */

int main(int argc, char **argv) {
	// Initialize
	FILE *fout = fopen("demo-mandelbrot.png", "wb");
	struct TinyPngOut pngout;
	if (fout == NULL || TinyPngOut_init(&pngout, fout, width, height) != TINYPNGOUT_OK)
		goto error;
	
	// Compute and write Mandelbrot one line at a time
	uint8_t *line = malloc(width * 3 * sizeof(uint8_t));
	int y;
	for (y = 0; y < height; y++) {
		int x;
		for (x = 0; x < width; x++) {
			uint32_t pix = mandelbrot(xMin + (x + 0.5) / width * (xMax - xMin), yMax - (y + 0.5) / height * (yMax - yMin));
			line[x * 3 + 0] = (uint8_t)(pix >> 16);
			line[x * 3 + 1] = (uint8_t)(pix >>  8);
			line[x * 3 + 2] = (uint8_t)(pix >>  0);
		}
		if (TinyPngOut_write(&pngout, line, width) != TINYPNGOUT_OK)
			goto error;
	}
	
	// Finalize
	free(line);
	if (TinyPngOut_write(&pngout, NULL, 0) != TINYPNGOUT_DONE)
		goto error;
	fclose(fout);
	return 0;
	
error:
	fprintf(stderr, "Error\n");
	if (fout != NULL)
		fclose(fout);
	return 1;
}


static uint32_t mandelbrot(double x, double y) {
	double zr = 0;
	double zi = 0;
	int i;
	for (i = 0; i < iterations; i++) {
		if (zr * zr + zi * zi > 4)
			break;
		double temp = zr * zr - zi * zi + x;
		zi = 2 * zr * zi + y;
		zr = temp;
	}
	double j = (double)i / iterations;
	return (int)(pow(j, 0.6) * 255 + 0.5) << 16
	     | (int)(pow(j, 0.3) * 255 + 0.5) <<  8
	     | (int)(pow(j, 0.1) * 255 + 0.5) <<  0;
}
