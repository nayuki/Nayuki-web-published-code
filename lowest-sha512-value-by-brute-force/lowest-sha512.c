/* 
 * Lowest SHA-512 value by brute force (C)
 * 
 * Copyright (c) 2017 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/lowest-sha512-value-by-brute-force
 */

#include <inttypes.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>


/* Function prototypes */

static int self_check(void);
static void benchmark(void);
static int compare_hashes(const uint64_t hash0[8], const uint64_t hash1[8]);
static void sha512_compress(uint64_t state[8], const uint8_t block[128]);

// The message length can be anywhere from 1 to 111 (so that the message plus footer fits in a block).
// For an alphabet of lowercase letters, 16 characters already provides about 2^75 possibilities to explore, which is much more than enough.
#define MSG_LEN 16

#define ITERS_PER_PRINT 3000000

static const uint64_t initial_state[8] = {
	UINT64_C(0x6A09E667F3BCC908),
	UINT64_C(0xBB67AE8584CAA73B),
	UINT64_C(0x3C6EF372FE94F82B),
	UINT64_C(0xA54FF53A5F1D36F1),
	UINT64_C(0x510E527FADE682D1),
	UINT64_C(0x9B05688C2B3E6C1F),
	UINT64_C(0x1F83D9ABFB41BD6B),
	UINT64_C(0x5BE0CD19137E2179),
};


/* Main program */

int main(void) {
	// Sanity test
	if (!self_check()) {
		fprintf(stderr, "Self-check failed\n");
		return EXIT_FAILURE;
	}
	benchmark();
	
	// Set up the SHA-512 processed block: Message (28 bytes), terminator and padding (96 bytes), length (16 bytes)
	uint8_t block[128] = {0};
	{
		struct timespec ts;
		clock_gettime(CLOCK_REALTIME, &ts);
		uint64_t temp = ts.tv_sec * UINT64_C(1000000000) + ts.tv_nsec;
		int i;
		for (i = 0; i < MSG_LEN; i++, temp /= 26)
			block[i] = 'a' + temp % 26;
		block[MSG_LEN] = 0x80;
		block[126] = (uint8_t)(MSG_LEN >> 5);
		block[127] = (uint8_t)(MSG_LEN << 3);
	}
	
	// Initialize initial lowest hash
	uint64_t lowesthash[8];
	memset(lowesthash, 0xFF, sizeof(lowesthash));
	lowesthash[0] >>= 24;  // Exclude trivial matches
	
	// State variables
	uint64_t totaliters = 0;
	int prevprinttype = 0;  // 0 = hash, 1 = status
	
	int i;
	for (i = 0; ; i++) {
		if (i >= ITERS_PER_PRINT) {
			totaliters += i;
			i = 0;
			char message[MSG_LEN + 1] = {0};
			memcpy(message, block, MSG_LEN);
			fprintf(stderr, "\rHash trials: %.3f billion (%s)", totaliters / 1000000000.0, message);
			fflush(stderr);
			prevprinttype = 1;
		}
		
		// Do hashing
		uint64_t hash[8];
		memcpy(hash, initial_state, sizeof(hash));
		sha512_compress(hash, block);
		
		// Compare with lowest hash
		if (hash[0] <= lowesthash[0] && compare_hashes(hash, lowesthash) < 0) {
			char message[MSG_LEN + 1] = {0};
			memcpy(message, block, MSG_LEN);
			fprintf(stdout, "%016" PRIx64 "%016" PRIx64 "%016" PRIx64 "%016" PRIx64 "%016" PRIx64 "%016" PRIx64 "%016" PRIx64 "%016" PRIx64 " %s\n",
					hash[0], hash[1], hash[2], hash[3], hash[4], hash[5], hash[6], hash[7], message);
			if (prevprinttype == 1)
				fprintf(stderr, "    ");
			fprintf(stderr, "%016" PRIx64 "%016" PRIx64 "... %s\n", hash[0], hash[1], message);
			fflush(stdout);
			fflush(stderr);
			int j;
			for (j = 0; j < 8; j++)
				lowesthash[j] = hash[j];
			prevprinttype = 0;
		}
		
		// Increment messages
		int j;
		for (j = MSG_LEN - 1; j >= 0 && block[j] >= 'z'; j--)
			block[j] = 'a';
		if (j < 0)
			break;
		block[j]++;
	}
	
	fprintf(stderr, "\nSearch space exhausted\n");
	return EXIT_SUCCESS;
}


