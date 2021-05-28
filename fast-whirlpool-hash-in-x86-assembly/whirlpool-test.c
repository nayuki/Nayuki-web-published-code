/* 
 * Whirlpool hash in C and x86 assembly
 * 
 * Copyright (c) 2021 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/fast-whirlpool-hash-in-x86-assembly
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

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>


/* Function prototypes */

#define BLOCK_LEN 64  // In bytes
#define STATE_LEN 64  // In bytes

static bool self_check(void);
void whirlpool_hash(const uint8_t message[], size_t len, uint8_t hash[static STATE_LEN]);

// Link this program with an external C or x86 compression function
extern void whirlpool_compress(uint8_t state[static STATE_LEN], const uint8_t block[static BLOCK_LEN]);


/* Main program */

int main(void) {
	// Self-check
	if (!self_check()) {
		printf("Self-check failed\n");
		return EXIT_FAILURE;
	}
	printf("Self-check passed\n");
	
	// Benchmark speed
	uint8_t state[STATE_LEN] = {0};
	uint8_t block[BLOCK_LEN] = {0};
	const long ITERS = 1000000;
	clock_t start_time = clock();
	for (long i = 0; i < ITERS; i++)
		whirlpool_compress(state, block);
	printf("Speed: %.1f MB/s\n", (double)ITERS * (sizeof(block) / sizeof(block[0]))
		/ (clock() - start_time) * CLOCKS_PER_SEC / 1000000);
	
	return EXIT_SUCCESS;
}


/* Test vectors and checker */

