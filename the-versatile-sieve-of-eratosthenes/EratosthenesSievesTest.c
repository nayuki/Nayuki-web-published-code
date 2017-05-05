/* 
 * Test of variants of the sieve of Eratosthenes (C)
 * by Project Nayuki, 2017. Public domain.
 * https://www.nayuki.io/page/the-versatile-sieve-of-eratosthenes
 */

#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "EratosthenesSieves.h"


static void test_values(void) {
	{
		bool expected[] = {false, false, true, true, false, true, false, true, false, false, false, true, false, true, false, false, false, true, false, true, false, false, false, true, false, false, false, false, false, true, false};
		bool *actual = sieve_primeness(30);
		if (memcmp(expected, actual, sizeof(expected)) != 0) {
			printf("Mismatch\n");
			exit(1);
		}
		free(actual);
	}
	{
		uint32_t expected[] = {0, 1, 2, 3, 2, 5, 2, 7, 2, 3, 2, 11, 2, 13, 2, 3, 2, 17, 2, 19, 2, 3, 2, 23, 2, 5, 2, 3, 2, 29, 2};
		uint32_t *actual = sieve_smallest_prime_factor(30);
		if (memcmp(expected, actual, sizeof(expected)) != 0) {
			printf("Mismatch\n");
			exit(1);
		}
		free(actual);
	}
	{
		uint32_t expected[] = {0, 1, 1, 2, 2, 4, 2, 6, 4, 6, 4, 10, 4, 12, 6, 8, 8, 16, 6, 18, 8, 12, 10, 22, 8, 20, 12, 18, 12, 28, 8};
		uint32_t *actual = sieve_totient(30);
		if (memcmp(expected, actual, sizeof(expected)) != 0) {
			printf("Mismatch\n");
			exit(1);
		}
		free(actual);
	}
	{
		uint32_t expected[] = {0, 0, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 2, 2, 1, 1, 2, 1, 2, 2, 2, 1, 2, 1, 2, 1, 2, 1, 3};
		uint32_t *actual = sieve_omega(30);
		if (memcmp(expected, actual, sizeof(expected)) != 0) {
			printf("Mismatch\n");
			exit(1);
		}
		free(actual);
	}
	{
		uint32_t expected[] = {0, 1, 2, 3, 2, 5, 6, 7, 2, 3, 10, 11, 6, 13, 14, 15, 2, 17, 6, 19, 10, 21, 22, 23, 6, 5, 26, 3, 14, 29, 30};
		uint32_t *actual = sieve_radical(30);
		if (memcmp(expected, actual, sizeof(expected)) != 0) {
			printf("Mismatch\n");
			exit(1);
		}
		free(actual);
	}
}


static void test_prefix_consistency(void) {
	const uint32_t N = 10000;
	{
		bool *prev = NULL;
		for (uint32_t i = 0; i < N; i++) {
			bool *cur = sieve_primeness(i);
			for (uint32_t j = 0; j < i; j++) {
				if (cur[j] != prev[j]) {
					printf("Mismatch\n");
					exit(1);
				}
			}
			free(prev);
			prev = cur;
		}
		free(prev);
	}
	{
		uint32_t *(*FUNCS[])(uint32_t) = {
			sieve_smallest_prime_factor,
			sieve_totient,
			sieve_omega,
			sieve_radical,
		};
		for (size_t k = 0; k < sizeof(FUNCS) / sizeof(FUNCS[0]); k++) {
			uint32_t *prev = NULL;
			for (uint32_t i = 0; i < N; i++) {
				uint32_t *cur = FUNCS[k](i);
				for (uint32_t j = 0; j < i; j++) {
					if (cur[j] != prev[j]) {
						printf("Mismatch\n");
						exit(1);
					}
				}
				free(prev);
				prev = cur;
			}
			free(prev);
		}
	}
}


int main(void) {
	test_values();
	test_prefix_consistency();
	return EXIT_SUCCESS;
}
