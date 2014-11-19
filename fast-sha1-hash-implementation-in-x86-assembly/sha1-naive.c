/* 
 * SHA-1 hash in C
 * 
 * Copyright (c) 2014 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * http://www.nayuki.io/page/fast-sha1-hash-implementation-in-x86-assembly
 */

#include <stdint.h>


void sha1_compress(uint32_t state[5], const uint8_t block[64]) {
	#define LOADSCHEDULE(i)  \
		schedule[i] =                           \
			  (uint32_t)block[i * 4 + 0] << 24  \
			| (uint32_t)block[i * 4 + 1] << 16  \
			| (uint32_t)block[i * 4 + 2] <<  8  \
			| (uint32_t)block[i * 4 + 3];
	
	#define SCHEDULE(i)  \
		temp = schedule[i - 3] ^ schedule[i - 8] ^ schedule[i - 14] ^ schedule[i - 16];  \
		schedule[i] = temp << 1 | temp >> 31;
	
	#define ROUND0(a, b, c, d, e, i)  ROUNDTAIL(a, b, e, ((b & c) | (~b & d)),          i, 0x5A827999)
	#define ROUND1(a, b, c, d, e, i)  ROUNDTAIL(a, b, e, (b ^ c ^ d),                   i, 0x6ED9EBA1)
	#define ROUND2(a, b, c, d, e, i)  ROUNDTAIL(a, b, e, ((b & c) ^ (b & d) ^ (c & d)), i, 0x8F1BBCDC)
	#define ROUND3(a, b, c, d, e, i)  ROUNDTAIL(a, b, e, (b ^ c ^ d),                   i, 0xCA62C1D6)
	
	#define ROUNDTAIL(a, b, e, f, i, k)  \
		e += (a << 5 | a >> 27) + f + UINT32_C(k) + schedule[i];  \
		b = b << 30 | b >> 2;
	
	uint32_t a = state[0];
	uint32_t b = state[1];
	uint32_t c = state[2];
	uint32_t d = state[3];
	uint32_t e = state[4];
	
	uint32_t schedule[80];
	uint32_t temp;
	LOADSCHEDULE( 0)
	LOADSCHEDULE( 1)
	LOADSCHEDULE( 2)
	LOADSCHEDULE( 3)
	LOADSCHEDULE( 4)
	LOADSCHEDULE( 5)
	LOADSCHEDULE( 6)
	LOADSCHEDULE( 7)
	LOADSCHEDULE( 8)
	LOADSCHEDULE( 9)
	LOADSCHEDULE(10)
	LOADSCHEDULE(11)
	LOADSCHEDULE(12)
	LOADSCHEDULE(13)
	LOADSCHEDULE(14)
	LOADSCHEDULE(15)
	SCHEDULE(16)
	SCHEDULE(17)
	SCHEDULE(18)
	SCHEDULE(19)
	SCHEDULE(20)
	SCHEDULE(21)
	SCHEDULE(22)
	SCHEDULE(23)
	SCHEDULE(24)
	SCHEDULE(25)
	SCHEDULE(26)
	SCHEDULE(27)
	SCHEDULE(28)
	SCHEDULE(29)
	SCHEDULE(30)
	SCHEDULE(31)
	SCHEDULE(32)
	SCHEDULE(33)
	SCHEDULE(34)
	SCHEDULE(35)
	SCHEDULE(36)
	SCHEDULE(37)
	SCHEDULE(38)
	SCHEDULE(39)
	SCHEDULE(40)
	SCHEDULE(41)
	SCHEDULE(42)
	SCHEDULE(43)
	SCHEDULE(44)
	SCHEDULE(45)
	SCHEDULE(46)
	SCHEDULE(47)
	SCHEDULE(48)
	SCHEDULE(49)
	SCHEDULE(50)
	SCHEDULE(51)
	SCHEDULE(52)
	SCHEDULE(53)
	SCHEDULE(54)
	SCHEDULE(55)
	SCHEDULE(56)
	SCHEDULE(57)
	SCHEDULE(58)
	SCHEDULE(59)
	SCHEDULE(60)
	SCHEDULE(61)
	SCHEDULE(62)
	SCHEDULE(63)
	SCHEDULE(64)
	SCHEDULE(65)
	SCHEDULE(66)
	SCHEDULE(67)
	SCHEDULE(68)
	SCHEDULE(69)
	SCHEDULE(70)
	SCHEDULE(71)
	SCHEDULE(72)
	SCHEDULE(73)
	SCHEDULE(74)
	SCHEDULE(75)
	SCHEDULE(76)
	SCHEDULE(77)
	SCHEDULE(78)
	SCHEDULE(79)
	
	ROUND0(a, b, c, d, e,  0)
	ROUND0(e, a, b, c, d,  1)
	ROUND0(d, e, a, b, c,  2)
	ROUND0(c, d, e, a, b,  3)
	ROUND0(b, c, d, e, a,  4)
	ROUND0(a, b, c, d, e,  5)
	ROUND0(e, a, b, c, d,  6)
	ROUND0(d, e, a, b, c,  7)
	ROUND0(c, d, e, a, b,  8)
	ROUND0(b, c, d, e, a,  9)
	ROUND0(a, b, c, d, e, 10)
	ROUND0(e, a, b, c, d, 11)
	ROUND0(d, e, a, b, c, 12)
	ROUND0(c, d, e, a, b, 13)
	ROUND0(b, c, d, e, a, 14)
	ROUND0(a, b, c, d, e, 15)
	ROUND0(e, a, b, c, d, 16)
	ROUND0(d, e, a, b, c, 17)
	ROUND0(c, d, e, a, b, 18)
	ROUND0(b, c, d, e, a, 19)
	ROUND1(a, b, c, d, e, 20)
	ROUND1(e, a, b, c, d, 21)
	ROUND1(d, e, a, b, c, 22)
	ROUND1(c, d, e, a, b, 23)
	ROUND1(b, c, d, e, a, 24)
	ROUND1(a, b, c, d, e, 25)
	ROUND1(e, a, b, c, d, 26)
	ROUND1(d, e, a, b, c, 27)
	ROUND1(c, d, e, a, b, 28)
	ROUND1(b, c, d, e, a, 29)
	ROUND1(a, b, c, d, e, 30)
	ROUND1(e, a, b, c, d, 31)
	ROUND1(d, e, a, b, c, 32)
	ROUND1(c, d, e, a, b, 33)
	ROUND1(b, c, d, e, a, 34)
	ROUND1(a, b, c, d, e, 35)
	ROUND1(e, a, b, c, d, 36)
	ROUND1(d, e, a, b, c, 37)
	ROUND1(c, d, e, a, b, 38)
	ROUND1(b, c, d, e, a, 39)
	ROUND2(a, b, c, d, e, 40)
	ROUND2(e, a, b, c, d, 41)
	ROUND2(d, e, a, b, c, 42)
	ROUND2(c, d, e, a, b, 43)
	ROUND2(b, c, d, e, a, 44)
	ROUND2(a, b, c, d, e, 45)
	ROUND2(e, a, b, c, d, 46)
	ROUND2(d, e, a, b, c, 47)
	ROUND2(c, d, e, a, b, 48)
	ROUND2(b, c, d, e, a, 49)
	ROUND2(a, b, c, d, e, 50)
	ROUND2(e, a, b, c, d, 51)
	ROUND2(d, e, a, b, c, 52)
	ROUND2(c, d, e, a, b, 53)
	ROUND2(b, c, d, e, a, 54)
	ROUND2(a, b, c, d, e, 55)
	ROUND2(e, a, b, c, d, 56)
	ROUND2(d, e, a, b, c, 57)
	ROUND2(c, d, e, a, b, 58)
	ROUND2(b, c, d, e, a, 59)
	ROUND3(a, b, c, d, e, 60)
	ROUND3(e, a, b, c, d, 61)
	ROUND3(d, e, a, b, c, 62)
	ROUND3(c, d, e, a, b, 63)
	ROUND3(b, c, d, e, a, 64)
	ROUND3(a, b, c, d, e, 65)
	ROUND3(e, a, b, c, d, 66)
	ROUND3(d, e, a, b, c, 67)
	ROUND3(c, d, e, a, b, 68)
	ROUND3(b, c, d, e, a, 69)
	ROUND3(a, b, c, d, e, 70)
	ROUND3(e, a, b, c, d, 71)
	ROUND3(d, e, a, b, c, 72)
	ROUND3(c, d, e, a, b, 73)
	ROUND3(b, c, d, e, a, 74)
	ROUND3(a, b, c, d, e, 75)
	ROUND3(e, a, b, c, d, 76)
	ROUND3(d, e, a, b, c, 77)
	ROUND3(c, d, e, a, b, 78)
	ROUND3(b, c, d, e, a, 79)
	
	state[0] += a;
	state[1] += b;
	state[2] += c;
	state[3] += d;
	state[4] += e;
}
