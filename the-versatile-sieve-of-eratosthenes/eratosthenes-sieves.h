/* 
 * Variants of the sieve of Eratosthenes (C)
 * by Project Nayuki, 2018. Public domain.
 * https://www.nayuki.io/page/the-versatile-sieve-of-eratosthenes
 */

#pragma once

#include <stdbool.h>
#include <stdint.h>


#ifdef __cplusplus
extern "C" {
#endif


// Given an integer limit, this returns a list of Booleans
// where result[k] indicates whether k is a prime number.
bool *sieve_primeness(uint32_t limit);


// Given an integer limit, this returns a list of integers
// where result[k] is the smallest prime factor of k.
uint32_t *sieve_smallest_prime_factor(uint32_t limit);


// Given an integer limit, this returns a list of integers
// where result[k] is the totient (Euler phi function) of k.
uint32_t *sieve_totient(uint32_t limit);


// Given an integer limit, this returns a list of integers where result[k]
// is the number of unique prime factors (omega function) of k.
uint32_t *sieve_omega(uint32_t limit);


// Given an integer limit, this returns a list of integers where result[k]
// is the product of the unique prime factors (radical function) of k.
uint32_t *sieve_radical(uint32_t limit);


#ifdef __cplusplus
}
#endif
