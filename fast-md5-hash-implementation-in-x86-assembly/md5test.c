/*
 * MD5 hash in C and x86 assembly
 * Copyright (c) 2012 Nayuki Minase
 */


#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>


int self_check();
void md5_hash(uint8_t *message, uint32_t len, uint32_t *hash);
void md5_compress_x86(uint32_t *state, uint32_t *block);
void md5_compress_c(uint32_t *state, uint32_t *block);


int main(int argc, char **argv) {
	if (!self_check()) {
		printf("Self-check failed\n");
		return 1;
	}
	printf("Self-check passed\n");
	
	// Benchmark speed
	uint32_t state[4];
	uint32_t block[16];
	const int N = 10000000;
	clock_t start_time = clock();
	int i;
	for (i = 0; i < N; i++)
		md5_compress_x86(state, block);
	printf("Speed: %.1f MiB/s\n", (double)N * 64 / (clock() - start_time) * CLOCKS_PER_SEC / 1048576);
	
	return 0;
}


int self_check() {
	uint32_t hash[4];
	
	md5_hash((uint8_t*)"", 0, hash);
	if (hash[0]!=0xD98C1DD4||hash[1]!=0x04B2008F||hash[2]!=0x980980E9||hash[3]!=0x7E42F8EC) return 0;
	
	md5_hash((uint8_t*)"a", 1, hash);
	if (hash[0]!=0xB975C10C||hash[1]!=0xA8B6F1C0||hash[2]!=0xE299C331||hash[3]!=0x61267769) return 0;
	
	md5_hash((uint8_t*)"abc", 3, hash);
	if (hash[0]!=0x98500190||hash[1]!=0xB04FD23C||hash[2]!=0x7D3F96D6||hash[3]!=0x727FE128) return 0;
	
	md5_hash((uint8_t*)"message digest", 14, hash);
	if (hash[0]!=0x7D696BF9||hash[1]!=0x8D93B77C||hash[2]!=0x312F5A52||hash[3]!=0xD061F1AA) return 0;
	
	md5_hash((uint8_t*)"abcdefghijklmnopqrstuvwxyz", 26, hash);
	if (hash[0]!=0xD7D3FCC3||hash[1]!=0x00E49261||hash[2]!=0x6C49FB7D||hash[3]!=0x3BE167CA) return 0;
	
	md5_hash((uint8_t*)"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", 62, hash);
	if (hash[0]!=0x98AB74D1||hash[1]!=0xF5D977D2||hash[2]!=0x2C1C61A5||hash[3]!=0x9F9D419F) return 0;
	
	md5_hash((uint8_t*)"12345678901234567890123456789012345678901234567890123456789012345678901234567890", 80, hash);
	if (hash[0]!=0xA2F4ED57||hash[1]!=0x55C9E32B||hash[2]!=0x2EDA49AC||hash[3]!=0x7AB60721) return 0;
	
	return 1;
}


void md5_hash(uint8_t *message, uint32_t len, uint32_t *hash) {
	hash[0] = 0x67452301;
	hash[1] = 0xEFCDAB89;
	hash[2] = 0x98BADCFE;
	hash[3] = 0x10325476;
	
	int i;
	for (i = 0; i + 64 <= len; i += 64)
		md5_compress_x86(hash, (uint32_t*)(message + i));
	
	uint32_t block[16];
	uint8_t *byteBlock = (uint8_t*)block;
	
	int rem = len - i;
	memcpy(byteBlock, message + i, rem);
	
	byteBlock[rem] = 0x80;
	if (64 - (rem + 1) >= 8)
		memset(&byteBlock[rem + 1], 0, 64 - rem - 9);
	else {
		memset(&byteBlock[rem + 1], 0, 64 - rem - 1);
		md5_compress_x86(hash, block);
		memset(block, 0, 56);
	}
	block[14] = len << 3;
	block[15] = len >> 29;
	md5_compress_x86(hash, block);
}


#define ROUND0(a,b,c,d,k,s,t)  ROUND_TAIL(a, b, d ^ (b & (c ^ d)), k, s, t)
#define ROUND1(a,b,c,d,k,s,t)  ROUND_TAIL(a, b, c ^ (d & (b ^ c)), k, s, t)
#define ROUND2(a,b,c,d,k,s,t)  ROUND_TAIL(a, b, b ^ c ^ d        , k, s, t)
#define ROUND3(a,b,c,d,k,s,t)  ROUND_TAIL(a, b, c ^ (b | ~d)     , k, s, t)

#define ROUND_TAIL(a, b, expr, k, s, t)  \
	a += (expr) + t + block[k];  \
	a = b + (a << s | a >> (32 - s));

