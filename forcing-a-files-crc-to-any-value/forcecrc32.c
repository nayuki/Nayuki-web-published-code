/* 
 * CRC-32 forcer (C)
 * 
 * Copyright (c) 2016 Project Nayuki
 * https://www.nayuki.io/page/forcing-a-files-crc-to-any-value
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

#include <inttypes.h>
#include <limits.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "forcecrc32.h"


/* Forward declarations */

static uint32_t reverse_bits(uint32_t x);

static uint64_t multiply_mod(uint64_t x, uint64_t y);
static uint64_t pow_mod(uint64_t x, uint64_t y);
static void divide_and_remainder(uint64_t x, uint64_t y, uint64_t *q, uint64_t *r);
static uint64_t reciprocal_mod(uint64_t x);
static int get_degree(uint64_t x);


/* Primary entry-point */

/* to induce a change of "delta" by changing 4 bytes starting endDistance
* from the end of the data, exclusive-or with the returned value (note,
* endDistance better be at least 4) */

uint32_t reverse_crc32(uint32_t delta, uint64_t endDistance)
{
	// Compute the change to make
	delta = (uint32_t)multiply_mod(reciprocal_mod(pow_mod(2, endDistance * 8)), delta);

	delta = reverse_bits(delta);

	return delta;
}


/* Utilities */

static const uint64_t POLYNOMIAL = UINT64_C(0x104C11DB7);  // Generator polynomial. Do not modify, because there are many dependencies


static uint32_t reverse_bits(uint32_t val) {
	int s;
	// blitter-type solution, rather faster than the naive solution
	const uint32_t masks[] = {0x55555555, 0x33333333, 0xF0F0F0F, 0xFF00FF, 0xFFFF};
	for (s = 0; s<sizeof(masks)/sizeof(masks[0]); ++s)
		val = ((val >> (1<<s)) & masks[s]) | ((val & masks[s]) << (1<<s));

	return val;
}


/* Polynomial arithmetic */

// Returns polynomial x multiplied by polynomial y modulo the generator polynomial.
static uint64_t multiply_mod(uint64_t x, uint64_t y) {
	// Russian peasant multiplication algorithm
	uint64_t z = 0;
	while (y != 0) {
		z ^= x * (y & 1);
		y >>= 1;
		x <<= 1;
		if ((x & UINT64_C(0x100000000)) != 0)
			x ^= POLYNOMIAL;
	}
	return z;
}


// Returns polynomial x to the power of natural number y modulo the generator polynomial.
static uint64_t pow_mod(uint64_t x, uint64_t y) {
	// Exponentiation by squaring
	uint64_t z = 1;
	while (y != 0) {
		if ((y & 1) != 0)
			z = multiply_mod(z, x);
		x = multiply_mod(x, x);
		y >>= 1;
	}
	return z;
}


// Computes polynomial x divided by polynomial y, returning the quotient and remainder.
static void divide_and_remainder(uint64_t x, uint64_t y, uint64_t *q, uint64_t *r) {
	if (y == 0) {
		fprintf(stderr, "Division by zero\n");
		exit(EXIT_FAILURE);
	}
	if (x == 0) {
		*q = 0;
		*r = 0;
		return;
	}

	int ydeg = get_degree(y);
	uint64_t z = 0;
	int i;
	for (i = get_degree(x) - ydeg; i >= 0; i--) {
		if ((x & ((uint64_t)1 << (i + ydeg))) != 0) {
			x ^= y << i;
			z |= (uint64_t)1 << i;
		}
	}
	*q = z;
	*r = x;
}


// Returns the reciprocal of polynomial x with respect to the generator polynomial.
static uint64_t reciprocal_mod(uint64_t x) {
	// Based on a simplification of the extended Euclidean algorithm
	uint64_t y = x;
	x = POLYNOMIAL;
	uint64_t a = 0;
	uint64_t b = 1;
	while (y != 0) {
		uint64_t q, r;
		divide_and_remainder(x, y, &q, &r);
		uint64_t c = a ^ multiply_mod(q, b);
		x = y;
		y = r;
		a = b;
		b = c;
	}
	if (x == 1)
		return a;
	else {
		fprintf(stderr, "Reciprocal does not exist\n");
		exit(EXIT_FAILURE);
	}
}


static int get_degree(uint64_t x) {
	int result = -1;
	while (x != 0) {
		x >>= 1;
		result++;
	}
	return result;
}
