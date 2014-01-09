/* 
 * SHA-1 hash in C and x86 assembly
 * 
 * Copyright (c) 2013 Nayuki Minase
 * All rights reserved. Contact Nayuki for licensing.
 * http://nayuki.eigenstate.org/page/fast-sha1-hash-implementation-in-x86-assembly
 */

#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>


/* Function prototypes */

static int self_check(void);
void sha1_hash(uint8_t *message, uint32_t len, uint32_t *hash);

// Link this program with an external C or x86 compression function
extern void sha1_compress(uint32_t *state, uint8_t *block);


/* Main program */

int main(int argc, char **argv) {
	if (!self_check()) {
		printf("Self-check failed\n");
		return 1;
	}
	printf("Self-check passed\n");
	
	// Benchmark speed
	uint32_t state[5];
	uint32_t block[16];
	const int N = 10000000;
	clock_t start_time = clock();
	int i;
	for (i = 0; i < N; i++)
		sha1_compress(state, (uint8_t*)block);
	printf("Speed: %.1f MiB/s\n", (double)N * 64 / (clock() - start_time) * CLOCKS_PER_SEC / 1048576);
	
	return 0;
}


/* Self-check */

static int self_check(void) {
	uint32_t hash[5];
	
	sha1_hash((uint8_t*)"", 0, hash);
	if (hash[0]!=UINT32_C(0xDA39A3EE)||hash[1]!=UINT32_C(0x5E6B4B0D)||hash[2]!=UINT32_C(0x3255BFEF)||hash[3]!=UINT32_C(0x95601890)||hash[4]!=UINT32_C(0xAFD80709)) return 0;
	
	sha1_hash((uint8_t*)"a", 1, hash);
	if (hash[0]!=UINT32_C(0x86F7E437)||hash[1]!=UINT32_C(0xFAA5A7FC)||hash[2]!=UINT32_C(0xE15D1DDC)||hash[3]!=UINT32_C(0xB9EAEAEA)||hash[4]!=UINT32_C(0x377667B8)) return 0;
	
	sha1_hash((uint8_t*)"abc", 3, hash);
	if (hash[0]!=UINT32_C(0xA9993E36)||hash[1]!=UINT32_C(0x4706816A)||hash[2]!=UINT32_C(0xBA3E2571)||hash[3]!=UINT32_C(0x7850C26C)||hash[4]!=UINT32_C(0x9CD0D89D)) return 0;
	
	sha1_hash((uint8_t*)"message digest", 14, hash);
	if (hash[0]!=UINT32_C(0xC12252CE)||hash[1]!=UINT32_C(0xDA8BE899)||hash[2]!=UINT32_C(0x4D5FA029)||hash[3]!=UINT32_C(0x0A47231C)||hash[4]!=UINT32_C(0x1D16AAE3)) return 0;
	
	sha1_hash((uint8_t*)"abcdefghijklmnopqrstuvwxyz", 26, hash);
	if (hash[0]!=UINT32_C(0x32D10C7B)||hash[1]!=UINT32_C(0x8CF96570)||hash[2]!=UINT32_C(0xCA04CE37)||hash[3]!=UINT32_C(0xF2A19D84)||hash[4]!=UINT32_C(0x240D3A89)) return 0;
	
	sha1_hash((uint8_t*)"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq", 56, hash);
	if (hash[0]!=UINT32_C(0x84983E44)||hash[1]!=UINT32_C(0x1C3BD26E)||hash[2]!=UINT32_C(0xBAAE4AA1)||hash[3]!=UINT32_C(0xF95129E5)||hash[4]!=UINT32_C(0xE54670F1)) return 0;
	
	return 1;
}


/* Full message hasher */

void sha1_hash(uint8_t *message, uint32_t len, uint32_t *hash) {
	hash[0] = UINT32_C(0x67452301);
	hash[1] = UINT32_C(0xEFCDAB89);
	hash[2] = UINT32_C(0x98BADCFE);
	hash[3] = UINT32_C(0x10325476);
	hash[4] = UINT32_C(0xC3D2E1F0);
	
	int i;
	for (i = 0; i + 64 <= len; i += 64)
		sha1_compress(hash, message + i);
	
	uint8_t block[64];
	int rem = len - i;
	memcpy(block, message + i, rem);
	
	block[rem] = 0x80;
	rem++;
	if (64 - rem >= 8)
		memset(block + rem, 0, 56 - rem);
	else {
		memset(block + rem, 0, 64 - rem);
		sha1_compress(hash, block);
		memset(block, 0, 56);
	}
	
	uint64_t longLen = ((uint64_t)len) << 3;
	for (i = 0; i < 8; i++)
		block[64 - 1 - i] = (uint8_t)(longLen >> (i * 8));
	sha1_compress(hash, block);
}
