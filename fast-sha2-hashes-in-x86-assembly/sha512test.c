/* 
 * SHA-512 hash in C and x86 assembly
 * 
 * Copyright (c) 2014 Nayuki Minase
 * All rights reserved. Contact Nayuki for licensing.
 * http://nayuki.eigenstate.org/page/fast-sha2-hashes-in-x86-assembly
 */

#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>


/* Function prototypes */

static int self_check(void);
void sha512_hash(const uint8_t *message, uint32_t len, uint64_t hash[8]);

// Link this program with an external C or x86 compression function
extern void sha512_compress(uint64_t state[8], const uint8_t block[128]);


/* Main program */

int main(int argc, char **argv) {
	if (!self_check()) {
		printf("Self-check failed\n");
		return 1;
	}
	printf("Self-check passed\n");
	
	// Benchmark speed
	uint64_t state[8] = {};
	uint64_t block[16] = {};
	const int N = 3000000;
	clock_t start_time = clock();
	int i;
	for (i = 0; i < N; i++)
		sha512_compress(state, (uint8_t *)block);  // Type-punning
	printf("Speed: %.1f MiB/s\n", (double)N * sizeof(block) / (clock() - start_time) * CLOCKS_PER_SEC / 1048576);
	
	return 0;
}


/* Self-check */

struct testcase {
	uint64_t answer[8];
	const uint8_t *message;
};

#define TESTCASE(a,b,c,d,e,f,g,h,msg) {{UINT64_C(a),UINT64_C(b),UINT64_C(c),UINT64_C(d),UINT64_C(e),UINT64_C(f),UINT64_C(g),UINT64_C(h)}, (const uint8_t *)msg}

static struct testcase testCases[] = {
	TESTCASE(0xCF83E1357EEFB8BD,0xF1542850D66D8007,0xD620E4050B5715DC,0x83F4A921D36CE9CE,0x47D0D13C5D85F2B0,0xFF8318D2877EEC2F,0x63B931BD47417A81,0xA538327AF927DA3E, ""),
	TESTCASE(0x1F40FC92DA241694,0x750979EE6CF582F2,0xD5D7D28E18335DE0,0x5ABC54D0560E0F53,0x02860C652BF08D56,0x0252AA5E74210546,0xF369FBBBCE8C12CF,0xC7957B2652FE9A75, "a"),
	TESTCASE(0xDDAF35A193617ABA,0xCC417349AE204131,0x12E6FA4E89A97EA2,0x0A9EEEE64B55D39A,0x2192992A274FC1A8,0x36BA3C23A3FEEBBD,0x454D4423643CE80E,0x2A9AC94FA54CA49F, "abc"),
	TESTCASE(0x107DBF389D9E9F71,0xA3A95F6C055B9251,0xBC5268C2BE16D6C1,0x3492EA45B0199F33,0x09E16455AB1E9611,0x8E8A905D5597B720,0x38DDB372A8982604,0x6DE66687BB420E7C, "message digest"),
	TESTCASE(0x4DBFF86CC2CA1BAE,0x1E16468A05CB9881,0xC97F1753BCE36190,0x34898FAA1AABE429,0x955A1BF8EC483D74,0x21FE3C1646613A59,0xED5441FB0F321389,0xF77F48A879C7B1F1, "abcdefghijklmnopqrstuvwxyz"),
	TESTCASE(0x8E959B75DAE313DA,0x8CF4F72814FC143F,0x8F7779C6EB9F7FA1,0x7299AEADB6889018,0x501D289E4900F7E4,0x331B99DEC4B5433A,0xC7D329EEB6DD2654,0x5E96E55B874BE909, "abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu"),
};

static int self_check(void) {
	int i;
	for (i = 0; i < sizeof(testCases) / sizeof(testCases[i]); i++) {
		struct testcase *tc = &testCases[i];
		uint64_t hash[8];
		sha512_hash(tc->message, strlen((const char *)tc->message), hash);
		if (memcmp(hash, tc->answer, sizeof(tc->answer)) != 0)
			return 0;
	}
	return 1;
}


/* Full message hasher */

void sha512_hash(const uint8_t *message, uint32_t len, uint64_t hash[8]) {
	hash[0] = UINT64_C(0x6A09E667F3BCC908);
	hash[1] = UINT64_C(0xBB67AE8584CAA73B);
	hash[2] = UINT64_C(0x3C6EF372FE94F82B);
	hash[3] = UINT64_C(0xA54FF53A5F1D36F1);
	hash[4] = UINT64_C(0x510E527FADE682D1);
	hash[5] = UINT64_C(0x9B05688C2B3E6C1F);
	hash[6] = UINT64_C(0x1F83D9ABFB41BD6B);
	hash[7] = UINT64_C(0x5BE0CD19137E2179);
	
	uint32_t i;
	for (i = 0; len - i >= 128; i += 128)
		sha512_compress(hash, message + i);
	
	uint8_t block[128];
	uint32_t rem = len - i;
	memcpy(block, message + i, rem);
	
	block[rem] = 0x80;
	rem++;
	if (128 - rem >= 16)
		memset(block + rem, 0, 120 - rem);
	else {
		memset(block + rem, 0, 128 - rem);
		sha512_compress(hash, block);
		memset(block, 0, 120);
	}
	
	uint64_t longLen = ((uint64_t)len) << 3;
	for (i = 0; i < 8; i++)
		block[128 - 1 - i] = (uint8_t)(longLen >> (i * 8));
	sha512_compress(hash, block);
}