static bool self_check(void) {
	struct TestCase {
		uint8_t answer[STATE_LEN];
		const char *message;
	};
	
	static const struct TestCase cases[] = {
		{{0x19,0xFA,0x61,0xD7,0x55,0x22,0xA4,0x66,0x9B,0x44,0xE3,0x9C,0x1D,0x2E,0x17,0x26,0xC5,0x30,0x23,0x21,0x30,0xD4,0x07,0xF8,0x9A,0xFE,0xE0,0x96,0x49,0x97,0xF7,0xA7,0x3E,0x83,0xBE,0x69,0x8B,0x28,0x8F,0xEB,0xCF,0x88,0xE3,0xE0,0x3C,0x4F,0x07,0x57,0xEA,0x89,0x64,0xE5,0x9B,0x63,0xD9,0x37,0x08,0xB1,0x38,0xCC,0x42,0xA6,0x6E,0xB3},
			""},
		{{0x8A,0xCA,0x26,0x02,0x79,0x2A,0xEC,0x6F,0x11,0xA6,0x72,0x06,0x53,0x1F,0xB7,0xD7,0xF0,0xDF,0xF5,0x94,0x13,0x14,0x5E,0x69,0x73,0xC4,0x50,0x01,0xD0,0x08,0x7B,0x42,0xD1,0x1B,0xC6,0x45,0x41,0x3A,0xEF,0xF6,0x3A,0x42,0x39,0x1A,0x39,0x14,0x5A,0x59,0x1A,0x92,0x20,0x0D,0x56,0x01,0x95,0xE5,0x3B,0x47,0x85,0x84,0xFD,0xAE,0x23,0x1A},
			"a"},
		{{0x4E,0x24,0x48,0xA4,0xC6,0xF4,0x86,0xBB,0x16,0xB6,0x56,0x2C,0x73,0xB4,0x02,0x0B,0xF3,0x04,0x3E,0x3A,0x73,0x1B,0xCE,0x72,0x1A,0xE1,0xB3,0x03,0xD9,0x7E,0x6D,0x4C,0x71,0x81,0xEE,0xBD,0xB6,0xC5,0x7E,0x27,0x7D,0x0E,0x34,0x95,0x71,0x14,0xCB,0xD6,0xC7,0x97,0xFC,0x9D,0x95,0xD8,0xB5,0x82,0xD2,0x25,0x29,0x20,0x76,0xD4,0xEE,0xF5},
			"abc"},
		{{0x37,0x8C,0x84,0xA4,0x12,0x6E,0x2D,0xC6,0xE5,0x6D,0xCC,0x74,0x58,0x37,0x7A,0xAC,0x83,0x8D,0x00,0x03,0x22,0x30,0xF5,0x3C,0xE1,0xF5,0x70,0x0C,0x0F,0xFB,0x4D,0x3B,0x84,0x21,0x55,0x76,0x59,0xEF,0x55,0xC1,0x06,0xB4,0xB5,0x2A,0xC5,0xA4,0xAA,0xA6,0x92,0xED,0x92,0x00,0x52,0x83,0x8F,0x33,0x62,0xE8,0x6D,0xBD,0x37,0xA8,0x90,0x3E},
			"message digest"},
		{{0xF1,0xD7,0x54,0x66,0x26,0x36,0xFF,0xE9,0x2C,0x82,0xEB,0xB9,0x21,0x2A,0x48,0x4A,0x8D,0x38,0x63,0x1E,0xAD,0x42,0x38,0xF5,0x44,0x2E,0xE1,0x3B,0x80,0x54,0xE4,0x1B,0x08,0xBF,0x2A,0x92,0x51,0xC3,0x0B,0x6A,0x0B,0x8A,0xAE,0x86,0x17,0x7A,0xB4,0xA6,0xF6,0x8F,0x67,0x3E,0x72,0x07,0x86,0x5D,0x5D,0x98,0x19,0xA3,0xDB,0xA4,0xEB,0x3B},
			"abcdefghijklmnopqrstuvwxyz"},
		{{0x52,0x6B,0x23,0x94,0xD8,0x56,0x83,0xE2,0x4B,0x29,0xAC,0xD0,0xFD,0x37,0xF7,0xD5,0x02,0x7F,0x61,0x36,0x6A,0x14,0x07,0x26,0x2D,0xC2,0xA6,0xA3,0x45,0xD9,0xE2,0x40,0xC0,0x17,0xC1,0x83,0x3D,0xB1,0xE6,0xDB,0x6A,0x46,0xBD,0x44,0x4B,0x0C,0x69,0x52,0x0C,0x85,0x6E,0x7C,0x6E,0x9C,0x36,0x6D,0x15,0x0A,0x7D,0xA3,0xAE,0xB1,0x60,0xD1},
			"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"},
		{{0xB9,0x7D,0xE5,0x12,0xE9,0x1E,0x38,0x28,0xB4,0x0D,0x2B,0x0F,0xDC,0xE9,0xCE,0xB3,0xC4,0xA7,0x1F,0x9B,0xEA,0x8D,0x88,0xE7,0x5C,0x4F,0xA8,0x54,0xDF,0x36,0x72,0x5F,0xD2,0xB5,0x2E,0xB6,0x54,0x4E,0xDC,0xAC,0xD6,0xF8,0xBE,0xDD,0xFE,0xA4,0x03,0xCB,0x55,0xAE,0x31,0xF0,0x3A,0xD6,0x2A,0x5E,0xF5,0x4E,0x42,0xEE,0x82,0xC3,0xFB,0x35},
			"The quick brown fox jumps over the lazy dog"},
	};
	
	size_t numCases = sizeof(cases) / sizeof(cases[0]);
	for (size_t i = 0; i < numCases; i++) {
		const struct TestCase *tc = &cases[i];
		size_t len = strlen(tc->message);
		uint8_t *msg = calloc(len, sizeof(uint8_t));
		if (msg == NULL) {
			perror("calloc");
			exit(1);
		}
		for (size_t j = 0; j < len; j++)
			msg[j] = (uint8_t)tc->message[j];
		
		uint8_t hash[STATE_LEN];
		whirlpool_hash(msg, len, hash);
		if (memcmp(hash, tc->answer, sizeof(tc->answer)) != 0)
			return false;
		free(msg);
	}
	return true;
}


/* Full message hasher */

void whirlpool_hash(const uint8_t message[], size_t len, uint8_t hash[static STATE_LEN]) {
	memset(hash, 0, STATE_LEN * sizeof(uint8_t));
	
	#define LENGTH_SIZE 32  // In bytes
	
	size_t off;
	for (off = 0; len - off >= BLOCK_LEN; off += BLOCK_LEN)
		whirlpool_compress(hash, &message[off]);
	
	uint8_t block[BLOCK_LEN] = {0};
	size_t rem = len - off;
	if (rem > 0)
		memcpy(block, &message[off], rem);
	
	block[rem] = 0x80;
	rem++;
	if (BLOCK_LEN - rem < LENGTH_SIZE) {
		whirlpool_compress(hash, block);
		memset(block, 0, sizeof(block));
	}
	
	block[BLOCK_LEN - 1] = (uint8_t)((len & 0x1FU) << 3);
	len >>= 5;
	for (int i = 1; i < LENGTH_SIZE; i++, len >>= 8)
		block[BLOCK_LEN - 1 - i] = (uint8_t)(len & 0xFFU);
	whirlpool_compress(hash, block);
}