static int self_check(void) {
	uint8_t block[128] = {'m','e','s','s','a','g','e',' ','d','i','g','e','s','t',0x80};
	block[127] = 112;
	uint64_t state[8];
	memcpy(state, initial_state, sizeof(state));
	sha512_compress(state, block);
	
	uint64_t answer[8] = {
		UINT64_C(0x107DBF389D9E9F71),
		UINT64_C(0xA3A95F6C055B9251),
		UINT64_C(0xBC5268C2BE16D6C1),
		UINT64_C(0x3492EA45B0199F33),
		UINT64_C(0x09E16455AB1E9611),
		UINT64_C(0x8E8A905D5597B720),
		UINT64_C(0x38DDB372A8982604),
		UINT64_C(0x6DE66687BB420E7C),
	};
	return memcmp(state, answer, sizeof(answer)) == 0;
}


static void benchmark(void) {
	const int N = 3000000;
	uint8_t block[128] = {0};
	uint64_t state[8] = {0};
	clock_t start_time = clock();
	int i;
	for (i = 0; i < N; i++)
		sha512_compress(state, block);
	fprintf(stderr, "Speed: %.3f million iterations per second\n", (double)N / (clock() - start_time) * CLOCKS_PER_SEC / 1000000);
}


static int compare_hashes(const uint64_t hash0[8], const uint64_t hash1[8]) {
	int i;
	for (i = 0; i < 8; i++) {
		uint64_t x = hash0[i];
		uint64_t y = hash1[i];
		if (x < y)
			return -1;
		else if (x > y)
			return 1;
	}
	return 0;
}


/* SHA-512 compression function */

