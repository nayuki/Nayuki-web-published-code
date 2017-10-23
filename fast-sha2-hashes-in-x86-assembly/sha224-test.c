/* 
 * SHA-224 hash in C and x86 assembly
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/fast-sha2-hashes-in-x86-assembly
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
#define STATE_LEN 8  // In words
#define HASH_LEN (STATE_LEN-1)  // In words

static bool self_check(void);
void sha224_hash(const uint8_t message[], size_t len, uint32_t hash[static HASH_LEN]);

// Link this program with an external C or x86 compression function
extern void sha256_compress(uint32_t state[static STATE_LEN], const uint8_t block[static BLOCK_LEN]);


/* Main program */

int main(void) {
	// Self-check
	if (!self_check()) {
		printf("Self-check failed\n");
		return EXIT_FAILURE;
	}
	printf("Self-check passed\n");
	
	// Benchmark speed
	uint32_t state[STATE_LEN] = {0};
	uint8_t block[BLOCK_LEN] = {0};
	const long ITERS = 3000000;
	clock_t start_time = clock();
	for (long i = 0; i < ITERS; i++)
		sha256_compress(state, block);
	printf("Speed: %.1f MB/s\n", (double)ITERS * (sizeof(block) / sizeof(block[0]))
		/ (clock() - start_time) * CLOCKS_PER_SEC / 1000000);
	
	return EXIT_SUCCESS;
}


/* Test vectors and checker */

static bool self_check(void) {
	struct TestCase {
		uint32_t answer[HASH_LEN];
		const char *message;
	};

	static const struct TestCase cases[] = {
		#define TESTCASE(a,b,c,d,e,f,g,msg) {{UINT32_C(a),UINT32_C(b),UINT32_C(c),UINT32_C(d),UINT32_C(e),UINT32_C(f),UINT32_C(g)}, msg}
		TESTCASE(0xD14A028C,0x2A3A2BC9,0x476102BB,0x288234C4,0x15A2B01F,0x828EA62A,0xC5B3E42F, ""),
		TESTCASE(0x23097D22,0x3405D822,0x8642A477,0xBDA255B3,0x2AADBCE4,0xBDA0B3F7,0xE36C9DA7, "abc"),
		TESTCASE(0x75388B16,0x512776CC,0x5DBA5DA1,0xFD890150,0xB0C6455C,0xB4F58B19,0x52522525, "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"),
		#undef TESTCASE
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
		
		uint32_t hash[HASH_LEN];
		sha224_hash(msg, len, hash);
		if (memcmp(hash, tc->answer, sizeof(tc->answer)) != 0)
			return false;
		free(msg);
	}
	return true;
}


/* Full message hasher */

void sha224_hash(const uint8_t message[], size_t len, uint32_t hash[static HASH_LEN]) {
	uint32_t state[STATE_LEN] = {
		UINT32_C(0xC1059ED8),
		UINT32_C(0x367CD507),
		UINT32_C(0x3070DD17),
		UINT32_C(0xF70E5939),
		UINT32_C(0xFFC00B31),
		UINT32_C(0x68581511),
		UINT32_C(0x64F98FA7),
		UINT32_C(0xBEFA4FA4),
	};
	
	#define LENGTH_SIZE 8  // In bytes
	
	size_t off;
	for (off = 0; len - off >= BLOCK_LEN; off += BLOCK_LEN)
		sha256_compress(state, &message[off]);
	
	uint8_t block[BLOCK_LEN] = {0};
	size_t rem = len - off;
	memcpy(block, &message[off], rem);
	
	block[rem] = 0x80;
	rem++;
	if (BLOCK_LEN - rem < LENGTH_SIZE) {
		sha256_compress(state, block);
		memset(block, 0, sizeof(block));
	}
	
	block[BLOCK_LEN - 1] = (uint8_t)((len & 0x1FU) << 3);
	len >>= 5;
	for (int i = 1; i < LENGTH_SIZE; i++, len >>= 8)
		block[BLOCK_LEN - 1 - i] = (uint8_t)(len & 0xFFU);
	sha256_compress(state, block);
	
	memcpy(hash, state, HASH_LEN * sizeof(uint32_t));
}
