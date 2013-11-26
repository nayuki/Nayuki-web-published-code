/* 
 * MD5 hash in C
 * 
 * Copyright (c) 2013 Nayuki Minase. All rights reserved.
 * http://nayuki.eigenstate.org/page/fast-md5-hash-implementation-in-x86-assembly
 */


#include <stdint.h>


#define ROUND0(a,b,c,d,k,s,t)  ROUND_TAIL(a, b, d ^ (b & (c ^ d)), k, s, t)
#define ROUND1(a,b,c,d,k,s,t)  ROUND_TAIL(a, b, c ^ (d & (b ^ c)), k, s, t)
#define ROUND2(a,b,c,d,k,s,t)  ROUND_TAIL(a, b, b ^ c ^ d        , k, s, t)
#define ROUND3(a,b,c,d,k,s,t)  ROUND_TAIL(a, b, c ^ (b | ~d)     , k, s, t)

#define ROUND_TAIL(a, b, expr, k, s, t)  \
	a += (expr) + t + block[k];          \
	a = b + (a << s | a >> (32 - s));

void md5_compress(uint32_t *state, uint32_t *block) {
	uint32_t a = state[0];
	uint32_t b = state[1];
	uint32_t c = state[2];
	uint32_t d = state[3];
	
	ROUND0(a, b, c, d,  0,  7, UINT32_C(0xD76AA478))
	ROUND0(d, a, b, c,  1, 12, UINT32_C(0xE8C7B756))
	ROUND0(c, d, a, b,  2, 17, UINT32_C(0x242070DB))
	ROUND0(b, c, d, a,  3, 22, UINT32_C(0xC1BDCEEE))
	ROUND0(a, b, c, d,  4,  7, UINT32_C(0xF57C0FAF))
	ROUND0(d, a, b, c,  5, 12, UINT32_C(0x4787C62A))
	ROUND0(c, d, a, b,  6, 17, UINT32_C(0xA8304613))
	ROUND0(b, c, d, a,  7, 22, UINT32_C(0xFD469501))
	ROUND0(a, b, c, d,  8,  7, UINT32_C(0x698098D8))
	ROUND0(d, a, b, c,  9, 12, UINT32_C(0x8B44F7AF))
	ROUND0(c, d, a, b, 10, 17, UINT32_C(0xFFFF5BB1))
	ROUND0(b, c, d, a, 11, 22, UINT32_C(0x895CD7BE))
	ROUND0(a, b, c, d, 12,  7, UINT32_C(0x6B901122))
	ROUND0(d, a, b, c, 13, 12, UINT32_C(0xFD987193))
	ROUND0(c, d, a, b, 14, 17, UINT32_C(0xA679438E))
	ROUND0(b, c, d, a, 15, 22, UINT32_C(0x49B40821))
	ROUND1(a, b, c, d,  1,  5, UINT32_C(0xF61E2562))
	ROUND1(d, a, b, c,  6,  9, UINT32_C(0xC040B340))
	ROUND1(c, d, a, b, 11, 14, UINT32_C(0x265E5A51))
	ROUND1(b, c, d, a,  0, 20, UINT32_C(0xE9B6C7AA))
	ROUND1(a, b, c, d,  5,  5, UINT32_C(0xD62F105D))
	ROUND1(d, a, b, c, 10,  9, UINT32_C(0x02441453))
	ROUND1(c, d, a, b, 15, 14, UINT32_C(0xD8A1E681))
	ROUND1(b, c, d, a,  4, 20, UINT32_C(0xE7D3FBC8))
	ROUND1(a, b, c, d,  9,  5, UINT32_C(0x21E1CDE6))
	ROUND1(d, a, b, c, 14,  9, UINT32_C(0xC33707D6))
	ROUND1(c, d, a, b,  3, 14, UINT32_C(0xF4D50D87))
	ROUND1(b, c, d, a,  8, 20, UINT32_C(0x455A14ED))
	ROUND1(a, b, c, d, 13,  5, UINT32_C(0xA9E3E905))
	ROUND1(d, a, b, c,  2,  9, UINT32_C(0xFCEFA3F8))
	ROUND1(c, d, a, b,  7, 14, UINT32_C(0x676F02D9))
	ROUND1(b, c, d, a, 12, 20, UINT32_C(0x8D2A4C8A))
	ROUND2(a, b, c, d,  5,  4, UINT32_C(0xFFFA3942))
	ROUND2(d, a, b, c,  8, 11, UINT32_C(0x8771F681))
	ROUND2(c, d, a, b, 11, 16, UINT32_C(0x6D9D6122))
	ROUND2(b, c, d, a, 14, 23, UINT32_C(0xFDE5380C))
	ROUND2(a, b, c, d,  1,  4, UINT32_C(0xA4BEEA44))
	ROUND2(d, a, b, c,  4, 11, UINT32_C(0x4BDECFA9))
	ROUND2(c, d, a, b,  7, 16, UINT32_C(0xF6BB4B60))
	ROUND2(b, c, d, a, 10, 23, UINT32_C(0xBEBFBC70))
	ROUND2(a, b, c, d, 13,  4, UINT32_C(0x289B7EC6))
	ROUND2(d, a, b, c,  0, 11, UINT32_C(0xEAA127FA))
	ROUND2(c, d, a, b,  3, 16, UINT32_C(0xD4EF3085))
	ROUND2(b, c, d, a,  6, 23, UINT32_C(0x04881D05))
	ROUND2(a, b, c, d,  9,  4, UINT32_C(0xD9D4D039))
	ROUND2(d, a, b, c, 12, 11, UINT32_C(0xE6DB99E5))
	ROUND2(c, d, a, b, 15, 16, UINT32_C(0x1FA27CF8))
	ROUND2(b, c, d, a,  2, 23, UINT32_C(0xC4AC5665))
	ROUND3(a, b, c, d,  0,  6, UINT32_C(0xF4292244))
	ROUND3(d, a, b, c,  7, 10, UINT32_C(0x432AFF97))
	ROUND3(c, d, a, b, 14, 15, UINT32_C(0xAB9423A7))
	ROUND3(b, c, d, a,  5, 21, UINT32_C(0xFC93A039))
	ROUND3(a, b, c, d, 12,  6, UINT32_C(0x655B59C3))
	ROUND3(d, a, b, c,  3, 10, UINT32_C(0x8F0CCC92))
	ROUND3(c, d, a, b, 10, 15, UINT32_C(0xFFEFF47D))
	ROUND3(b, c, d, a,  1, 21, UINT32_C(0x85845DD1))
	ROUND3(a, b, c, d,  8,  6, UINT32_C(0x6FA87E4F))
	ROUND3(d, a, b, c, 15, 10, UINT32_C(0xFE2CE6E0))
	ROUND3(c, d, a, b,  6, 15, UINT32_C(0xA3014314))
	ROUND3(b, c, d, a, 13, 21, UINT32_C(0x4E0811A1))
	ROUND3(a, b, c, d,  4,  6, UINT32_C(0xF7537E82))
	ROUND3(d, a, b, c, 11, 10, UINT32_C(0xBD3AF235))
	ROUND3(c, d, a, b,  2, 15, UINT32_C(0x2AD7D2BB))
	ROUND3(b, c, d, a,  9, 21, UINT32_C(0xEB86D391))
	
	state[0] += a;
	state[1] += b;
	state[2] += c;
	state[3] += d;
}
