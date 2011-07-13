/*
 * RC4 stream cipher in C and x86 assembly
 * Copyright (c) 2011 Nayuki Minase
 */


#include <stdlib.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include <time.h>


typedef struct {
	int i;
	int j;
	uint8_t s[256];
} rc4state;


void rc4_init(rc4state *state, uint8_t *key, int len) {
	int i;
	for (i = 0; i < 256; i++)
		state->s[i] = (uint8_t)i;
	state->i = 0;
	state->j = 0;
	
	int j;
	for (i = 0, j = 0; i < 256; i++) {
		j = (j + state->s[i] + key[i % len]) & 0xFF;
		
		// Swap
		uint8_t temp = state->s[i];
		state->s[i] = state->s[j];
		state->s[j] = temp;
	}
}


/* C version */
void rc4_encrypt_c(rc4state *state, uint8_t *msg, int len) {
	int index;
	int i = state->i;
	int j = state->j;
	uint8_t *s = state->s;
	for (index = 0; index < len; index++) {
		i = (i + 1) & 0xFF;
		j = (j + s[i]) & 0xFF;
		
		// Swap
		uint8_t temp = s[i];
		s[i] = s[j];
		s[j] = temp;
		
		msg[index] ^= s[(s[i] + temp) & 0xFF];
	}
	state->i = i;
	state->j = j;
}


/* x86 assembly version */
void rc4_encrypt_x86(rc4state *state, uint8_t *msg, int len);


/* Main */

void test_sanity() {
	const int N = 20;
	uint8_t key[3] = {'K', 'e', 'y'};
	uint8_t msg[N];
	int i;
	rc4state state;
	
	rc4_init(&state, key, sizeof(key));
	memset(msg, 0, N);
	rc4_encrypt_c(&state, msg, N);
	printf("Ciphertext (C)  :");
	for (i = 0; i < N; i++)
		printf(" %02x", msg[i]);
	printf("\n");
	
	rc4_init(&state, key, sizeof(key));
	memset(msg, 0, N);
	rc4_encrypt_x86(&state, msg, N);
	printf("Ciphertext (x86):");
	for (i = 0; i < N; i++)
		printf(" %02x", msg[i]);
	printf("\n");
}


void benchmark_speed() {
	const int N = 1024;
	uint8_t key[3] = {'a', 'b', 'c'};
	uint8_t msg[N];
	rc4state state;
	rc4_init(&state, key, sizeof(key));
	
	const int M = 1000000;
	int i;
	time_t start;
	
	start = clock();
	for (i = 0; i < M; i++)
		rc4_encrypt_c(&state, msg, N);
	printf("Speed (C)  : %.1f MiB/s\n", (double)M * N / (clock() - start) * CLOCKS_PER_SEC / 1048576);
	
	start = clock();
	for (i = 0; i < M; i++)
		rc4_encrypt_x86(&state, msg, N);
	printf("Speed (x86): %.1f MiB/s\n", (double)M * N / (clock() - start) * CLOCKS_PER_SEC / 1048576);
}


int main(int argc, char **argv) {
	test_sanity();
	benchmark_speed();
	return 0;
}

