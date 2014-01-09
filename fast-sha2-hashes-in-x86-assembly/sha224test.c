/* 
 * SHA-224 hash in C and x86 assembly
 * 
 * Copyright (c) 2013 Nayuki Minase
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
void sha224_hash(uint8_t *message, uint32_t len, uint32_t *hash);

// Link this program with an external C or x86 compression function
extern void sha256_compress(uint32_t *state, uint8_t *block);


/* Main program */

int main(int argc, char **argv) {
	if (!self_check()) {
		printf("Self-check failed\n");
		return 1;
	}
	printf("Self-check passed\n");
	
	// Benchmark speed
	uint32_t state[8];
	uint32_t block[16];
	const int N = 3000000;
	clock_t start_time = clock();
	int i;
	for (i = 0; i < N; i++)
		sha256_compress(state, (uint8_t*)block);
	printf("Speed: %.1f MiB/s\n", (double)N * 64 / (clock() - start_time) * CLOCKS_PER_SEC / 1048576);
	
	return 0;
}


/* Self-check */

static int self_check(void) {
	uint32_t hash[7];
	
	sha224_hash((uint8_t*)"", 0, hash);
	if (hash[0]!=UINT32_C(0xD14A028C)||hash[1]!=UINT32_C(0x2A3A2BC9)||hash[2]!=UINT32_C(0x476102BB)||hash[3]!=UINT32_C(0x288234C4)||hash[4]!=UINT32_C(0x15A2B01F)||hash[5]!=UINT32_C(0x828EA62A)||hash[6]!=UINT32_C(0xC5B3E42F)) return 0;
	
	sha224_hash((uint8_t*)"abc", 3, hash);
	if (hash[0]!=UINT32_C(0x23097D22)||hash[1]!=UINT32_C(0x3405D822)||hash[2]!=UINT32_C(0x8642A477)||hash[3]!=UINT32_C(0xBDA255B3)||hash[4]!=UINT32_C(0x2AADBCE4)||hash[5]!=UINT32_C(0xBDA0B3F7)||hash[6]!=UINT32_C(0xE36C9DA7)) return 0;
	
	sha224_hash((uint8_t*)"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq", 56, hash);
	if (hash[0]!=UINT32_C(0x75388B16)||hash[1]!=UINT32_C(0x512776CC)||hash[2]!=UINT32_C(0x5DBA5DA1)||hash[3]!=UINT32_C(0xFD890150)||hash[4]!=UINT32_C(0xB0C6455C)||hash[5]!=UINT32_C(0xB4F58B19)||hash[6]!=UINT32_C(0x52522525)) return 0;
	
	return 1;
}


/* Full message hasher */

void sha224_hash(uint8_t *message, uint32_t len, uint32_t *hash) {
	uint32_t state[8];
	state[0] = UINT32_C(0xC1059ED8);
	state[1] = UINT32_C(0x367CD507);
	state[2] = UINT32_C(0x3070DD17);
	state[3] = UINT32_C(0xF70E5939);
	state[4] = UINT32_C(0xFFC00B31);
	state[5] = UINT32_C(0x68581511);
	state[6] = UINT32_C(0x64F98FA7);
	state[7] = UINT32_C(0xBEFA4FA4);
	
	int i;
	for (i = 0; i + 64 <= len; i += 64)
		sha256_compress(state, message + i);
	
	uint8_t block[64];
	int rem = len - i;
	memcpy(block, message + i, rem);
	
	block[rem] = 0x80;
	rem++;
	if (64 - rem >= 8)
		memset(block + rem, 0, 56 - rem);
	else {
		memset(block + rem, 0, 64 - rem);
		sha256_compress(state, block);
		memset(block, 0, 56);
	}
	
	uint64_t longLen = ((uint64_t)len) << 3;
	for (i = 0; i < 8; i++)
		block[64 - 1 - i] = (uint8_t)(longLen >> (i * 8));
	sha256_compress(state, block);
	
	memcpy(hash, state, 7 * sizeof(uint32_t));
}
