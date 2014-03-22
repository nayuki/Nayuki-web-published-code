/* 
 * MD5 hash in C and x86 assembly
 * 
 * Copyright (c) 2014 Nayuki Minase
 * All rights reserved. Contact Nayuki for licensing.
 * http://nayuki.eigenstate.org/page/fast-md5-hash-implementation-in-x86-assembly
 */

#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>


/* Function prototypes */

static int self_check(void);
void md5_hash(uint8_t *message, uint32_t len, uint32_t hash[4]);

// Link this program with an external C or x86 compression function
extern void md5_compress(uint32_t state[4], uint32_t block[16]);


/* Main program */

int main(int argc, char **argv) {
	if (!self_check()) {
		printf("Self-check failed\n");
		return 1;
	}
	printf("Self-check passed\n");
	
	// Benchmark speed
	uint32_t state[4] = {};
	uint32_t block[16] = {};
	const int N = 10000000;
	clock_t start_time = clock();
	int i;
	for (i = 0; i < N; i++)
		md5_compress(state, block);
	printf("Speed: %.1f MiB/s\n", (double)N * 64 / (clock() - start_time) * CLOCKS_PER_SEC / 1048576);
	
	return 0;
}


/* Self-check */

static int self_check(void) {
	uint32_t hash[4];
	
	md5_hash((uint8_t*)"", 0, hash);
	if (hash[0]!=UINT32_C(0xD98C1DD4)||hash[1]!=UINT32_C(0x04B2008F)||hash[2]!=UINT32_C(0x980980E9)||hash[3]!=UINT32_C(0x7E42F8EC)) return 0;
	
	md5_hash((uint8_t*)"a", 1, hash);
	if (hash[0]!=UINT32_C(0xB975C10C)||hash[1]!=UINT32_C(0xA8B6F1C0)||hash[2]!=UINT32_C(0xE299C331)||hash[3]!=UINT32_C(0x61267769)) return 0;
	
	md5_hash((uint8_t*)"abc", 3, hash);
	if (hash[0]!=UINT32_C(0x98500190)||hash[1]!=UINT32_C(0xB04FD23C)||hash[2]!=UINT32_C(0x7D3F96D6)||hash[3]!=UINT32_C(0x727FE128)) return 0;
	
	md5_hash((uint8_t*)"message digest", 14, hash);
	if (hash[0]!=UINT32_C(0x7D696BF9)||hash[1]!=UINT32_C(0x8D93B77C)||hash[2]!=UINT32_C(0x312F5A52)||hash[3]!=UINT32_C(0xD061F1AA)) return 0;
	
	md5_hash((uint8_t*)"abcdefghijklmnopqrstuvwxyz", 26, hash);
	if (hash[0]!=UINT32_C(0xD7D3FCC3)||hash[1]!=UINT32_C(0x00E49261)||hash[2]!=UINT32_C(0x6C49FB7D)||hash[3]!=UINT32_C(0x3BE167CA)) return 0;
	
	md5_hash((uint8_t*)"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", 62, hash);
	if (hash[0]!=UINT32_C(0x98AB74D1)||hash[1]!=UINT32_C(0xF5D977D2)||hash[2]!=UINT32_C(0x2C1C61A5)||hash[3]!=UINT32_C(0x9F9D419F)) return 0;
	
	md5_hash((uint8_t*)"12345678901234567890123456789012345678901234567890123456789012345678901234567890", 80, hash);
	if (hash[0]!=UINT32_C(0xA2F4ED57)||hash[1]!=UINT32_C(0x55C9E32B)||hash[2]!=UINT32_C(0x2EDA49AC)||hash[3]!=UINT32_C(0x7AB60721)) return 0;
	
	return 1;
}


/* Full message hasher */

void md5_hash(uint8_t *message, uint32_t len, uint32_t hash[4]) {
	hash[0] = UINT32_C(0x67452301);
	hash[1] = UINT32_C(0xEFCDAB89);
	hash[2] = UINT32_C(0x98BADCFE);
	hash[3] = UINT32_C(0x10325476);
	
	int i;
	for (i = 0; i + 64 <= len; i += 64)
		md5_compress(hash, (uint32_t*)(message + i));
	
	uint32_t block[16];
	uint8_t *byteBlock = (uint8_t*)block;
	
	int rem = len - i;
	memcpy(byteBlock, message + i, rem);
	
	byteBlock[rem] = 0x80;
	rem++;
	if (64 - rem >= 8)
		memset(byteBlock + rem, 0, 56 - rem);
	else {
		memset(byteBlock + rem, 0, 64 - rem);
		md5_compress(hash, block);
		memset(block, 0, 56);
	}
	block[14] = len << 3;
	block[15] = len >> 29;
	md5_compress(hash, block);
}
