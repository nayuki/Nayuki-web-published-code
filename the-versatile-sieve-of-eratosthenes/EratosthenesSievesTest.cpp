/* 
 * Test of variants of the sieve of Eratosthenes (C++)
 * by Project Nayuki, 2017. Public domain.
 * https://www.nayuki.io/page/the-versatile-sieve-of-eratosthenes
 */

#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <iostream>
#include <vector>
#include "EratosthenesSieves.hpp"

using std::uint32_t;


void testValues() {
	{
		bool expected[] = {false, false, true, true, false, true, false, true, false, false, false, true, false, true, false, false, false, true, false, true, false, false, false, true, false, false, false, false, false, true, false};
		std::vector<bool> actual = sievePrimeness(30);
		// Note: vector<bool> is a specialized template, so actual.data() isn't a pointer to bool
		for (unsigned int i = 0; i < sizeof(expected) / sizeof(expected[0]); i++) {
			if (actual.at(i) != expected[i]) {
				std::cout << "Mismatch" << std::endl;
				std::exit(1);
			}
		}
	}
	{
		uint32_t expected[] = {0, 1, 2, 3, 2, 5, 2, 7, 2, 3, 2, 11, 2, 13, 2, 3, 2, 17, 2, 19, 2, 3, 2, 23, 2, 5, 2, 3, 2, 29, 2};
		std::vector<uint32_t> actual = sieveSmallestPrimeFactor(30);
		if (std::memcmp(expected, actual.data(), sizeof(expected)) != 0) {
			std::cout << "Mismatch" << std::endl;
			std::exit(1);
		}
	}
	{
		uint32_t expected[] = {0, 1, 1, 2, 2, 4, 2, 6, 4, 6, 4, 10, 4, 12, 6, 8, 8, 16, 6, 18, 8, 12, 10, 22, 8, 20, 12, 18, 12, 28, 8};
		std::vector<uint32_t> actual = sieveTotient(30);
		if (std::memcmp(expected, actual.data(), sizeof(expected)) != 0) {
			std::cout << "Mismatch" << std::endl;
			std::exit(1);
		}
	}
	{
		uint32_t expected[] = {0, 0, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 2, 2, 1, 1, 2, 1, 2, 2, 2, 1, 2, 1, 2, 1, 2, 1, 3};
		std::vector<uint32_t> actual = sieveOmega(30);
		if (std::memcmp(expected, actual.data(), sizeof(expected)) != 0) {
			std::cout << "Mismatch" << std::endl;
			std::exit(1);
		}
	}
	{
		uint32_t expected[] = {0, 1, 2, 3, 2, 5, 6, 7, 2, 3, 10, 11, 6, 13, 14, 15, 2, 17, 6, 19, 10, 21, 22, 23, 6, 5, 26, 3, 14, 29, 30};
		std::vector<uint32_t> actual = sieveRadical(30);
		if (std::memcmp(expected, actual.data(), sizeof(expected)) != 0) {
			std::cout << "Mismatch" << std::endl;
			std::exit(1);
		}
	}
}


void testPrefixConsistency() {
	const uint32_t N = 10000;
	{
		std::vector<bool> prev(0);
		for (uint32_t i = 0; i < N; i++) {
			std::vector<bool> cur = sievePrimeness(i);
			for (uint32_t j = 0; j < i; j++) {
				if (cur.at(j) != prev.at(j)) {
					std::cout << "Mismatch" << std::endl;
					std::exit(1);
				}
			}
			prev = cur;
		}
	}
	{
		std::vector<uint32_t> (*FUNCS[])(uint32_t) = {
			sieveSmallestPrimeFactor,
			sieveTotient,
			sieveOmega,
			sieveRadical,
		};
		for (unsigned int k = 0; k < sizeof(FUNCS) / sizeof(FUNCS[0]); k++) {
			std::vector<uint32_t> prev(0);
			for (uint32_t i = 0; i < N; i++) {
				std::vector<uint32_t> cur = FUNCS[k](i);
				for (uint32_t j = 0; j < i; j++) {
					if (cur.at(j) != prev.at(j)) {
						std::cout << "Mismatch" << std::endl;
						std::exit(1);
					}
				}
				prev = cur;
			}
		}
	}
}


int main() {
	testValues();
	testPrefixConsistency();
	return EXIT_SUCCESS;
}
