/* 
 * Test of variants of the sieve of Eratosthenes (C++)
 * by Project Nayuki, 2017. Public domain.
 * https://www.nayuki.io/page/the-versatile-sieve-of-eratosthenes
 */

#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <iostream>
#include <vector>
#include "EratosthenesSieves.hpp"

using std::size_t;
using std::uint32_t;
using std::vector;


// Forward declarations
static void testValues();
static void testPrefixConsistency();


int main() {
	try {
		testValues();
		testPrefixConsistency();
		
		std::cerr << "Test passed" << std::endl;
		return EXIT_SUCCESS;
	} catch (const char *msg) {
		std::cerr << msg << std::endl;
		return EXIT_FAILURE;
	}
}


static void testValues() {
	{
		vector<bool> expected{false, false, true, true, false, true, false, true, false, false, false, true, false, true, false, false, false, true, false, true, false, false, false, true, false, false, false, false, false, true, false};
		vector<bool> actual = sievePrimeness(30);
		if (actual != expected)
			throw "Mismatch";
	}
	{
		vector<uint32_t> expected{0, 1, 2, 3, 2, 5, 2, 7, 2, 3, 2, 11, 2, 13, 2, 3, 2, 17, 2, 19, 2, 3, 2, 23, 2, 5, 2, 3, 2, 29, 2};
		vector<uint32_t> actual = sieveSmallestPrimeFactor(30);
		if (actual != expected)
			throw "Mismatch";
	}
	{
		vector<uint32_t> expected{0, 1, 1, 2, 2, 4, 2, 6, 4, 6, 4, 10, 4, 12, 6, 8, 8, 16, 6, 18, 8, 12, 10, 22, 8, 20, 12, 18, 12, 28, 8};
		vector<uint32_t> actual = sieveTotient(30);
		if (actual != expected)
			throw "Mismatch";
	}
	{
		vector<uint32_t> expected{0, 0, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 2, 2, 1, 1, 2, 1, 2, 2, 2, 1, 2, 1, 2, 1, 2, 1, 3};
		vector<uint32_t> actual = sieveOmega(30);
		if (actual != expected)
			throw "Mismatch";
	}
	{
		vector<uint32_t> expected{0, 1, 2, 3, 2, 5, 6, 7, 2, 3, 10, 11, 6, 13, 14, 15, 2, 17, 6, 19, 10, 21, 22, 23, 6, 5, 26, 3, 14, 29, 30};
		vector<uint32_t> actual = sieveRadical(30);
		if (actual != expected)
			throw "Mismatch";
	}
}


static void testPrefixConsistency() {
	const uint32_t N = 10000;
	{
		vector<bool> prev;
		for (uint32_t i = 0; i < N; i++) {
			vector<bool> cur = sievePrimeness(i);
			for (uint32_t j = 0; j < i; j++) {
				if (cur.at(j) != prev.at(j))
					throw "Mismatch";
			}
			prev = cur;
		}
	}
	{
		vector<vector<uint32_t> (*)(uint32_t)> FUNCS{
			sieveSmallestPrimeFactor,
			sieveTotient,
			sieveOmega,
			sieveRadical,
		};
		for (vector<uint32_t> (*func)(uint32_t) : FUNCS) {
			vector<uint32_t> prev;
			for (uint32_t i = 0; i < N; i++) {
				vector<uint32_t> cur = func(i);
				for (uint32_t j = 0; j < i; j++) {
					if (cur.at(j) != prev.at(j))
						throw "Mismatch";
				}
				prev = cur;
			}
		}
	}
}
