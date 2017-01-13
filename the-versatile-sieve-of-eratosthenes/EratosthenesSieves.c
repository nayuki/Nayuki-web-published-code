/* 
 * Variants of the sieve of Eratosthenes (C)
 * by Project Nayuki, 2017. Public domain.
 * https://www.nayuki.io/page/the-versatile-sieve-of-eratosthenes
 */

#include <stdlib.h>
#include "EratosthenesSieves.h"


// Function prototypes
static uint32_t floor_sqrt(uint32_t x);


/*---- Function definitions ----*/

bool *sieve_primeness(uint32_t limit) {
	if (limit >= UINT32_MAX || limit >= SIZE_MAX)
		return NULL;
	bool *result = calloc(limit + 1, sizeof(bool));
	if (result == NULL)
		return NULL;
	
	for (uint32_t i = 2; i <= limit; i++)
		result[i] = true;
	for (uint32_t i = 2, end = floor_sqrt(limit); i <= end; i++) {
		if (result[i]) {
			for (uint32_t j = i * i, bound = (uint32_t)-i; j <= limit; j += i) {
				result[j] = false;
				if (j >= bound)
					break;
			}
		}
	}
	return result;
}


uint32_t *sieve_smallest_prime_factor(uint32_t limit) {
	if (limit >= UINT32_MAX || limit >= SIZE_MAX)
		return NULL;
	uint32_t *result = calloc(limit + 1, sizeof(uint32_t));
	if (result == NULL)
		return NULL;
	
	if (limit > 0)
		result[1] = 1;
	for (uint32_t i = 2, sqrt = floor_sqrt(limit); i <= limit; i++) {
		if (result[i] == 0) {
			result[i] = i;
			if (i <= sqrt) {
				for (uint32_t j = i * i, bound = (uint32_t)-i; j <= limit; j += i) {
					if (result[j] == 0)
						result[j] = i;
					if (j >= bound)
						break;
				}
			}
		}
	}
	return result;
}


uint32_t *sieve_totient(uint32_t limit) {
	if (limit >= UINT32_MAX || limit >= SIZE_MAX)
		return NULL;
	uint32_t *result = calloc(limit + 1, sizeof(uint32_t));
	if (result == NULL)
		return NULL;
	
	for (uint32_t i = 0; i <= limit; i++)
		result[i] = i;
	for (uint32_t i = 2; i <= limit; i++) {
		if (result[i] == i) {
			for (uint32_t j = i, bound = (uint32_t)-i; j <= limit; j += i) {
				result[j] -= result[j] / i;
				if (j >= bound)
					break;
			}
		}
	}
	return result;
}


uint32_t *sieve_omega(uint32_t limit) {
	if (limit >= UINT32_MAX || limit >= SIZE_MAX)
		return NULL;
	uint32_t *result = calloc(limit + 1, sizeof(uint32_t));
	if (result == NULL)
		return NULL;
	
	for (uint32_t i = 2; i <= limit; i++) {
		if (result[i] == 0) {
			for (uint32_t j = i, bound = (uint32_t)-i; j <= limit; j += i) {
				result[j]++;
				if (j >= bound)
					break;
			}
		}
	}
	return result;
}


uint32_t *sieve_radical(uint32_t limit) {
	if (limit >= UINT32_MAX || limit >= SIZE_MAX)
		return NULL;
	uint32_t *result = calloc(limit + 1, sizeof(uint32_t));
	if (result == NULL)
		return NULL;
	
	for (uint32_t i = 1; i <= limit; i++)
		result[i] = 1;
	for (uint32_t i = 2; i <= limit; i++) {
		if (result[i] == 1) {
			for (uint32_t j = i, bound = (uint32_t)-i; j <= limit; j += i) {
				result[j] *= i;
				if (j >= bound)
					break;
			}
		}
	}
	return result;
}


// Helper function: y = floor(sqrt(x)).
static uint32_t floor_sqrt(uint32_t x) {
	uint32_t y = 0;
	for (uint32_t i = 1 << 15; i != 0; i >>= 1) {
		y |= i;
		if (y * y > x)
			y ^= i;
	}
	return y;
}
