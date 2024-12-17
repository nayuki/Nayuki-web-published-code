/* 
 * CRC-32 forcer (C++)
 * 
 * Copyright (c) 2024 Project Nayuki
 * https://www.nayuki.io/page/forcing-a-files-crc-to-any-value
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program (see COPYING.txt).
 * If not, see <http://www.gnu.org/licenses/>.
 */

#include <array>
#include <cstdint>
#include <cstdlib>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <limits>
#include <sstream>
#include <stdexcept>
#include <string>
#include <utility>

using std::uint32_t;
using std::uint64_t;


/* Forward declarations */

void modifyFileCrc32(const std::string &path, uint64_t offset, uint32_t newcrc, bool printstatus);

static std::pair<uint32_t,uint64_t> getCrc32AndLength(std::istream &f);
static uint32_t reverseBits(uint32_t x);

static uint64_t multiplyMod(uint64_t x, uint64_t y);
static uint64_t powMod(uint64_t x, uint64_t y);
static std::pair<uint64_t,uint64_t> divideAndRemainder(uint64_t x, uint64_t y);
static uint64_t reciprocalMod(uint64_t x);
static int getDegree(uint64_t x);


/*---- Main application ----*/

int main(int argc, char *argv[]) {
	// Handle arguments
	if (argc != 4) {
		std::cerr << "Usage: " << argv[0] << " FileName ByteOffset NewCrc32Value" << std::endl;
		return EXIT_FAILURE;
	}
	
	// Parse and check file offset argument
	uint64_t offset;
	{
		std::istringstream ss(argv[2]);
		ss >> offset;
		if (ss.fail() || !ss.eof()) {
			std::cerr << "Error: Invalid byte offset" << std::endl;
			return EXIT_FAILURE;
		}
	}
	
	// Parse and check new CRC argument
	uint32_t newcrc;
	{
		std::string s(argv[3]);
		if (s.size() != 8 || s[0] == '+' || s[0] == '-') {
			std::cerr << "Error: Invalid new CRC-32 value" << std::endl;
			return EXIT_FAILURE;
		}
		std::istringstream ss(s);
		ss >> std::hex >> newcrc;
		if (ss.fail() || !ss.eof()) {
			std::cerr << "Error: Invalid new CRC-32 value" << std::endl;
			return EXIT_FAILURE;
		}
	}
	newcrc = reverseBits(newcrc);
	
	// Process the file
	modifyFileCrc32(std::string(argv[1]), offset, newcrc, true);
	return EXIT_SUCCESS;
}


/*---- Main function ----*/

// Public library function.
void modifyFileCrc32(const std::string &path, uint64_t offset, uint32_t newcrc, bool printstatus) {
	std::fstream f(path, std::ios::in | std::ios::out | std::ios::binary);
	
	// Read entire file and calculate original CRC-32 value
	uint64_t length;
	uint32_t crc;
	{
		std::pair<uint32_t,uint64_t> temp = getCrc32AndLength(f);
		crc = temp.first;
		length = temp.second;
	}
	if (length < 4 || offset > length - 4)
		throw std::domain_error("Error: Byte offset plus 4 exceeds file length");
	if (printstatus) {
		std::ostringstream ss;
		ss << std::hex << std::uppercase << std::setfill('0') << std::setw(8) << reverseBits(crc);
		std::cout << "Original CRC-32: " << ss.str() << std::endl;
	}
	
	// Compute the change to make
	uint32_t delta = crc ^ newcrc;
	delta = static_cast<uint32_t>(multiplyMod(reciprocalMod(powMod(2, (length - offset) * 8)), delta));
	
	// Patch 4 bytes in the file
	if (offset > std::numeric_limits<std::streamoff>::max())
		throw std::domain_error("Offset too large");
	f.clear();
	for (int i = 0; i < 4; i++) {
		f.seekg(offset + i, std::ios::beg);
		int b = f.get();
		if (b == std::char_traits<char>::eof())
			throw std::runtime_error("Unexpected end of file");
		b ^= static_cast<int>((reverseBits(delta) >> (i * 8)) & 0xFF);
		f.seekp(offset + i, std::ios::beg);
		f.put(b);
		f.flush();
	}
	if (printstatus)
		std::cout << "Computed and wrote patch" << std::endl;
	
	// Recheck entire file
	bool match = getCrc32AndLength(f).first == newcrc;
	f.close();
	if (!match)
		throw std::logic_error("Assertion error: Failed to update CRC-32 to desired value");
	if (printstatus)
		std::cout << "New CRC-32 successfully verified" << std::endl;
}


