/* 
 * Simulated annealing on image demo (C)
 * 
 * Copyright (c) 2015 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * http://www.nayuki.io/page/simulated-annealing-demo
 */

#include <inttypes.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>


/*---- Configurable parameters ----*/

#define WIDTH  256
#define HEIGHT 256
const int64_t ITERATIONS = INT64_C(1000000000);
const double START_TEMPERATURE = 300.0;


/*---- Early declarations ----*/

struct MtRandom {
	int index;  // From 0 to 624, inclusive
	uint32_t state[624];
};

void     MtRandom_init(struct MtRandom *mt, uint32_t seed);
uint32_t MtRandom_next_int(struct MtRandom *mt);
uint32_t MtRandom_next_int_bounded(struct MtRandom *mt, uint32_t bound);
double   MtRandom_next_double(struct MtRandom *mt);
void     MtRandom_reseed(struct MtRandom *mt);

void write_bmp_image(const uint32_t *pixels, uint32_t width, uint32_t height, const char *filepath);
uint32_t pixel_diff(uint32_t p0, uint32_t p1);
double fast_2_pow(double x);
int abs(int x);


/*---- Main program ----*/

int main(int argc, char **argv) {
	// Create initial image state deterministically
	struct MtRandom mt;
	uint32_t pixels[WIDTH * HEIGHT];
	int64_t i;
	MtRandom_init(&mt, 0);
	for (i = 0; i < WIDTH * HEIGHT; i++)
		pixels[i] = MtRandom_next_int(&mt) & UINT32_C(0xFFFFFF);
	
	// Calculate energy level
	int energy = 0;
	int y;
	for (y = 0; y < HEIGHT; y++) {
		int x;
		for (x = 0; x < WIDTH; x++) {
			if (x > 0)  // Horizontal pixel differences
				energy += pixel_diff(pixels[y * WIDTH + x], pixels[y * WIDTH + (x - 1)]);
			if (y > 0)  // Vertical pixel differences
				energy += pixel_diff(pixels[y * WIDTH + x], pixels[(y - 1) * WIDTH + x]);
		}
	}
	
	// Perform simulated annealing
	fprintf(stderr, "    Done       Iterations      Energy  SwapDiff  Temperature  AcceptProb\n");
	for (i = 0; i < ITERATIONS; i++) {
		// Re-seed periodically for excellent random distribution on long sequences
		if ((i & INT64_C(0xFFFFFFF)) == 0)
			MtRandom_reseed(&mt);
		
		double t = (double)i / ITERATIONS;  // Normalized time from 0.0 to 1.0
		double temperature = (1 - t) * START_TEMPERATURE;  // Cooling schedule function
		
		int dir = MtRandom_next_int(&mt) >> 31;
		int x0, y0, x1, y1;
		if (dir == 1) {  // Horizontal swap with (x + 1, y)
			x0 = MtRandom_next_int_bounded(&mt, WIDTH - 1);
			y0 = MtRandom_next_int_bounded(&mt, HEIGHT);
			x1 = x0 + 1;
			y1 = y0;
		} else {  // Vertical swap with (x, y + 1)
			x0 = MtRandom_next_int_bounded(&mt, WIDTH);
			y0 = MtRandom_next_int_bounded(&mt, HEIGHT - 1);
			x1 = x0;
			y1 = y0 + 1;
		}
		int index0 = y0 * WIDTH + x0;
		int index1 = y1 * WIDTH + x1;
		uint32_t pix0 = pixels[index0];
		uint32_t pix1 = pixels[index1];
		int energydiff = 0;
		
		// Subtract old local energies, then add new
		if (dir == 1) {
			if (x0 > 0) {
				energydiff -= pixel_diff(pix0, pixels[index0 - 1]);
				energydiff += pixel_diff(pix1, pixels[index0 - 1]);
			}
			if (x1 + 1 < WIDTH) {
				energydiff -= pixel_diff(pix1, pixels[index1 + 1]);
				energydiff += pixel_diff(pix0, pixels[index1 + 1]);
			}
			if (y0 > 0) {
				energydiff -= pixel_diff(pix0, pixels[index0 - WIDTH]);
				energydiff += pixel_diff(pix1, pixels[index0 - WIDTH]);
				energydiff -= pixel_diff(pix1, pixels[index1 - WIDTH]);
				energydiff += pixel_diff(pix0, pixels[index1 - WIDTH]);
			}
			if (y0 + 1 < HEIGHT) {
				energydiff -= pixel_diff(pix0, pixels[index0 + WIDTH]);
				energydiff += pixel_diff(pix1, pixels[index0 + WIDTH]);
				energydiff -= pixel_diff(pix1, pixels[index1 + WIDTH]);
				energydiff += pixel_diff(pix0, pixels[index1 + WIDTH]);
			}
		} else {
			if (y0 > 0) {
				energydiff -= pixel_diff(pix0, pixels[index0 - WIDTH]);
				energydiff += pixel_diff(pix1, pixels[index0 - WIDTH]);
			}
			if (y1 + 1 < HEIGHT) {
				energydiff -= pixel_diff(pix1, pixels[index1 + WIDTH]);
				energydiff += pixel_diff(pix0, pixels[index1 + WIDTH]);
			}
			if (x0 > 0) {
				energydiff -= pixel_diff(pix0, pixels[index0 - 1]);
				energydiff += pixel_diff(pix1, pixels[index0 - 1]);
				energydiff -= pixel_diff(pix1, pixels[index1 - 1]);
				energydiff += pixel_diff(pix0, pixels[index1 - 1]);
			}
			if (x0 + 1 < WIDTH) {
				energydiff -= pixel_diff(pix0, pixels[index0 + 1]);
				energydiff += pixel_diff(pix1, pixels[index0 + 1]);
				energydiff -= pixel_diff(pix1, pixels[index1 + 1]);
				energydiff += pixel_diff(pix0, pixels[index1 + 1]);
			}
		}
		
		// Probabilistic conditional acceptance
		if ((i & INT64_C(0xFFFFFF)) == 0)
			fprintf(stderr, "%7.3f%%  %15"PRId64"  %10d  %8d  %11.3f  %10.8f\n", t * 100, i, energy, energydiff, temperature, fmin(fast_2_pow(-energydiff / temperature), 1.0));
		if (energydiff < 0 || MtRandom_next_double(&mt) < fast_2_pow(-energydiff / temperature)) {
			// Accept new image state
			pixels[index0] = pix1;
			pixels[index1] = pix0;
			energy += energydiff;
		}  // Else discard the proposed change
	}
	
	// Write image to file
	char filename[100] = {};
	int code = snprintf(filename, sizeof(filename), "simulated-annealing-time%"PRId64"-iters%"PRId64"-starttemp%.1f.bmp", (int64_t)time(NULL) * 1000, ITERATIONS, START_TEMPERATURE);
	if (code < 0 || code + 1 > sizeof(filename))
		strncpy(filename, "simulated-annealing.bmp", sizeof(filename));
	write_bmp_image(pixels, WIDTH, HEIGHT, filename);
	return 0;
}


