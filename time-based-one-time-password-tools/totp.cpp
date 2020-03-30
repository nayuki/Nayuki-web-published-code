/* 
 * Time-based One-Time Password tools (C++)
 * 
 * Copyright (c) 2020 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/time-based-one-time-password-tools
 * 
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

#include <cctype>
#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <ctime>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

using std::uint8_t;
using std::uint32_t;
using std::int64_t;
using std::uint64_t;
using std::size_t;
using std::string;
using std::vector;


// Function prototypes
static vector<uint8_t> decodeBase32(const char *str);
string calcTotp(
	const vector<uint8_t> &secretKey,
	int64_t epoch,
	int64_t timeStep,
	int64_t timestamp,
	int codeLen,
	vector<uint8_t> (*hashFunc)(const vector<uint8_t> &),
	int blockSize);
string calcHotp(const vector<uint8_t> &secretKey,
	const vector<uint8_t> &counter,
	int codeLen,
	vector<uint8_t> (*hashFunc)(const vector<uint8_t> &),
	int blockSize);
static vector<uint8_t> calcHmac(const vector<uint8_t> &key,
	const vector<uint8_t> &message,
	vector<uint8_t> (*hashFunc)(const vector<uint8_t> &),
	int blockSize);
vector<uint8_t> calcSha1Hash(const vector<uint8_t> &message);
static vector<uint8_t> toBytesBigEndian(uint64_t x);
static uint32_t rotateLeft(uint32_t x, int i);
static void testHotp();
static void testTotp();


/*---- Main program ----*/

int main(int argc, char **argv) {
	try {
		if (argc == 1) {
			testHotp();
			testTotp();
			std::cerr << "Test passed" << std::endl;
		} else if (argc == 2) {
			vector<uint8_t> secretKey = decodeBase32(argv[1]);
			int64_t timestamp = std::time(nullptr);
			string code = calcTotp(secretKey, 0, 30, timestamp, 6, calcSha1Hash, 64);
			std::cout << code << std::endl;
		} else
			throw "Usage: totp [SecretKey]";
		return EXIT_SUCCESS;
	} catch (const char *msg) {
		std::cerr << msg << std::endl;
		return EXIT_FAILURE;
	}
}


static vector<uint8_t> decodeBase32(const char *str) {
	static const char *const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
	vector<uint8_t> result;
	for (int bits = 0, bitsLen = 0; *str != '\0'; str++) {
		char c = *str;
		if (c == ' ')
			continue;
		const char *p = std::strchr(ALPHABET, std::toupper(c));
		if (p == nullptr)
			throw "Invalid Base32 string";
		bits = (bits << 5) | (p - ALPHABET);
		bitsLen += 5;
		if (bitsLen >= 8) {
			bitsLen -= 8;
			result.push_back(static_cast<uint8_t>(bits >> bitsLen));
			bits &= (1 << bitsLen) - 1;
		}
	}
	return result;
}



/*---- Library functions ----*/

// Time-based One-Time Password algorithm (RFC 6238)
string calcTotp(
		const vector<uint8_t> &secretKey,
		int64_t epoch,
		int64_t timeStep,
		int64_t timestamp,
		int codeLen,
		vector<uint8_t> (*hashFunc)(const vector<uint8_t> &),
		int blockSize) {
	
	// Calculate counter and HOTP
	int64_t temp = timestamp - epoch;
	if (temp < 0)
		temp -= timeStep - 1;
	uint64_t timeCounter = static_cast<uint64_t>(temp / timeStep);
	vector<uint8_t> counter = toBytesBigEndian(timeCounter);
	return calcHotp(secretKey, counter, codeLen, hashFunc, blockSize);
}


// HMAC-based One-Time Password algorithm (RFC 4226)
string calcHotp(
		const vector<uint8_t> &secretKey,
		const vector<uint8_t> &counter,
		int codeLen,
		vector<uint8_t> (*hashFunc)(const vector<uint8_t> &),
		int blockSize) {
	
	// Check argument, calculate HMAC
	if (!(1 <= codeLen && codeLen <= 9))
		throw "Invalid number of digits";
	vector<uint8_t> hash = calcHmac(secretKey, counter, hashFunc, blockSize);
	
	// Dynamically truncate the hash value
	int offset = hash.back() & 0xF;
	unsigned long val = 0;
	for (int i = 0; i < 4; i++)
		val |= static_cast<unsigned long>(hash.at(offset + i)) << ((3 - i) * 8);
	val &= 0x7FFFFFFFUL;
	
	// Extract and format base-10 digits
	unsigned long tenPow = 1;
	for (int i = 0; i < codeLen; i++)
		tenPow *= 10;
	std::ostringstream result;
	result << std::setw(codeLen) << std::setfill('0') << (val % tenPow);
	return result.str();
}


static vector<uint8_t> calcHmac(
		const vector<uint8_t> &key,
		const vector<uint8_t> &message,
		vector<uint8_t> (*hashFunc)(const vector<uint8_t> &),
		int blockSize) {
	
	if (blockSize < 1)
		throw "Invalid block size";
	
	vector<uint8_t> newKey = key.size() <= static_cast<unsigned int>(blockSize) ? key : hashFunc(key);
	while (newKey.size() < static_cast<unsigned int>(blockSize))
		newKey.push_back(0);
	
	vector<uint8_t> innerMsg;
	for (auto it = newKey.cbegin(); it != newKey.cend(); ++it)
		innerMsg.push_back(static_cast<uint8_t>(*it ^ 0x36));
	innerMsg.insert(innerMsg.end(), message.cbegin(), message.cend());
	vector<uint8_t> innerHash = hashFunc(innerMsg);
	
	vector<uint8_t> outerMsg;
	for (auto it = newKey.cbegin(); it != newKey.cend(); ++it)
		outerMsg.push_back(static_cast<uint8_t>(*it ^ 0x5C));
	outerMsg.insert(outerMsg.end(), innerHash.cbegin(), innerHash.cend());
	return hashFunc(outerMsg);
}