void md5_compress_c(uint32_t *state, uint32_t *block) {
	uint32_t a = state[0];
	uint32_t b = state[1];
	uint32_t c = state[2];
	uint32_t d = state[3];
	
	ROUND0(a, b, c, d,  0,  7, 0xD76AA478)
	ROUND0(d, a, b, c,  1, 12, 0xE8C7B756)
	ROUND0(c, d, a, b,  2, 17, 0x242070DB)
	ROUND0(b, c, d, a,  3, 22, 0xC1BDCEEE)
	ROUND0(a, b, c, d,  4,  7, 0xF57C0FAF)
	ROUND0(d, a, b, c,  5, 12, 0x4787C62A)
	ROUND0(c, d, a, b,  6, 17, 0xA8304613)
	ROUND0(b, c, d, a,  7, 22, 0xFD469501)
	ROUND0(a, b, c, d,  8,  7, 0x698098D8)
	ROUND0(d, a, b, c,  9, 12, 0x8B44F7AF)
	ROUND0(c, d, a, b, 10, 17, 0xFFFF5BB1)
	ROUND0(b, c, d, a, 11, 22, 0x895CD7BE)
	ROUND0(a, b, c, d, 12,  7, 0x6B901122)
	ROUND0(d, a, b, c, 13, 12, 0xFD987193)
	ROUND0(c, d, a, b, 14, 17, 0xA679438E)
	ROUND0(b, c, d, a, 15, 22, 0x49B40821)
	ROUND1(a, b, c, d,  1,  5, 0xF61E2562)
	ROUND1(d, a, b, c,  6,  9, 0xC040B340)
	ROUND1(c, d, a, b, 11, 14, 0x265E5A51)
	ROUND1(b, c, d, a,  0, 20, 0xE9B6C7AA)
	ROUND1(a, b, c, d,  5,  5, 0xD62F105D)
	ROUND1(d, a, b, c, 10,  9, 0x02441453)
	ROUND1(c, d, a, b, 15, 14, 0xD8A1E681)
	ROUND1(b, c, d, a,  4, 20, 0xE7D3FBC8)
	ROUND1(a, b, c, d,  9,  5, 0x21E1CDE6)
	ROUND1(d, a, b, c, 14,  9, 0xC33707D6)
	ROUND1(c, d, a, b,  3, 14, 0xF4D50D87)
	ROUND1(b, c, d, a,  8, 20, 0x455A14ED)
	ROUND1(a, b, c, d, 13,  5, 0xA9E3E905)
	ROUND1(d, a, b, c,  2,  9, 0xFCEFA3F8)
	ROUND1(c, d, a, b,  7, 14, 0x676F02D9)
	ROUND1(b, c, d, a, 12, 20, 0x8D2A4C8A)
	ROUND2(a, b, c, d,  5,  4, 0xFFFA3942)
	ROUND2(d, a, b, c,  8, 11, 0x8771F681)
	ROUND2(c, d, a, b, 11, 16, 0x6D9D6122)
	ROUND2(b, c, d, a, 14, 23, 0xFDE5380C)
	ROUND2(a, b, c, d,  1,  4, 0xA4BEEA44)
	ROUND2(d, a, b, c,  4, 11, 0x4BDECFA9)
	ROUND2(c, d, a, b,  7, 16, 0xF6BB4B60)
	ROUND2(b, c, d, a, 10, 23, 0xBEBFBC70)
	ROUND2(a, b, c, d, 13,  4, 0x289B7EC6)
	ROUND2(d, a, b, c,  0, 11, 0xEAA127FA)
	ROUND2(c, d, a, b,  3, 16, 0xD4EF3085)
	ROUND2(b, c, d, a,  6, 23, 0x04881D05)
	ROUND2(a, b, c, d,  9,  4, 0xD9D4D039)
	ROUND2(d, a, b, c, 12, 11, 0xE6DB99E5)
	ROUND2(c, d, a, b, 15, 16, 0x1FA27CF8)
	ROUND2(b, c, d, a,  2, 23, 0xC4AC5665)
	ROUND3(a, b, c, d,  0,  6, 0xF4292244)
	ROUND3(d, a, b, c,  7, 10, 0x432AFF97)
	ROUND3(c, d, a, b, 14, 15, 0xAB9423A7)
	ROUND3(b, c, d, a,  5, 21, 0xFC93A039)
	ROUND3(a, b, c, d, 12,  6, 0x655B59C3)
	ROUND3(d, a, b, c,  3, 10, 0x8F0CCC92)
	ROUND3(c, d, a, b, 10, 15, 0xFFEFF47D)
	ROUND3(b, c, d, a,  1, 21, 0x85845DD1)
	ROUND3(a, b, c, d,  8,  6, 0x6FA87E4F)
	ROUND3(d, a, b, c, 15, 10, 0xFE2CE6E0)
	ROUND3(c, d, a, b,  6, 15, 0xA3014314)
	ROUND3(b, c, d, a, 13, 21, 0x4E0811A1)
	ROUND3(a, b, c, d,  4,  6, 0xF7537E82)
	ROUND3(d, a, b, c, 11, 10, 0xBD3AF235)
	ROUND3(c, d, a, b,  2, 15, 0x2AD7D2BB)
	ROUND3(b, c, d, a,  9, 21, 0xEB86D391)
	
	state[0] += a;
	state[1] += b;
	state[2] += c;
	state[3] += d;
}
