/* 
 * SHA-256 hash in C and x86 assembly
 * 
 * Copyright (c) 2014 Project Nayuki
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

#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>


/* Function prototypes */

static int self_check(void);
void sha256_hash(const uint8_t *message, uint32_t len, uint32_t hash[8]);

// Link this program with an external C or x86 compression function
extern void sha256_compress(uint32_t state[8], const uint8_t block[64]);


/* Main program */

int main(int argc, char **argv) {
	if (!self_check()) {
		printf("Self-check failed\n");
		return 1;
	}
	printf("Self-check passed\n");
	
	// Benchmark speed
	uint32_t state[8] = {};
	uint32_t block[16] = {};
	const int N = 3000000;
	clock_t start_time = clock();
	int i;
	for (i = 0; i < N; i++)
		sha256_compress(state, (uint8_t *)block);  // Type-punning
	printf("Speed: %.1f MiB/s\n", (double)N * sizeof(block) / (clock() - start_time) * CLOCKS_PER_SEC / 1048576);
	
	return 0;
}


/* Self-check */

struct testcase {
	uint32_t answer[8];
	const uint8_t *message;
};

#define TESTCASE(a,b,c,d,e,f,g,h,msg) {{UINT32_C(a),UINT32_C(b),UINT32_C(c),UINT32_C(d),UINT32_C(e),UINT32_C(f),UINT32_C(g),UINT32_C(h)}, (const uint8_t *)msg}

static struct testcase testCases[] = {
	TESTCASE(0xE3B0C442,0x98FC1C14,0x9AFBF4C8,0x996FB924,0x27AE41E4,0x649B934C,0xA495991B,0x7852B855, ""),
	TESTCASE(0xCA978112,0xCA1BBDCA,0xFAC231B3,0x9A23DC4D,0xA786EFF8,0x147C4E72,0xB9807785,0xAFEE48BB, "a"),
	TESTCASE(0xBA7816BF,0x8F01CFEA,0x414140DE,0x5DAE2223,0xB00361A3,0x96177A9C,0xB410FF61,0xF20015AD, "abc"),
	TESTCASE(0xF7846F55,0xCF23E14E,0xEBEAB5B4,0xE1550CAD,0x5B509E33,0x48FBC4EF,0xA3A1413D,0x393CB650, "message digest"),
	TESTCASE(0x71C480DF,0x93D6AE2F,0x1EFAD144,0x7C66C952,0x5E316218,0xCF51FC8D,0x9ED832F2,0xDAF18B73, "abcdefghijklmnopqrstuvwxyz"),
	TESTCASE(0x248D6A61,0xD20638B8,0xE5C02693,0x0C3E6039,0xA33CE459,0x64FF2167,0xF6ECEDD4,0x19DB06C1, "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"),
};

static int self_check(void) {
	unsigned int i;
	for (i = 0; i < sizeof(testCases) / sizeof(testCases[i]); i++) {
		struct testcase *tc = &testCases[i];
		uint32_t hash[8];
		sha256_hash(tc->message, strlen((const char *)tc->message), hash);
		if (memcmp(hash, tc->answer, sizeof(tc->answer)) != 0)
			return 0;
	}
	return 1;
}


/* Full message hasher */

void sha256_hash(const uint8_t *message, uint32_t len, uint32_t hash[8]) {
	hash[0] = UINT32_C(0x6A09E667);
	hash[1] = UINT32_C(0xBB67AE85);
	hash[2] = UINT32_C(0x3C6EF372);
	hash[3] = UINT32_C(0xA54FF53A);
	hash[4] = UINT32_C(0x510E527F);
	hash[5] = UINT32_C(0x9B05688C);
	hash[6] = UINT32_C(0x1F83D9AB);
	hash[7] = UINT32_C(0x5BE0CD19);
	
	uint32_t i;
	for (i = 0; len - i >= 64; i += 64)
		sha256_compress(hash, message + i);
	
	uint8_t block[64];
	uint32_t rem = len - i;
	memcpy(block, message + i, rem);
	
	block[rem] = 0x80;
	rem++;
	if (64 - rem >= 8)
		memset(block + rem, 0, 56 - rem);
	else {
		memset(block + rem, 0, 64 - rem);
		sha256_compress(hash, block);
		memset(block, 0, 56);
	}
	
	uint64_t longLen = ((uint64_t)len) << 3;
	for (i = 0; i < 8; i++)
		block[64 - 1 - i] = (uint8_t)(longLen >> (i * 8));
	sha256_compress(hash, block);
}