vector<uint8_t> calcSha1Hash(const vector<uint8_t> &message) {
	vector<uint8_t> bitLenBytes = toBytesBigEndian(message.size() * UINT64_C(8));
	vector<uint8_t> msg = message;
	msg.push_back(0x80);
	while ((msg.size() + 8) % 64 != 0)
		msg.push_back(0x00);
	msg.insert(msg.end(), bitLenBytes.cbegin(), bitLenBytes.cend());
	
	uint32_t state[] = {
		UINT32_C(0x67452301),
		UINT32_C(0xEFCDAB89),
		UINT32_C(0x98BADCFE),
		UINT32_C(0x10325476),
		UINT32_C(0xC3D2E1F0),
	};
	for (size_t i = 0; i < msg.size(); i += 64) {
		vector<uint32_t> schedule(16, 0);
		for (size_t j = 0; j < schedule.size() * 4; j++)
			schedule.at(j / 4) |= static_cast<uint32_t>(msg.at(i + j)) << ((3 - j % 4) * 8);
		for (size_t j = schedule.size(); j < 80; j++) {
			uint32_t temp = schedule.at(j - 3) ^ schedule.at(j - 8) ^ schedule.at(j - 14) ^ schedule.at(j - 16);
			schedule.push_back(rotateLeft(temp, 1));
		}
		uint32_t a = state[0];
		uint32_t b = state[1];
		uint32_t c = state[2];
		uint32_t d = state[3];
		uint32_t e = state[4];
		for (size_t j = 0; j < schedule.size(); j++) {
			uint32_t f, rc;
			switch (j / 20) {
				case 0:  f = (b & c) | (~b & d);           rc = UINT32_C(0x5A827999);  break;
				case 1:  f = b ^ c ^ d;                    rc = UINT32_C(0x6ED9EBA1);  break;
				case 2:  f = (b & c) ^ (b & d) ^ (c & d);  rc = UINT32_C(0x8F1BBCDC);  break;
				case 3:  f = b ^ c ^ d;                    rc = UINT32_C(0xCA62C1D6);  break;
				default:  throw "Assertion error";
			}
			uint32_t temp = 0U + rotateLeft(a, 5) + f + e + schedule.at(j) + rc;
			e = d;
			d = c;
			c = rotateLeft(b, 30);
			b = a;
			a = temp;
		}
		state[0] = 0U + state[0] + a;
		state[1] = 0U + state[1] + b;
		state[2] = 0U + state[2] + c;
		state[3] = 0U + state[3] + d;
		state[4] = 0U + state[4] + e;
	}
	
	vector<uint8_t> result;
	for (uint32_t val : state) {
		for (int i = 3; i >= 0; i--)
			result.push_back(static_cast<uint8_t>(val >> (i * 8)));
	}
	return result;
}


static vector<uint8_t> toBytesBigEndian(uint64_t x) {
	vector<uint8_t> result(8);
	for (auto it = result.rbegin(); it != result.rend(); ++it, x >>= 8)
		*it = static_cast<uint8_t>(x);
	return result;
}


static uint32_t rotateLeft(uint32_t x, int i) {
	return ((0U + x) << i) | (x >> (32 - i));
}



/*---- Test suite ----*/

static void testHotp() {
	struct TestCase {
		uint64_t counter;
		const char *expected;
	};
	const vector<TestCase> CASES{
		{0, "284755224"},
		{1, "094287082"},
		{2, "137359152"},
		{3, "726969429"},
		{4, "640338314"},
		{5, "868254676"},
		{6, "918287922"},
		{7, "082162583"},
		{8, "673399871"},
		{9, "645520489"},
	};
	const vector<uint8_t> SECRET_KEY = {
		0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30,
		0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30,
	};
	
	for (const TestCase &tc : CASES) {
		vector<uint8_t> counterBytes = toBytesBigEndian(tc.counter);
		string actual = calcHotp(SECRET_KEY, counterBytes, 9, calcSha1Hash, 64);
		if (actual != string(tc.expected))
			throw "Value mismatch";
	}
}


static void testTotp() {
	struct TestCase {
		int64_t timestamp;
		const char *expected;
	};
	const vector<TestCase> CASES{
		{INT64_C(         59), "94287082"},
		{INT64_C( 1111111109), "07081804"},
		{INT64_C( 1111111111), "14050471"},
		{INT64_C( 1234567890), "89005924"},
		{INT64_C( 2000000000), "69279037"},
		{INT64_C(20000000000), "65353130"},
	};
	const vector<uint8_t> SECRET_KEY = {
		0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30,
		0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30,
	};
	
	for (const TestCase &tc : CASES) {
		string actual = calcTotp(SECRET_KEY, 0, 30, tc.timestamp, 8, calcSha1Hash, 64);
		if (actual != string(tc.expected))
			throw "Value mismatch";
	}
}
