/* 
 * SHA-256 hash in C and x86 assembly
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

static bool self_check(void);
void sha256_hash(const uint8_t message[], size_t len, uint32_t hash[static STATE_LEN]);

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
		uint32_t answer[STATE_LEN];
		const char *message;
	};
	
	static const struct TestCase cases[] = {
		#define TESTCASE(a,b,c,d,e,f,g,h,msg) {{UINT32_C(a),UINT32_C(b),UINT32_C(c),UINT32_C(d),UINT32_C(e),UINT32_C(f),UINT32_C(g),UINT32_C(h)}, msg}
		TESTCASE(0xE3B0C442,0x98FC1C14,0x9AFBF4C8,0x996FB924,0x27AE41E4,0x649B934C,0xA495991B,0x7852B855, ""),
		TESTCASE(0xCA978112,0xCA1BBDCA,0xFAC231B3,0x9A23DC4D,0xA786EFF8,0x147C4E72,0xB9807785,0xAFEE48BB, "a"),
		TESTCASE(0xBA7816BF,0x8F01CFEA,0x414140DE,0x5DAE2223,0xB00361A3,0x96177A9C,0xB410FF61,0xF20015AD, "abc"),
		TESTCASE(0xF7846F55,0xCF23E14E,0xEBEAB5B4,0xE1550CAD,0x5B509E33,0x48FBC4EF,0xA3A1413D,0x393CB650, "message digest"),
		TESTCASE(0x71C480DF,0x93D6AE2F,0x1EFAD144,0x7C66C952,0x5E316218,0xCF51FC8D,0x9ED832F2,0xDAF18B73, "abcdefghijklmnopqrstuvwxyz"),
		TESTCASE(0x248D6A61,0xD20638B8,0xE5C02693,0x0C3E6039,0xA33CE459,0x64FF2167,0xF6ECEDD4,0x19DB06C1, "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"),
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
		
		uint32_t hash[STATE_LEN];
		sha256_hash(msg, len, hash);
		if (memcmp(hash, tc->answer, sizeof(tc->answer)) != 0)
			return false;
		free(msg);
	}
	return true;
}


/* Full message hasher */

void sha256_hash(const uint8_t message[], size_t len, uint32_t hash[static STATE_LEN]) {
	hash[0] = UINT32_C(0x6A09E667);
	hash[1] = UINT32_C(0xBB67AE85);
	hash[2] = UINT32_C(0x3C6EF372);
	hash[3] = UINT32_C(0xA54FF53A);
	hash[4] = UINT32_C(0x510E527F);
	hash[5] = UINT32_C(0x9B05688C);
	hash[6] = UINT32_C(0x1F83D9AB);
	hash[7] = UINT32_C(0x5BE0CD19);
	
	#define LENGTH_SIZE 8  // In bytes
	
	size_t off;
	for (off = 0; len - off >= BLOCK_LEN; off += BLOCK_LEN)
		sha256_compress(hash, &message[off]);
	
	uint8_t block[BLOCK_LEN] = {0};
	size_t rem = len - off;
	memcpy(block, &message[off], rem);
	
	block[rem] = 0x80;
	rem++;
	if (BLOCK_LEN - rem < LENGTH_SIZE) {
		sha256_compress(hash, block);
		memset(block, 0, sizeof(block));
	}
	
	block[BLOCK_LEN - 1] = (uint8_t)((len & 0x1FU) << 3);
	len >>= 5;
	for (int i = 1; i < LENGTH_SIZE; i++, len >>= 8)
		block[BLOCK_LEN - 1 - i] = (uint8_t)(len & 0xFFU);
	sha256_compress(hash, block);
}
