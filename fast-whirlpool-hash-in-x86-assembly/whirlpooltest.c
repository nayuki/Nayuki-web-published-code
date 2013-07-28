/* 
 * Whirlpool hash in C and x86 assembly
 * 
 * Copyright (c) 2012 Nayuki Minase. All rights reserved.
 * http://nayuki.eigenstate.org/page/fast-whirlpool-hash-in-x86-assembly
 */


#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>


/* Function prototypes */

static int self_check(void);
void whirlpool_hash(uint8_t *message, uint32_t len, uint8_t *hash);

// Link this program with an external C or x86 compression function
extern void whirlpool_compress(uint8_t *state, uint8_t *block);


/* Main program */

int main(int argc, char **argv) {
	if (!self_check()) {
		printf("Self-check failed\n");
		return 1;
	}
	printf("Self-check passed\n");
	
	// Benchmark speed
	uint8_t state[64];
	uint8_t block[64];
	const int N = 2000000;
	clock_t start_time = clock();
	int i;
	for (i = 0; i < N; i++)
		whirlpool_compress(state, block);
	printf("Speed: %.2f MiB/s\n", (double)N * 64 / (clock() - start_time) * CLOCKS_PER_SEC / 1048576);
	
	return 0;
}


/* Self-check */

static uint8_t answer0[] =
	{0x19, 0xFA, 0x61, 0xD7, 0x55, 0x22, 0xA4, 0x66, 0x9B, 0x44, 0xE3, 0x9C, 0x1D, 0x2E, 0x17, 0x26, 0xC5, 0x30, 0x23, 0x21, 0x30, 0xD4, 0x07, 0xF8, 0x9A, 0xFE, 0xE0, 0x96, 0x49, 0x97, 0xF7, 0xA7,
	 0x3E, 0x83, 0xBE, 0x69, 0x8B, 0x28, 0x8F, 0xEB, 0xCF, 0x88, 0xE3, 0xE0, 0x3C, 0x4F, 0x07, 0x57, 0xEA, 0x89, 0x64, 0xE5, 0x9B, 0x63, 0xD9, 0x37, 0x08, 0xB1, 0x38, 0xCC, 0x42, 0xA6, 0x6E, 0xB3};
static uint8_t answer1[] =
	{0xB9, 0x7D, 0xE5, 0x12, 0xE9, 0x1E, 0x38, 0x28, 0xB4, 0x0D, 0x2B, 0x0F, 0xDC, 0xE9, 0xCE, 0xB3, 0xC4, 0xA7, 0x1F, 0x9B, 0xEA, 0x8D, 0x88, 0xE7, 0x5C, 0x4F, 0xA8, 0x54, 0xDF, 0x36, 0x72, 0x5F,
	 0xD2, 0xB5, 0x2E, 0xB6, 0x54, 0x4E, 0xDC, 0xAC, 0xD6, 0xF8, 0xBE, 0xDD, 0xFE, 0xA4, 0x03, 0xCB, 0x55, 0xAE, 0x31, 0xF0, 0x3A, 0xD6, 0x2A, 0x5E, 0xF5, 0x4E, 0x42, 0xEE, 0x82, 0xC3, 0xFB, 0x35};

static int self_check(void) {
	uint8_t hash[64];
	
	whirlpool_hash((uint8_t*)"", 0, hash);
	if (memcmp(hash, answer0, 64) != 0) return 0;
	
	whirlpool_hash((uint8_t*)"The quick brown fox jumps over the lazy dog", 43, hash);
	if (memcmp(hash, answer1, 64) != 0) return 0;
	
	return 1;
}


/* Full message hasher */

void whirlpool_hash(uint8_t *message, uint32_t len, uint8_t *hash) {
	memset(hash, 0, 64);
	
	int i;
	for (i = 0; i + 64 <= len; i += 64)
		whirlpool_compress(hash, message + i);
	
	uint8_t block[64];
	int rem = len - i;
	memcpy(block, message + i, rem);
	
	block[rem] = 0x80;
	rem++;
	if (64 - rem >= 32)
		memset(block + rem, 0, 56 - rem);
	else {
		memset(block + rem, 0, 64 - rem);
		whirlpool_compress(hash, block);
		memset(block, 0, 56);
	}
	
	uint64_t longLen = ((uint64_t)len) << 3;
	for (i = 0; i < 8; i++)
		block[64 - 1 - i] = (uint8_t)(longLen >> (i * 8));
	whirlpool_compress(hash, block);
}
