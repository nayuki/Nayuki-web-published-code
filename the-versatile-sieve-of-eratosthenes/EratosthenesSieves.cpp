/* 
 * Variants of the sieve of Eratosthenes (C++)
 * by Project Nayuki, 2017. Public domain.
 * https://www.nayuki.io/page/the-versatile-sieve-of-eratosthenes
 */

#include "EratosthenesSieves.hpp"

using std::uint32_t;


// Function prototypes
static uint32_t floorSqrt(uint32_t x);


/*---- Function definitions ----*/

std::vector<bool> sievePrimeness(uint32_t limit) {
	if (limit >= UINT32_MAX || limit >= SIZE_MAX)
		throw "Limit too large";
	
	std::vector<bool> result(limit + 1, true);
	result.at(0) = false;
	if (limit > 0)
		result.at(1) = false;
	
	for (uint32_t i = 2, end = floorSqrt(limit); i <= end; i++) {
		if (result.at(i)) {
			for (uint32_t j = i * i, bound = (uint32_t)-i; j <= limit; j += i) {
				result.at(j) = false;
				if (j >= bound)
					break;
			}
		}
	}
	return result;
}


std::vector<uint32_t> sieveSmallestPrimeFactor(uint32_t limit) {
	if (limit >= UINT32_MAX || limit >= SIZE_MAX)
		throw "Limit too large";
	
	std::vector<uint32_t> result(limit + 1, 0);
	if (limit > 0)
		result.at(1) = 1;
	
	for (uint32_t i = 2, sqrt = floorSqrt(limit); i <= limit; i++) {
		if (result.at(i) == 0) {
			result.at(i) = i;
			if (i <= sqrt) {
				for (uint32_t j = i * i, bound = (uint32_t)-i; j <= limit; j += i) {
					if (result.at(j) == 0)
						result.at(j) = i;
					if (j >= bound)
						break;
				}
			}
		}
	}
	return result;
}


std::vector<uint32_t> sieveTotient(uint32_t limit) {
	if (limit >= UINT32_MAX || limit >= SIZE_MAX)
		throw "Limit too large";
	
	std::vector<uint32_t> result(limit + 1);
	for (uint32_t i = 0; i <= limit; i++)
		result.at(i) = i;
	
	for (uint32_t i = 2; i <= limit; i++) {
		if (result.at(i) == i) {
			for (uint32_t j = i, bound = (uint32_t)-i; j <= limit; j += i) {
				result.at(j) -= result.at(j) / i;
				if (j >= bound)
					break;
			}
		}
	}
	return result;
}


std::vector<uint32_t> sieveOmega(uint32_t limit) {
	if (limit >= UINT32_MAX || limit >= SIZE_MAX)
		throw "Limit too large";
	
	std::vector<uint32_t> result(limit + 1, 0);
	for (uint32_t i = 2; i <= limit; i++) {
		if (result.at(i) == 0) {
			for (uint32_t j = i, bound = (uint32_t)-i; j <= limit; j += i) {
				result.at(j)++;
				if (j >= bound)
					break;
			}
		}
	}
	return result;
}


std::vector<uint32_t> sieveRadical(uint32_t limit) {
	if (limit >= UINT32_MAX || limit >= SIZE_MAX)
		throw "Limit too large";

	std::vector<uint32_t> result(limit + 1, 1);
	result.at(0) = 0;
	
	for (uint32_t i = 2; i <= limit; i++) {
		if (result.at(i) == 1) {
			for (uint32_t j = i, bound = (uint32_t)-i; j <= limit; j += i) {
				result.at(j) *= i;
				if (j >= bound)
					break;
			}
		}
	}
	return result;
}


// Helper function: y = floor(sqrt(x)).
static uint32_t floorSqrt(uint32_t x) {
	uint32_t y = 0;
	for (uint32_t i = 1 << 15; i != 0; i >>= 1) {
		y |= i;
		if (y * y > x)
			y ^= i;
	}
	return y;
}