static void sha512_compress(uint64_t state[8], const uint8_t block[128]) {
	// 64-bit right rotation
	#define ROR(x, i)  \
		(((x) << (64 - (i))) | ((x) >> (i)))
	
	#define LOADSCHEDULE(i)  \
		schedule[i] = (uint64_t)block[i * 8 + 0] << 56  \
		            | (uint64_t)block[i * 8 + 1] << 48  \
		            | (uint64_t)block[i * 8 + 2] << 40  \
		            | (uint64_t)block[i * 8 + 3] << 32  \
		            | (uint64_t)block[i * 8 + 4] << 24  \
		            | (uint64_t)block[i * 8 + 5] << 16  \
		            | (uint64_t)block[i * 8 + 6] <<  8  \
		            | (uint64_t)block[i * 8 + 7];
	
	#define SCHEDULE(i)  \
		schedule[i] = schedule[i - 16] + schedule[i - 7]  \
			+ (ROR(schedule[i - 15], 1) ^ ROR(schedule[i - 15], 8) ^ (schedule[i - 15] >> 7))  \
			+ (ROR(schedule[i - 2], 19) ^ ROR(schedule[i - 2], 61) ^ (schedule[i - 2] >> 6));
	
	#define ROUND(a, b, c, d, e, f, g, h, i, k) \
		h += (ROR(e, 14) ^ ROR(e, 18) ^ ROR(e, 41)) + (g ^ (e & (f ^ g))) + UINT64_C(k) + schedule[i];  \
		d += h;  \
		h += (ROR(a, 28) ^ ROR(a, 34) ^ ROR(a, 39)) + ((a & (b | c)) | (b & c));
	
	uint64_t schedule[80];
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
	
	uint64_t a = state[0];
	uint64_t b = state[1];
	uint64_t c = state[2];
	uint64_t d = state[3];
	uint64_t e = state[4];
	uint64_t f = state[5];
	uint64_t g = state[6];
	uint64_t h = state[7];
	ROUND(a, b, c, d, e, f, g, h,  0, 0x428A2F98D728AE22)
	ROUND(h, a, b, c, d, e, f, g,  1, 0x7137449123EF65CD)
	ROUND(g, h, a, b, c, d, e, f,  2, 0xB5C0FBCFEC4D3B2F)
	ROUND(f, g, h, a, b, c, d, e,  3, 0xE9B5DBA58189DBBC)
	ROUND(e, f, g, h, a, b, c, d,  4, 0x3956C25BF348B538)
	ROUND(d, e, f, g, h, a, b, c,  5, 0x59F111F1B605D019)
	ROUND(c, d, e, f, g, h, a, b,  6, 0x923F82A4AF194F9B)
	ROUND(b, c, d, e, f, g, h, a,  7, 0xAB1C5ED5DA6D8118)
	ROUND(a, b, c, d, e, f, g, h,  8, 0xD807AA98A3030242)
	ROUND(h, a, b, c, d, e, f, g,  9, 0x12835B0145706FBE)
	ROUND(g, h, a, b, c, d, e, f, 10, 0x243185BE4EE4B28C)
	ROUND(f, g, h, a, b, c, d, e, 11, 0x550C7DC3D5FFB4E2)
	ROUND(e, f, g, h, a, b, c, d, 12, 0x72BE5D74F27B896F)
	ROUND(d, e, f, g, h, a, b, c, 13, 0x80DEB1FE3B1696B1)
	ROUND(c, d, e, f, g, h, a, b, 14, 0x9BDC06A725C71235)
	ROUND(b, c, d, e, f, g, h, a, 15, 0xC19BF174CF692694)
	ROUND(a, b, c, d, e, f, g, h, 16, 0xE49B69C19EF14AD2)
	ROUND(h, a, b, c, d, e, f, g, 17, 0xEFBE4786384F25E3)
	ROUND(g, h, a, b, c, d, e, f, 18, 0x0FC19DC68B8CD5B5)
	ROUND(f, g, h, a, b, c, d, e, 19, 0x240CA1CC77AC9C65)
	ROUND(e, f, g, h, a, b, c, d, 20, 0x2DE92C6F592B0275)
	ROUND(d, e, f, g, h, a, b, c, 21, 0x4A7484AA6EA6E483)
	ROUND(c, d, e, f, g, h, a, b, 22, 0x5CB0A9DCBD41FBD4)
	ROUND(b, c, d, e, f, g, h, a, 23, 0x76F988DA831153B5)
	ROUND(a, b, c, d, e, f, g, h, 24, 0x983E5152EE66DFAB)
	ROUND(h, a, b, c, d, e, f, g, 25, 0xA831C66D2DB43210)
	ROUND(g, h, a, b, c, d, e, f, 26, 0xB00327C898FB213F)
	ROUND(f, g, h, a, b, c, d, e, 27, 0xBF597FC7BEEF0EE4)
	ROUND(e, f, g, h, a, b, c, d, 28, 0xC6E00BF33DA88FC2)
	ROUND(d, e, f, g, h, a, b, c, 29, 0xD5A79147930AA725)
	ROUND(c, d, e, f, g, h, a, b, 30, 0x06CA6351E003826F)
	ROUND(b, c, d, e, f, g, h, a, 31, 0x142929670A0E6E70)
	ROUND(a, b, c, d, e, f, g, h, 32, 0x27B70A8546D22FFC)
	ROUND(h, a, b, c, d, e, f, g, 33, 0x2E1B21385C26C926)
	ROUND(g, h, a, b, c, d, e, f, 34, 0x4D2C6DFC5AC42AED)
	ROUND(f, g, h, a, b, c, d, e, 35, 0x53380D139D95B3DF)
	ROUND(e, f, g, h, a, b, c, d, 36, 0x650A73548BAF63DE)
	ROUND(d, e, f, g, h, a, b, c, 37, 0x766A0ABB3C77B2A8)
	ROUND(c, d, e, f, g, h, a, b, 38, 0x81C2C92E47EDAEE6)
	ROUND(b, c, d, e, f, g, h, a, 39, 0x92722C851482353B)
	ROUND(a, b, c, d, e, f, g, h, 40, 0xA2BFE8A14CF10364)
	ROUND(h, a, b, c, d, e, f, g, 41, 0xA81A664BBC423001)
	ROUND(g, h, a, b, c, d, e, f, 42, 0xC24B8B70D0F89791)
	ROUND(f, g, h, a, b, c, d, e, 43, 0xC76C51A30654BE30)
	ROUND(e, f, g, h, a, b, c, d, 44, 0xD192E819D6EF5218)
	ROUND(d, e, f, g, h, a, b, c, 45, 0xD69906245565A910)
	ROUND(c, d, e, f, g, h, a, b, 46, 0xF40E35855771202A)
	ROUND(b, c, d, e, f, g, h, a, 47, 0x106AA07032BBD1B8)
	ROUND(a, b, c, d, e, f, g, h, 48, 0x19A4C116B8D2D0C8)
	ROUND(h, a, b, c, d, e, f, g, 49, 0x1E376C085141AB53)
	ROUND(g, h, a, b, c, d, e, f, 50, 0x2748774CDF8EEB99)
	ROUND(f, g, h, a, b, c, d, e, 51, 0x34B0BCB5E19B48A8)
	ROUND(e, f, g, h, a, b, c, d, 52, 0x391C0CB3C5C95A63)
	ROUND(d, e, f, g, h, a, b, c, 53, 0x4ED8AA4AE3418ACB)
	ROUND(c, d, e, f, g, h, a, b, 54, 0x5B9CCA4F7763E373)
	ROUND(b, c, d, e, f, g, h, a, 55, 0x682E6FF3D6B2B8A3)
	ROUND(a, b, c, d, e, f, g, h, 56, 0x748F82EE5DEFB2FC)
	ROUND(h, a, b, c, d, e, f, g, 57, 0x78A5636F43172F60)
	ROUND(g, h, a, b, c, d, e, f, 58, 0x84C87814A1F0AB72)
	ROUND(f, g, h, a, b, c, d, e, 59, 0x8CC702081A6439EC)
	ROUND(e, f, g, h, a, b, c, d, 60, 0x90BEFFFA23631E28)
	ROUND(d, e, f, g, h, a, b, c, 61, 0xA4506CEBDE82BDE9)
	ROUND(c, d, e, f, g, h, a, b, 62, 0xBEF9A3F7B2C67915)
	ROUND(b, c, d, e, f, g, h, a, 63, 0xC67178F2E372532B)
	ROUND(a, b, c, d, e, f, g, h, 64, 0xCA273ECEEA26619C)
	ROUND(h, a, b, c, d, e, f, g, 65, 0xD186B8C721C0C207)
	ROUND(g, h, a, b, c, d, e, f, 66, 0xEADA7DD6CDE0EB1E)
	ROUND(f, g, h, a, b, c, d, e, 67, 0xF57D4F7FEE6ED178)
	ROUND(e, f, g, h, a, b, c, d, 68, 0x06F067AA72176FBA)
	ROUND(d, e, f, g, h, a, b, c, 69, 0x0A637DC5A2C898A6)
	ROUND(c, d, e, f, g, h, a, b, 70, 0x113F9804BEF90DAE)
	ROUND(b, c, d, e, f, g, h, a, 71, 0x1B710B35131C471B)
	ROUND(a, b, c, d, e, f, g, h, 72, 0x28DB77F523047D84)
	ROUND(h, a, b, c, d, e, f, g, 73, 0x32CAAB7B40C72493)
	ROUND(g, h, a, b, c, d, e, f, 74, 0x3C9EBE0A15C9BEBC)
	ROUND(f, g, h, a, b, c, d, e, 75, 0x431D67C49C100D4C)
	ROUND(e, f, g, h, a, b, c, d, 76, 0x4CC5D4BECB3E42B6)
	ROUND(d, e, f, g, h, a, b, c, 77, 0x597F299CFC657E2A)
	ROUND(c, d, e, f, g, h, a, b, 78, 0x5FCB6FAB3AD6FAEC)
	ROUND(b, c, d, e, f, g, h, a, 79, 0x6C44198C4A475817)
	state[0] += a;
	state[1] += b;
	state[2] += c;
	state[3] += d;
	state[4] += e;
	state[5] += f;
	state[6] += g;
	state[7] += h;
}
