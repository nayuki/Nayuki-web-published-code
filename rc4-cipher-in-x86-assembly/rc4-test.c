/* 
 * RC4 stream cipher in C and x86 assembly
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/rc4-cipher-in-x86-assembly
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


struct Rc4State {
	uint8_t i;
	uint8_t j;
	uint8_t s[256];
};


/* Function prototypes */

extern void rc4_encrypt_x86(struct Rc4State *state, uint8_t msg[], size_t len);
void rc4_init(struct Rc4State *state, const uint8_t key[], size_t len);
void rc4_encrypt_c(struct Rc4State *state, uint8_t msg[], size_t len);
static bool self_check(void);


/* Main program */

int main(void) {
	// Self-check
	if (!self_check()) {
		printf("Self-check failed\n");
		return EXIT_FAILURE;
	}
	printf("Self-check passed\n");
	
	// Benchmark speed
	const long TRIALS = 300000;
	#define MSG_LEN 1024
	
	uint8_t key[3] = {'a', 'b', 'c'};
	uint8_t msg[MSG_LEN] = {0};
	struct Rc4State state;
	rc4_init(&state, key, sizeof(key));
	
	time_t start;
	
	start = clock();
	for (long i = 0; i < TRIALS; i++)
		rc4_encrypt_c(&state, msg, MSG_LEN);
	printf("Speed (C)  : %.1f MB/s\n", (double)MSG_LEN * TRIALS / (clock() - start) * CLOCKS_PER_SEC / 1000000);
	
	start = clock();
	for (long i = 0; i < TRIALS; i++)
		rc4_encrypt_x86(&state, msg, MSG_LEN);
	printf("Speed (x86): %.1f MB/s\n", (double)MSG_LEN * TRIALS / (clock() - start) * CLOCKS_PER_SEC / 1000000);
	
	return EXIT_SUCCESS;
	#undef MSG_LEN
}


static bool self_check(void) {
	const long TRIALS = 1000;
	#define MSG_LEN 127
	
	uint8_t key[3] = {'K', 'e', 'y'};
	uint8_t msg0[MSG_LEN] = {0};
	uint8_t msg1[MSG_LEN] = {0};
	struct Rc4State state0;
	struct Rc4State state1;
	rc4_init(&state0, key, sizeof(key));
	rc4_init(&state1, key, sizeof(key));
	
	for (long i = 0; i < TRIALS; i++){
		rc4_encrypt_c  (&state0, msg0, MSG_LEN);
		rc4_encrypt_x86(&state1, msg1, MSG_LEN);
		if (memcmp(msg0, msg1, MSG_LEN) != 0 || memcmp(&state0, &state1, sizeof(struct Rc4State)) != 0)
			return false;
	}
	return true;
	#undef MSG_LEN
}


/* RC4 functions in C */

void rc4_init(struct Rc4State *state, const uint8_t key[], size_t len) {
	for (int i = 0; i < 256; i++)
		state->s[i] = (uint8_t)i;
	state->i = 0;
	state->j = 0;
	
	uint8_t j = 0;
	for (int i = 0; i < 256; i++) {
		j += state->s[i] + key[i % len];
		
		// Swap
		uint8_t temp = state->s[i];
		state->s[i] = state->s[j];
		state->s[j] = temp;
	}
}


void rc4_encrypt_c(struct Rc4State *state, uint8_t msg[], size_t len) {
	uint8_t i = state->i;
	uint8_t j = state->j;
	uint8_t *s = state->s;
	for (size_t index = 0; index < len; index++) {
		i++;
		j += s[i];
		
		// Swap
		uint8_t si = s[i];
		uint8_t sj = s[j];
		s[i] = sj;
		s[j] = si;
		
		msg[index] ^= s[(si + sj) & 0xFF];
	}
	state->i = i;
	state->j = j;
}
