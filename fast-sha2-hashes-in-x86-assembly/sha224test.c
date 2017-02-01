/* 
 * SHA-224 hash in C and x86 assembly
 * 
 * Copyright (c) 2017 Project Nayuki
 * https://www.nayuki.io/page/fast-sha2-hashes-in-x86-assembly
 * 
 * (MIT License)
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

static bool self_check(void);
void sha224_hash(const uint8_t *message, size_t len, uint32_t hash[7]);

// Link this program with an external C or x86 compression function
extern void sha256_compress(uint32_t state[8], const uint8_t block[64]);


/* Main program */

int main(void) {
	if (!self_check()) {
		printf("Self-check failed\n");
		return EXIT_FAILURE;
	}
	printf("Self-check passed\n");
	
	// Benchmark speed
	uint32_t state[8] = {0};
	uint32_t block[16] = {0};
	const int N = 3000000;
	clock_t start_time = clock();
	int i;
	for (i = 0; i < N; i++)
		sha256_compress(state, (uint8_t *)block);  // Type-punning
	printf("Speed: %.1f MB/s\n", (double)N * sizeof(block) / (clock() - start_time) * CLOCKS_PER_SEC / 1000000);
	
	return EXIT_SUCCESS;
}


/* Self-check */

struct testcase {
	uint32_t answer[7];
	const uint8_t *message;
};

#define TESTCASE(a,b,c,d,e,f,g,msg) {{UINT32_C(a),UINT32_C(b),UINT32_C(c),UINT32_C(d),UINT32_C(e),UINT32_C(f),UINT32_C(g)}, (const uint8_t *)msg}

static struct testcase testCases[] = {
	TESTCASE(0xD14A028C,0x2A3A2BC9,0x476102BB,0x288234C4,0x15A2B01F,0x828EA62A,0xC5B3E42F, ""),
	TESTCASE(0x23097D22,0x3405D822,0x8642A477,0xBDA255B3,0x2AADBCE4,0xBDA0B3F7,0xE36C9DA7, "abc"),
	TESTCASE(0x75388B16,0x512776CC,0x5DBA5DA1,0xFD890150,0xB0C6455C,0xB4F58B19,0x52522525, "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"),
};

static bool self_check(void) {
	unsigned int i;
	for (i = 0; i < sizeof(testCases) / sizeof(testCases[i]); i++) {
		struct testcase *tc = &testCases[i];
		uint32_t hash[7];
		sha224_hash(tc->message, strlen((const char *)tc->message), hash);
		if (memcmp(hash, tc->answer, sizeof(tc->answer)) != 0)
			return false;
	}
	return true;
}


/* Full message hasher */

void sha224_hash(const uint8_t *message, size_t len, uint32_t hash[7]) {
	uint32_t state[8] = {
		UINT32_C(0xC1059ED8),
		UINT32_C(0x367CD507),
		UINT32_C(0x3070DD17),
		UINT32_C(0xF70E5939),
		UINT32_C(0xFFC00B31),
		UINT32_C(0x68581511),
		UINT32_C(0x64F98FA7),
		UINT32_C(0xBEFA4FA4),
	};
	
	size_t i;
	for (i = 0; len - i >= 64; i += 64)
		sha256_compress(state, &message[i]);
	
	uint8_t block[64];
	size_t rem = len - i;
	memcpy(block, &message[i], rem);
	
	block[rem] = 0x80;
	rem++;
	if (64 - rem >= 8)
		memset(&block[rem], 0, 56 - rem);
	else {
		memset(&block[rem], 0, 64 - rem);
		sha256_compress(state, block);
		memset(block, 0, 56);
	}
	
	block[64 - 1] = (uint8_t)((len & 0x1FU) << 3);
	len >>= 5;
	for (i = 1; i < 8; i++, len >>= 8)
		block[64 - 1 - i] = (uint8_t)len;
	sha256_compress(state, block);
	
	memcpy(hash, state, 7 * sizeof(uint32_t));
}
