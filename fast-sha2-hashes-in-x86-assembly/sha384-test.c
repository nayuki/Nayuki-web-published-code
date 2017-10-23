/* 
 * SHA-384 hash in C and x86 assembly
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

#define BLOCK_LEN 128  // In bytes
#define STATE_LEN 8  // In words
#define HASH_LEN (STATE_LEN-2)  // In words

static bool self_check(void);
void sha384_hash(const uint8_t message[], size_t len, uint64_t hash[static HASH_LEN]);

// Link this program with an external C or x86 compression function
extern void sha512_compress(uint64_t state[static STATE_LEN], const uint8_t block[static BLOCK_LEN]);


/* Main program */

int main(void) {
	// Self-check
	if (!self_check()) {
		printf("Self-check failed\n");
		return EXIT_FAILURE;
	}
	printf("Self-check passed\n");
	
	// Benchmark speed
	uint64_t state[STATE_LEN] = {0};
	uint8_t block[BLOCK_LEN] = {0};
	const long ITERS = 3000000;
	clock_t start_time = clock();
	for (long i = 0; i < ITERS; i++)
		sha512_compress(state, block);
	printf("Speed: %.1f MB/s\n", (double)ITERS * (sizeof(block) / sizeof(block[0]))
		/ (clock() - start_time) * CLOCKS_PER_SEC / 1000000);
	
	return EXIT_SUCCESS;
}


/* Test vectors and checker */

static bool self_check(void) {
	struct TestCase {
		uint64_t answer[HASH_LEN];
		const char *message;
	};
	
	static const struct TestCase cases[] = {
		#define TESTCASE(a,b,c,d,e,f,msg) {{UINT64_C(a),UINT64_C(b),UINT64_C(c),UINT64_C(d),UINT64_C(e),UINT64_C(f)}, msg}
		TESTCASE(0x38B060A751AC9638,0x4CD9327EB1B1E36A,0x21FDB71114BE0743,0x4C0CC7BF63F6E1DA,0x274EDEBFE76F65FB,0xD51AD2F14898B95B, ""),
		TESTCASE(0x54A59B9F22B0B808,0x80D8427E548B7C23,0xABD873486E1F035D,0xCE9CD697E8517503,0x3CAA88E6D57BC35E,0xFAE0B5AFD3145F31, "a"),
		TESTCASE(0xCB00753F45A35E8B,0xB5A03D699AC65007,0x272C32AB0EDED163,0x1A8B605A43FF5BED,0x8086072BA1E7CC23,0x58BAECA134C825A7, "abc"),
		TESTCASE(0x473ED35167EC1F5D,0x8E550368A3DB39BE,0x54639F828868E945,0x4C239FC8B52E3C61,0xDBD0D8B4DE1390C2,0x56DCBB5D5FD99CD5, "message digest"),
		TESTCASE(0xFEB67349DF3DB6F5,0x924815D6C3DC133F,0x091809213731FE5C,0x7B5F4999E463479F,0xF2877F5F2936FA63,0xBB43784B12F3EBB4, "abcdefghijklmnopqrstuvwxyz"),
		TESTCASE(0x09330C33F71147E8,0x3D192FC782CD1B47,0x53111B173B3B05D2,0x2FA08086E3B0F712,0xFCC7C71A557E2DB9,0x66C3E9FA91746039, "abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu"),
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
		
		uint64_t hash[HASH_LEN];
		sha384_hash(msg, len, hash);
		if (memcmp(hash, tc->answer, sizeof(tc->answer)) != 0)
			return false;
		free(msg);
	}
	return true;
}


/* Full message hasher */

void sha384_hash(const uint8_t message[], size_t len, uint64_t hash[static HASH_LEN]) {
	uint64_t state[STATE_LEN] = {
		UINT64_C(0xCBBB9D5DC1059ED8),
		UINT64_C(0x629A292A367CD507),
		UINT64_C(0x9159015A3070DD17),
		UINT64_C(0x152FECD8F70E5939),
		UINT64_C(0x67332667FFC00B31),
		UINT64_C(0x8EB44A8768581511),
		UINT64_C(0xDB0C2E0D64F98FA7),
		UINT64_C(0x47B5481DBEFA4FA4),
	};
	
	#define LENGTH_SIZE 16  // In bytes
	
	size_t off;
	for (off = 0; len - off >= BLOCK_LEN; off += BLOCK_LEN)
		sha512_compress(state, &message[off]);
	
	uint8_t block[BLOCK_LEN] = {0};
	size_t rem = len - off;
	memcpy(block, &message[off], rem);
	
	block[rem] = 0x80;
	rem++;
	if (BLOCK_LEN - rem < LENGTH_SIZE) {
		sha512_compress(state, block);
		memset(block, 0, sizeof(block));
	}
	
	block[BLOCK_LEN - 1] = (uint8_t)((len & 0x1FU) << 3);
	len >>= 5;
	for (int i = 1; i < LENGTH_SIZE; i++, len >>= 8)
		block[BLOCK_LEN - 1 - i] = (uint8_t)(len & 0xFFU);
	sha512_compress(state, block);
	
	memcpy(hash, state, HASH_LEN * sizeof(uint64_t));
}
