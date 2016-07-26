/* 
 * RC4 stream cipher in C and x86 assembly
 * 
 * Copyright (c) 2016 Project Nayuki
 * https://www.nayuki.io/page/rc4-cipher-in-x86-assembly
 * 
 * (MIT License)
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
#include <string.h>
#include <time.h>

typedef struct {
	uint8_t i;
	uint8_t j;
	uint8_t s[256];
} Rc4State;


/* Function prototypes */

extern void rc4_encrypt_x86(Rc4State *state, uint8_t *msg, size_t len);
void rc4_init(Rc4State *state, const uint8_t *key, size_t len);
void rc4_encrypt_c(Rc4State *state, uint8_t *msg, size_t len);
static int self_check(void);


/* Main program */

int main(int argc, char **argv) {
	if (!self_check()) {
		printf("Self-check failed\n");
		return EXIT_FAILURE;
	}
	printf("Self-check passed\n");
	
	// Benchmark speed
	const int TRIALS = 300000;
	#define MSG_LEN 1024
	
	uint8_t key[3] = {'a', 'b', 'c'};
	uint8_t msg[MSG_LEN] = {0};
	Rc4State state;
	rc4_init(&state, key, sizeof(key));
	
	int i;
	time_t start;
	
	start = clock();
	for (i = 0; i < TRIALS; i++)
		rc4_encrypt_c(&state, msg, MSG_LEN);
	printf("Speed (C)  : %.1f MiB/s\n", (double)MSG_LEN * TRIALS / (clock() - start) * CLOCKS_PER_SEC / 1048576);
	
	start = clock();
	for (i = 0; i < TRIALS; i++)
		rc4_encrypt_x86(&state, msg, MSG_LEN);
	printf("Speed (x86): %.1f MiB/s\n", (double)MSG_LEN * TRIALS / (clock() - start) * CLOCKS_PER_SEC / 1048576);
	
	return EXIT_SUCCESS;
	#undef MSG_LEN
}


static int self_check(void) {
	const int TRIALS = 1000;
	#define MSG_LEN 127
	
	uint8_t key[3] = {'K', 'e', 'y'};
	uint8_t msg0[MSG_LEN] = {0};
	uint8_t msg1[MSG_LEN] = {0};
	Rc4State state0;
	Rc4State state1;
	rc4_init(&state0, key, sizeof(key));
	rc4_init(&state1, key, sizeof(key));
	
	int i;
	for(i = 0; i < TRIALS; i++){
		rc4_encrypt_c  (&state0, msg0, MSG_LEN);
		rc4_encrypt_x86(&state1, msg1, MSG_LEN);
		if (memcmp(msg0, msg1, MSG_LEN) !=0 || memcmp(&state0, &state1, sizeof(Rc4State)) != 0)
			return 0;
	}
	return 1;
	#undef MSG_LEN
}


/* RC4 functions in C */

void rc4_init(Rc4State *state, const uint8_t *key, size_t len) {
	size_t i;
	for (i = 0; i < 256; i++)
		state->s[i] = (uint8_t)i;
	state->i = 0;
	state->j = 0;
	
	uint8_t j;
	for (i = 0, j = 0; i < 256; i++) {
		j += state->s[i] + key[i % len];
		
		// Swap
		uint8_t temp = state->s[i];
		state->s[i] = state->s[j];
		state->s[j] = temp;
	}
}


void rc4_encrypt_c(Rc4State *state, uint8_t *msg, size_t len) {
	uint8_t i = state->i;
	uint8_t j = state->j;
	uint8_t *s = state->s;
	size_t index;
	for (index = 0; index < len; index++) {
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