/*---- Utilities ----*/

// Generator polynomial. Do not modify, because there are many dependencies
static const uint64_t POLYNOMIAL = UINT64_C(0x104C11DB7);


static std::pair<uint32_t,uint64_t> getCrc32AndLength(std::istream &f) {
	f.clear();
	f.seekg(0, std::ios::beg);
	uint32_t crc = UINT32_C(0xFFFFFFFF);
	uint64_t length = 0;
	while (!f.eof()) {
		std::array<char,32*1024> buffer;
		f.read(buffer.data(), buffer.size());
		std::streamsize n = f.gcount();
		for (std::streamsize i = 0; i < n; i++) {
			for (int j = 0; j < 8; j++) {
				uint32_t bit = (static_cast<std::uint8_t>(buffer[i]) >> j) & 1;
				crc ^= bit << 31;
				bool doXor = (crc >> 31) != 0;
				crc = (crc & UINT32_C(0x7FFFFFFF)) << 1;
				if (doXor)
					crc ^= static_cast<uint32_t>(POLYNOMIAL);
			}
		}
		length = 0U + length + n;
	}
	return std::pair<uint32_t,uint64_t>(~crc, length);
}


static uint32_t reverseBits(uint32_t x) {
	uint32_t result = 0;
	for (int i = 0; i < 32; i++, x >>= 1)
		result = (result << 1) | (x & 1U);
	return result;
}


/*---- Polynomial arithmetic ----*/

// Returns polynomial x multiplied by polynomial y modulo the generator polynomial.
static uint64_t multiplyMod(uint64_t x, uint64_t y) {
	// Russian peasant multiplication algorithm
	uint64_t z = 0;
	while (y != 0) {
		z ^= x * (y & 1);
		y >>= 1;
		x <<= 1;
		if (((x >> 32) & 1) != 0)
			x ^= POLYNOMIAL;
	}
	return z;
}


// Returns polynomial x to the power of natural number y modulo the generator polynomial.
static uint64_t powMod(uint64_t x, uint64_t y) {
	// Exponentiation by squaring
	uint64_t z = 1;
	while (y != 0) {
		if ((y & 1) != 0)
			z = multiplyMod(z, x);
		x = multiplyMod(x, x);
		y >>= 1;
	}
	return z;
}


// Computes polynomial x divided by polynomial y, returning the quotient and remainder.
static std::pair<uint64_t,uint64_t> divideAndRemainder(uint64_t x, uint64_t y) {
	if (y == 0)
		throw std::domain_error("Division by zero");
	if (x == 0)
		return std::pair<uint64_t,uint64_t>(0, 0);
	
	int ydeg = getDegree(y);
	uint64_t z = 0;
	for (int i = getDegree(x) - ydeg; i >= 0; i--) {
		if (((x >> (i + ydeg)) & 1) != 0) {
			x ^= y << i;
			z |= static_cast<uint64_t>(1 << i);
		}
	}
	return std::pair<uint64_t,uint64_t>(z, x);
}


// Returns the reciprocal of polynomial x with respect to the generator polynomial.
static uint64_t reciprocalMod(uint64_t x) {
	// Based on a simplification of the extended Euclidean algorithm
	uint64_t y = x;
	x = POLYNOMIAL;
	uint64_t a = 0;
	uint64_t b = 1;
	while (y != 0) {
		std::pair<uint64_t,uint64_t> qr = divideAndRemainder(x, y);
		uint64_t c = a ^ multiplyMod(qr.first, b);
		x = y;
		y = qr.second;
		a = b;
		b = c;
	}
	if (x == 1)
		return a;
	else
		throw std::domain_error("Reciprocal does not exist");
}


static int getDegree(uint64_t x) {
	int result = -1;
	for (; x != 0; x >>= 1)
		result++;
	return result;
}
