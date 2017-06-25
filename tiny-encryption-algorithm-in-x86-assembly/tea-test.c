/* 
 * Tiny Encryption Algorithm (TEA) in C and x86 assembly
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/tiny-encryption-algorithm-in-x86-assembly
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

#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>


/* x86 assembly version */
extern void tea_encrypt_x86(uint32_t msg[2], const uint32_t key[4]);

/* C version */
void tea_encrypt_c(uint32_t msg[2], const uint32_t key[4]) {
	uint32_t y = msg[0], z = msg[1];
	uint32_t k0 = key[0], k1 = key[1], k2 = key[2], k3 = key[3];
	int i;
	uint32_t sum;
	for (i = 0, sum = UINT32_C(0x9E3779B9); i < 32; i++, sum = 0U + sum + UINT32_C(0x9E3779B9)) {
		y += (((0U + z) << 4) + k0) ^ (0U + z + sum) ^ (0U + (z >> 5) + k1);
		z += (((0U + y) << 4) + k2) ^ (0U + y + sum) ^ (0U + (y >> 5) + k3);
	}
	msg[0] = y;
	msg[1] = z;
}


int main(void) {
	uint32_t msg[2] = {0, 0};
	uint32_t key[4] = {0, 0, 0, 0};
	
	// Self-check
	tea_encrypt_x86(msg, key);
	if (msg[0] != UINT32_C(0x41EA3A0A) || msg[1] != UINT32_C(0x94BAA940)) {
		printf("Self-check failed\n");
		return EXIT_FAILURE;
	}
	printf("Self-check passed\n");
	
	// Benchmark speed
	const int N = 10000000;
	for (int i = 0; i < N; i++)
		tea_encrypt_x86(msg, key);
	printf("Speed: %.1f MB/s\n", (double)N * sizeof(msg) / clock() * CLOCKS_PER_SEC / 1000000);
	
	return EXIT_SUCCESS;
}
