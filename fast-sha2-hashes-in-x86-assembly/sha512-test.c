/* 
 * SHA-512 hash in C and x86 assembly
 * 
 * Copyright (c) 2021 Project Nayuki. (MIT License)
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

static bool self_check(void);
void sha512_hash(const uint8_t message[], size_t len, uint64_t hash[static STATE_LEN]);

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
		uint64_t answer[STATE_LEN];
		const char *message;
	};
	
	static const struct TestCase cases[] = {
		#define TESTCASE(a,b,c,d,e,f,g,h,msg) {{UINT64_C(a),UINT64_C(b),UINT64_C(c),UINT64_C(d),UINT64_C(e),UINT64_C(f),UINT64_C(g),UINT64_C(h)}, msg}
		TESTCASE(0xCF83E1357EEFB8BD,0xF1542850D66D8007,0xD620E4050B5715DC,0x83F4A921D36CE9CE,0x47D0D13C5D85F2B0,0xFF8318D2877EEC2F,0x63B931BD47417A81,0xA538327AF927DA3E, ""),
		TESTCASE(0x1F40FC92DA241694,0x750979EE6CF582F2,0xD5D7D28E18335DE0,0x5ABC54D0560E0F53,0x02860C652BF08D56,0x0252AA5E74210546,0xF369FBBBCE8C12CF,0xC7957B2652FE9A75, "a"),
		TESTCASE(0xDDAF35A193617ABA,0xCC417349AE204131,0x12E6FA4E89A97EA2,0x0A9EEEE64B55D39A,0x2192992A274FC1A8,0x36BA3C23A3FEEBBD,0x454D4423643CE80E,0x2A9AC94FA54CA49F, "abc"),
		TESTCASE(0x107DBF389D9E9F71,0xA3A95F6C055B9251,0xBC5268C2BE16D6C1,0x3492EA45B0199F33,0x09E16455AB1E9611,0x8E8A905D5597B720,0x38DDB372A8982604,0x6DE66687BB420E7C, "message digest"),
		TESTCASE(0x4DBFF86CC2CA1BAE,0x1E16468A05CB9881,0xC97F1753BCE36190,0x34898FAA1AABE429,0x955A1BF8EC483D74,0x21FE3C1646613A59,0xED5441FB0F321389,0xF77F48A879C7B1F1, "abcdefghijklmnopqrstuvwxyz"),
		TESTCASE(0x8E959B75DAE313DA,0x8CF4F72814FC143F,0x8F7779C6EB9F7FA1,0x7299AEADB6889018,0x501D289E4900F7E4,0x331B99DEC4B5433A,0xC7D329EEB6DD2654,0x5E96E55B874BE909, "abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu"),
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
		
		uint64_t hash[STATE_LEN];
		sha512_hash(msg, len, hash);
		if (memcmp(hash, tc->answer, sizeof(tc->answer)) != 0)
			return false;
		free(msg);
	}
	return true;
}


/* Full message hasher */

void sha512_hash(const uint8_t message[], size_t len, uint64_t hash[static STATE_LEN]) {
	hash[0] = UINT64_C(0x6A09E667F3BCC908);
	hash[1] = UINT64_C(0xBB67AE8584CAA73B);
	hash[2] = UINT64_C(0x3C6EF372FE94F82B);
	hash[3] = UINT64_C(0xA54FF53A5F1D36F1);
	hash[4] = UINT64_C(0x510E527FADE682D1);
	hash[5] = UINT64_C(0x9B05688C2B3E6C1F);
	hash[6] = UINT64_C(0x1F83D9ABFB41BD6B);
	hash[7] = UINT64_C(0x5BE0CD19137E2179);
	
	#define LENGTH_SIZE 16  // In bytes
	
	size_t off;
	for (off = 0; len - off >= BLOCK_LEN; off += BLOCK_LEN)
		sha512_compress(hash, &message[off]);
	
	uint8_t block[BLOCK_LEN] = {0};
	size_t rem = len - off;
	if (rem > 0)
		memcpy(block, &message[off], rem);
	
	block[rem] = 0x80;
	rem++;
	if (BLOCK_LEN - rem < LENGTH_SIZE) {
		sha512_compress(hash, block);
		memset(block, 0, sizeof(block));
	}
	
	block[BLOCK_LEN - 1] = (uint8_t)((len & 0x1FU) << 3);
	len >>= 5;
	for (int i = 1; i < LENGTH_SIZE; i++, len >>= 8)
		block[BLOCK_LEN - 1 - i] = (uint8_t)(len & 0xFFU);
	sha512_compress(hash, block);
}