void write_bmp_image(const uint32_t *pixels, uint32_t width, uint32_t height, const char *filepath) {
	// Allocate objects
	FILE *f = fopen(filepath, "wb");
	int rowsize = (width * 3 + 3) / 4 * 4;
	uint8_t *row = calloc(rowsize, sizeof(uint8_t));
	if (f == NULL) {
		perror("fopen");
		exit(1);
	}
	if (row == NULL) {
		perror("calloc");
		exit(1);
	}
	
	// Write header
	uint32_t imagesize = rowsize * height;
	uint32_t filesize = imagesize + 54;
	uint8_t header[54] = {
		'B', 'M',
		filesize >> 0, filesize >> 8, filesize >> 16, filesize >> 24,
		0, 0,
		0, 0,
		54, 0, 0, 0,
		40, 0, 0, 0,
		width >> 0, width >> 8, width >> 16, width >> 24,
		height >> 0, height >> 8, height >> 16, height >> 24,
		1, 0,
		24, 0,
		0, 0, 0, 0,
		imagesize >> 0, imagesize >> 8, imagesize >> 16, imagesize >> 24,
		196, 14, 0, 0,
		196, 14, 0, 0,
		0, 0, 0, 0,
		0, 0, 0, 0,
	};
	if (fwrite(header, sizeof(uint8_t), sizeof(header) / sizeof(uint8_t), f) != sizeof(header) / sizeof(uint8_t)) {
		perror("fwrite");
		exit(1);
	}
	
	// Write image rows
	int y;
	for (y = height - 1; y >= 0; y--) {
		int x;
		for (x = 0; x < width; x++) {
			uint32_t p = pixels[y * width + x];
			row[x * 3 + 0] = (p >>  0) & 0xFF;
			row[x * 3 + 1] = (p >>  8) & 0xFF;
			row[x * 3 + 2] = (p >> 16) & 0xFF;
		}
		if (fwrite(row, sizeof(uint8_t), rowsize, f) != rowsize) {
			perror("fwrite");
			exit(1);
		}
	}
	
	// Clean up
	if (fclose(f) != 0) {
		perror("fclose");
		exit(1);
	}
	free(row);
}


uint32_t pixel_diff(uint32_t p0, uint32_t p1) {
	int r0 = p0 >> 16, g0 = (p0 >> 8) & 0xFF, b0 = p0 & 0xFF;
	int r1 = p1 >> 16, g1 = (p1 >> 8) & 0xFF, b1 = p1 & 0xFF;
	return (uint32_t)(abs(r0 - r1) + abs(g0 - g1) + abs(b0 - b1));
}


