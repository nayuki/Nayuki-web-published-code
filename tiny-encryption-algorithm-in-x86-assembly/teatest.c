/* 
 * Tiny Encryption Algorithm (TEA) in C and x86 assembly
 * 
 * Copyright (c) 2011 Nayuki Minase. All rights reserved.
 * http://nayuki.eigenstate.org/page/tiny-encryption-algorithm-in-x86-assembly
 */


#include <stdlib.h>
#include <stdint.h>
#include <stdio.h>
#include <time.h>


/* x86 assembly version */
void tea_encrypt_x86(uint32_t *msg, uint32_t *key);

/* C version */
void tea_encrypt_c(uint32_t *msg, uint32_t *key) {
	uint32_t y = msg[0], z = msg[1];
	uint32_t k0 = key[0], k1 = key[1], k2 = key[2], k3 = key[3];
	int i;
	uint32_t sum;
	for (i = 0, sum = 0x9E3779B9; i < 32; i++, sum += 0x9E3779B9) {
		y += ((z << 4) + k0) ^ (z + sum) ^ ((z >> 5) + k1);
		z += ((y << 4) + k2) ^ (y + sum) ^ ((y >> 5) + k3);
	}
	msg[0] = y;
	msg[1] = z;
}


int main(int argc, char **argv) {
	uint32_t msg[2] = {0, 0};
	uint32_t key[4] = {0, 0, 0, 0};
	
	// Sanity test
	tea_encrypt_x86(msg, key);
	printf("Ciphertext: %08x %08x\n", msg[0], msg[1]);  // Should be 41ea3a0a 94baa940
	
	// Benchmark speed
	const int N = 10000000;
	int i;
	for (i = 0; i < N; i++)
		tea_encrypt_x86(msg, key);
	printf("Speed: %.1f MiB/s\n", (double)N * 8 / clock() * CLOCKS_PER_SEC / 1048576);
	
	return 0;
}

