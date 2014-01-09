/* 
 * SHA-256 hash in C and x86 assembly
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
void sha256_hash(uint8_t *message, uint32_t len, uint32_t *hash);

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
	uint32_t hash[8];
	
	sha256_hash((uint8_t*)"", 0, hash);
	if (hash[0]!=UINT32_C(0xE3B0C442)||hash[1]!=UINT32_C(0x98FC1C14)||hash[2]!=UINT32_C(0x9AFBF4C8)||hash[3]!=UINT32_C(0x996FB924)||hash[4]!=UINT32_C(0x27AE41E4)||hash[5]!=UINT32_C(0x649B934C)||hash[6]!=UINT32_C(0xA495991B)||hash[7]!=UINT32_C(0x7852B855)) return 0;
	
	sha256_hash((uint8_t*)"a", 1, hash);
	if (hash[0]!=UINT32_C(0xCA978112)||hash[1]!=UINT32_C(0xCA1BBDCA)||hash[2]!=UINT32_C(0xFAC231B3)||hash[3]!=UINT32_C(0x9A23DC4D)||hash[4]!=UINT32_C(0xA786EFF8)||hash[5]!=UINT32_C(0x147C4E72)||hash[6]!=UINT32_C(0xB9807785)||hash[7]!=UINT32_C(0xAFEE48BB)) return 0;
	
	sha256_hash((uint8_t*)"abc", 3, hash);
	if (hash[0]!=UINT32_C(0xBA7816BF)||hash[1]!=UINT32_C(0x8F01CFEA)||hash[2]!=UINT32_C(0x414140DE)||hash[3]!=UINT32_C(0x5DAE2223)||hash[4]!=UINT32_C(0xB00361A3)||hash[5]!=UINT32_C(0x96177A9C)||hash[6]!=UINT32_C(0xB410FF61)||hash[7]!=UINT32_C(0xF20015AD)) return 0;
	
	sha256_hash((uint8_t*)"message digest", 14, hash);
	if (hash[0]!=UINT32_C(0xF7846F55)||hash[1]!=UINT32_C(0xCF23E14E)||hash[2]!=UINT32_C(0xEBEAB5B4)||hash[3]!=UINT32_C(0xE1550CAD)||hash[4]!=UINT32_C(0x5B509E33)||hash[5]!=UINT32_C(0x48FBC4EF)||hash[6]!=UINT32_C(0xA3A1413D)||hash[7]!=UINT32_C(0x393CB650)) return 0;
	
	sha256_hash((uint8_t*)"abcdefghijklmnopqrstuvwxyz", 26, hash);
	if (hash[0]!=UINT32_C(0x71C480DF)||hash[1]!=UINT32_C(0x93D6AE2F)||hash[2]!=UINT32_C(0x1EFAD144)||hash[3]!=UINT32_C(0x7C66C952)||hash[4]!=UINT32_C(0x5E316218)||hash[5]!=UINT32_C(0xCF51FC8D)||hash[6]!=UINT32_C(0x9ED832F2)||hash[7]!=UINT32_C(0xDAF18B73)) return 0;
	
	sha256_hash((uint8_t*)"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq", 56, hash);
	if (hash[0]!=UINT32_C(0x248D6A61)||hash[1]!=UINT32_C(0xD20638B8)||hash[2]!=UINT32_C(0xE5C02693)||hash[3]!=UINT32_C(0x0C3E6039)||hash[4]!=UINT32_C(0xA33CE459)||hash[5]!=UINT32_C(0x64FF2167)||hash[6]!=UINT32_C(0xF6ECEDD4)||hash[7]!=UINT32_C(0x19DB06C1)) return 0;
	
	return 1;
}


/* Full message hasher */

void sha256_hash(uint8_t *message, uint32_t len, uint32_t *hash) {
	hash[0] = UINT32_C(0x6A09E667);
	hash[1] = UINT32_C(0xBB67AE85);
	hash[2] = UINT32_C(0x3C6EF372);
	hash[3] = UINT32_C(0xA54FF53A);
	hash[4] = UINT32_C(0x510E527F);
	hash[5] = UINT32_C(0x9B05688C);
	hash[6] = UINT32_C(0x1F83D9AB);
	hash[7] = UINT32_C(0x5BE0CD19);
	
	int i;
	for (i = 0; i + 64 <= len; i += 64)
		sha256_compress(hash, message + i);
	
	uint8_t block[64];
	int rem = len - i;
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