// Computes 2^x in a fast manner. Maximum relative error of 0.019% on the input range [-1020, 1020], guaranteed.
double fast_2_pow(double x) {
	if (x < -1022)
		return 0;
	if (x >= 1024)
		return INFINITY;
	double y = floor(x);
	double z = x - y;  // In the range [0.0, 1.0)
	uint64_t c = (uint64_t)((int)y + 1023) << 52;
	double a;
	memcpy(&a, &c, sizeof(a));  // Equal to 2^floor(x)
	// Coefficients from numerical minimization in Wolfram Mathematica
	double b = 0.99981190792895544660 + z * (0.69683883597650776993 + z * (0.22412622970387342355 + z * 0.07901988694851840505));
	return a * b;
}


int abs(int x) {
	return x >= 0 ? x : -x;
}


/*---- Mersenne Twister random number generator library ----*/

/*
 * The C code was cleaned up by Project Nayuki. The numerical output is identical.
 */

/* 
 * A C-program for MT19937, with initialization improved 2002/1/26.
 * Coded by Takuji Nishimura and Makoto Matsumoto.
 * 
 * Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura,
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 
 *   1. Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *
 *   2. Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *
 *   3. The names of its contributors may not be used to endorse or promote
 *      products derived from this software without specific prior written
 *      permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * Any feedback is very welcome.
 * http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html
 * email: m-mat @ math.sci.hiroshima-u.ac.jp (remove space)
 */

void MtRandom_next_state(struct MtRandom *mt);


void MtRandom_init(struct MtRandom *mt, uint32_t seed) {
	unsigned int i;
	for (i = 0; i < 624; i++) {
		mt->state[i] = seed;
		seed = UINT32_C(1812433253) * (seed ^ (seed >> 30)) + i + 1;
	}
	mt->index = 624;
}


// Uniform unsigned 32-bit integer.
uint32_t MtRandom_next_int(struct MtRandom *mt) {
	if (mt->index == 624)
		MtRandom_next_state(mt);
	uint32_t x = mt->state[mt->index];
	mt->index++;
	
	// Tempering
	x ^= x >> 11;
	x ^= (x << 7) & UINT32_C(0x9D2C5680);
	x ^= (x << 15) & UINT32_C(0xEFC60000);
	return x ^ (x >> 18);
}


// Unbiased generator of integers in the range [0, bound).
uint32_t MtRandom_next_int_bounded(struct MtRandom *mt, uint32_t bound) {
	while (1) {
		uint32_t raw = MtRandom_next_int(mt);
		uint32_t val = raw % bound;
		if (UINT32_MAX - (raw - val) >= bound - 1)
			return val;
	}
	
	/*
	// Alternate version to match java.util.Random.nextInt(int bound):
	if ((bound & (bound - 1)) == 0)  // Is power of 2
		return (uint32_t)(((uint64_t)bound * MtRandom_next_int(mt)) >> 32);
	while (1) {
		uint32_t raw = MtRandom_next_int(mt) >> 1;
		uint32_t val = raw % bound;
		if ((UINT32_MAX >> 1) - (raw - val) >= bound - 1)
			return val;
	}
	*/
}


// Uniform double in the range [0.0, 1.0).
double MtRandom_next_double(struct MtRandom *mt) {
	uint64_t temp = MtRandom_next_int(mt) >> 6;
	temp = (temp << 27) | (MtRandom_next_int(mt) >> 5);
	return (double)temp / 9007199254740992.0;
}


// Private function, for MtRandom internal use only.
void MtRandom_next_state(struct MtRandom *mt) {
	int k = 0;
	for (; k < 227; k++) {
		uint32_t y = (mt->state[k] & 0x80000000) | (mt->state[k + 1] & 0x7FFFFFFF);
		mt->state[k] = mt->state[k + 397] ^ (y >> 1) ^ ((y & 1) * 0x9908B0DF);
	}
	for (; k < 623; k++) {
		uint32_t y = (mt->state[k] & 0x80000000) | (mt->state[k + 1] & 0x7FFFFFFF);
		mt->state[k] = mt->state[k - 227] ^ (y >> 1) ^ ((y & 1) * 0x9908B0DF);
	}
	uint32_t y = (mt->state[623] & 0x80000000) | (mt->state[0] & 0x7FFFFFFF);
	mt->state[623] = mt->state[396] ^ (y >> 1) ^ ((y & 1) * 0x9908B0DF);
	mt->index = 0;
}


void MtRandom_reseed(struct MtRandom *mt) {
	FILE *f = fopen("/dev/urandom", "rb");
	if (f == NULL)
		fprintf(stderr, "Reseed failed\n");
	
	int i;
	for (i = 0; i < 624 * 4; i++) {
		int c = fgetc(f);
		if (c == EOF) {
			if (ferror(f)) {
				perror("fgetc");
				exit(1);
			} else {
				fprintf(stderr, "fgetc: Unexpected EOF\n");
				exit(1);
			}
		}
		// Blend random byte into state
		mt->state[i / 4] ^= (uint32_t)c << (i % 4 * 8);
	}
	
	if (fclose(f) != 0) {
		perror("fclose");
		exit(1);
	}
}
