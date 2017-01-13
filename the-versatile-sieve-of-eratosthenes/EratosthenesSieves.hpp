/* 
 * Variants of the sieve of Eratosthenes (C++)
 * by Project Nayuki, 2017. Public domain.
 * https://www.nayuki.io/page/the-versatile-sieve-of-eratosthenes
 */

#pragma once

#include <cstdint>
#include <vector>


// Given an integer limit, this returns a list of Booleans
// where result[k] indicates whether k is a prime number.
std::vector<bool> sievePrimeness(uint32_t limit);


// Given an integer limit, this returns a list of integers
// where result[k] is the smallest prime factor of k.
std::vector<uint32_t> sieveSmallestPrimeFactor(uint32_t limit);


// Given an integer limit, this returns a list of integers
// where result[k] is the totient (Euler phi function) of k.
std::vector<uint32_t> sieveTotient(uint32_t limit);


// Given an integer limit, this returns a list of integers where result[k]
// is the number of unique prime factors (omega function) of k.
std::vector<uint32_t> sieveOmega(uint32_t limit);


// Given an integer limit, this returns a list of integers where result[k]
// is the product of the unique prime factors (radical function) of k.
std::vector<uint32_t> sieveRadical(uint32_t limit);
