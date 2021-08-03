/* 
 * Whirlpool hash in C
 * 
 * Copyright (c) 2021 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/fast-whirlpool-hash-in-x86-assembly
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

#include <stdint.h>
#include <string.h>


static void whirlpool_round(uint8_t block[restrict static 64], const uint8_t key[restrict static 64]);


// S-box for gamma (SubBytes) and round constants
static uint8_t SBOX[256] = {
	0x18, 0x23, 0xC6, 0xE8, 0x87, 0xB8, 0x01, 0x4F, 0x36, 0xA6, 0xD2, 0xF5, 0x79, 0x6F, 0x91, 0x52,
	0x60, 0xBC, 0x9B, 0x8E, 0xA3, 0x0C, 0x7B, 0x35, 0x1D, 0xE0, 0xD7, 0xC2, 0x2E, 0x4B, 0xFE, 0x57,
	0x15, 0x77, 0x37, 0xE5, 0x9F, 0xF0, 0x4A, 0xDA, 0x58, 0xC9, 0x29, 0x0A, 0xB1, 0xA0, 0x6B, 0x85,
	0xBD, 0x5D, 0x10, 0xF4, 0xCB, 0x3E, 0x05, 0x67, 0xE4, 0x27, 0x41, 0x8B, 0xA7, 0x7D, 0x95, 0xD8,
	0xFB, 0xEE, 0x7C, 0x66, 0xDD, 0x17, 0x47, 0x9E, 0xCA, 0x2D, 0xBF, 0x07, 0xAD, 0x5A, 0x83, 0x33,
	0x63, 0x02, 0xAA, 0x71, 0xC8, 0x19, 0x49, 0xD9, 0xF2, 0xE3, 0x5B, 0x88, 0x9A, 0x26, 0x32, 0xB0,
	0xE9, 0x0F, 0xD5, 0x80, 0xBE, 0xCD, 0x34, 0x48, 0xFF, 0x7A, 0x90, 0x5F, 0x20, 0x68, 0x1A, 0xAE,
	0xB4, 0x54, 0x93, 0x22, 0x64, 0xF1, 0x73, 0x12, 0x40, 0x08, 0xC3, 0xEC, 0xDB, 0xA1, 0x8D, 0x3D,
	0x97, 0x00, 0xCF, 0x2B, 0x76, 0x82, 0xD6, 0x1B, 0xB5, 0xAF, 0x6A, 0x50, 0x45, 0xF3, 0x30, 0xEF,
	0x3F, 0x55, 0xA2, 0xEA, 0x65, 0xBA, 0x2F, 0xC0, 0xDE, 0x1C, 0xFD, 0x4D, 0x92, 0x75, 0x06, 0x8A,
	0xB2, 0xE6, 0x0E, 0x1F, 0x62, 0xD4, 0xA8, 0x96, 0xF9, 0xC5, 0x25, 0x59, 0x84, 0x72, 0x39, 0x4C,
	0x5E, 0x78, 0x38, 0x8C, 0xD1, 0xA5, 0xE2, 0x61, 0xB3, 0x21, 0x9C, 0x1E, 0x43, 0xC7, 0xFC, 0x04,
	0x51, 0x99, 0x6D, 0x0D, 0xFA, 0xDF, 0x7E, 0x24, 0x3B, 0xAB, 0xCE, 0x11, 0x8F, 0x4E, 0xB7, 0xEB,
	0x3C, 0x81, 0x94, 0xF7, 0xB9, 0x13, 0x2C, 0xD3, 0xE7, 0x6E, 0xC4, 0x03, 0x56, 0x44, 0x7F, 0xA9,
	0x2A, 0xBB, 0xC1, 0x53, 0xDC, 0x0B, 0x9D, 0x6C, 0x31, 0x74, 0xF6, 0x46, 0xAC, 0x89, 0x14, 0xE1,
	0x16, 0x3A, 0x69, 0x09, 0x70, 0xB6, 0xD0, 0xED, 0xCC, 0x42, 0x98, 0xA4, 0x28, 0x5C, 0xF8, 0x86,
};


void whirlpool_compress(uint8_t state[restrict static 64], const uint8_t block[restrict static 64]) {
	const int NUM_ROUNDS = 10;  // Any number from 0 to 32 is allowed
	uint8_t tempState[64];
	uint8_t tempBlock[64];
	
	// Initialization
	memcpy(tempState, state, 64);
	for (int i = 0; i < 64; i++)
		tempBlock[i] = block[i] ^ state[i];
	
	// Hashing rounds
	uint8_t rcon[64];
	memset(rcon + 8, 0, 56);
	for (int i = 0; i < NUM_ROUNDS; i++) {
		for (int j = 0; j < 8; j++)
			rcon[j] = SBOX[(i << 3) | j];
		whirlpool_round(tempState, rcon);
		whirlpool_round(tempBlock, tempState);
	}
	
	// Final combining
	for (int i = 0; i < 64; i++)
		state[i] ^= block[i] ^ tempBlock[i];
}


// Multiplication table for theta (MixRows)
static uint8_t MULTIPLY[8][256] = {
	{0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0A,0x0B,0x0C,0x0D,0x0E,0x0F,0x10,0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,0x1A,0x1B,0x1C,0x1D,0x1E,0x1F,0x20,0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2A,0x2B,0x2C,0x2D,0x2E,0x2F,0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3A,0x3B,0x3C,0x3D,0x3E,0x3F,0x40,0x41,0x42,0x43,0x44,0x45,0x46,0x47,0x48,0x49,0x4A,0x4B,0x4C,0x4D,0x4E,0x4F,0x50,0x51,0x52,0x53,0x54,0x55,0x56,0x57,0x58,0x59,0x5A,0x5B,0x5C,0x5D,0x5E,0x5F,0x60,0x61,0x62,0x63,0x64,0x65,0x66,0x67,0x68,0x69,0x6A,0x6B,0x6C,0x6D,0x6E,0x6F,0x70,0x71,0x72,0x73,0x74,0x75,0x76,0x77,0x78,0x79,0x7A,0x7B,0x7C,0x7D,0x7E,0x7F,0x80,0x81,0x82,0x83,0x84,0x85,0x86,0x87,0x88,0x89,0x8A,0x8B,0x8C,0x8D,0x8E,0x8F,0x90,0x91,0x92,0x93,0x94,0x95,0x96,0x97,0x98,0x99,0x9A,0x9B,0x9C,0x9D,0x9E,0x9F,0xA0,0xA1,0xA2,0xA3,0xA4,0xA5,0xA6,0xA7,0xA8,0xA9,0xAA,0xAB,0xAC,0xAD,0xAE,0xAF,0xB0,0xB1,0xB2,0xB3,0xB4,0xB5,0xB6,0xB7,0xB8,0xB9,0xBA,0xBB,0xBC,0xBD,0xBE,0xBF,0xC0,0xC1,0xC2,0xC3,0xC4,0xC5,0xC6,0xC7,0xC8,0xC9,0xCA,0xCB,0xCC,0xCD,0xCE,0xCF,0xD0,0xD1,0xD2,0xD3,0xD4,0xD5,0xD6,0xD7,0xD8,0xD9,0xDA,0xDB,0xDC,0xDD,0xDE,0xDF,0xE0,0xE1,0xE2,0xE3,0xE4,0xE5,0xE6,0xE7,0xE8,0xE9,0xEA,0xEB,0xEC,0xED,0xEE,0xEF,0xF0,0xF1,0xF2,0xF3,0xF4,0xF5,0xF6,0xF7,0xF8,0xF9,0xFA,0xFB,0xFC,0xFD,0xFE,0xFF},
	{0x00,0x09,0x12,0x1B,0x24,0x2D,0x36,0x3F,0x48,0x41,0x5A,0x53,0x6C,0x65,0x7E,0x77,0x90,0x99,0x82,0x8B,0xB4,0xBD,0xA6,0xAF,0xD8,0xD1,0xCA,0xC3,0xFC,0xF5,0xEE,0xE7,0x3D,0x34,0x2F,0x26,0x19,0x10,0x0B,0x02,0x75,0x7C,0x67,0x6E,0x51,0x58,0x43,0x4A,0xAD,0xA4,0xBF,0xB6,0x89,0x80,0x9B,0x92,0xE5,0xEC,0xF7,0xFE,0xC1,0xC8,0xD3,0xDA,0x7A,0x73,0x68,0x61,0x5E,0x57,0x4C,0x45,0x32,0x3B,0x20,0x29,0x16,0x1F,0x04,0x0D,0xEA,0xE3,0xF8,0xF1,0xCE,0xC7,0xDC,0xD5,0xA2,0xAB,0xB0,0xB9,0x86,0x8F,0x94,0x9D,0x47,0x4E,0x55,0x5C,0x63,0x6A,0x71,0x78,0x0F,0x06,0x1D,0x14,0x2B,0x22,0x39,0x30,0xD7,0xDE,0xC5,0xCC,0xF3,0xFA,0xE1,0xE8,0x9F,0x96,0x8D,0x84,0xBB,0xB2,0xA9,0xA0,0xF4,0xFD,0xE6,0xEF,0xD0,0xD9,0xC2,0xCB,0xBC,0xB5,0xAE,0xA7,0x98,0x91,0x8A,0x83,0x64,0x6D,0x76,0x7F,0x40,0x49,0x52,0x5B,0x2C,0x25,0x3E,0x37,0x08,0x01,0x1A,0x13,0xC9,0xC0,0xDB,0xD2,0xED,0xE4,0xFF,0xF6,0x81,0x88,0x93,0x9A,0xA5,0xAC,0xB7,0xBE,0x59,0x50,0x4B,0x42,0x7D,0x74,0x6F,0x66,0x11,0x18,0x03,0x0A,0x35,0x3C,0x27,0x2E,0x8E,0x87,0x9C,0x95,0xAA,0xA3,0xB8,0xB1,0xC6,0xCF,0xD4,0xDD,0xE2,0xEB,0xF0,0xF9,0x1E,0x17,0x0C,0x05,0x3A,0x33,0x28,0x21,0x56,0x5F,0x44,0x4D,0x72,0x7B,0x60,0x69,0xB3,0xBA,0xA1,0xA8,0x97,0x9E,0x85,0x8C,0xFB,0xF2,0xE9,0xE0,0xDF,0xD6,0xCD,0xC4,0x23,0x2A,0x31,0x38,0x07,0x0E,0x15,0x1C,0x6B,0x62,0x79,0x70,0x4F,0x46,0x5D,0x54},
	{0x00,0x02,0x04,0x06,0x08,0x0A,0x0C,0x0E,0x10,0x12,0x14,0x16,0x18,0x1A,0x1C,0x1E,0x20,0x22,0x24,0x26,0x28,0x2A,0x2C,0x2E,0x30,0x32,0x34,0x36,0x38,0x3A,0x3C,0x3E,0x40,0x42,0x44,0x46,0x48,0x4A,0x4C,0x4E,0x50,0x52,0x54,0x56,0x58,0x5A,0x5C,0x5E,0x60,0x62,0x64,0x66,0x68,0x6A,0x6C,0x6E,0x70,0x72,0x74,0x76,0x78,0x7A,0x7C,0x7E,0x80,0x82,0x84,0x86,0x88,0x8A,0x8C,0x8E,0x90,0x92,0x94,0x96,0x98,0x9A,0x9C,0x9E,0xA0,0xA2,0xA4,0xA6,0xA8,0xAA,0xAC,0xAE,0xB0,0xB2,0xB4,0xB6,0xB8,0xBA,0xBC,0xBE,0xC0,0xC2,0xC4,0xC6,0xC8,0xCA,0xCC,0xCE,0xD0,0xD2,0xD4,0xD6,0xD8,0xDA,0xDC,0xDE,0xE0,0xE2,0xE4,0xE6,0xE8,0xEA,0xEC,0xEE,0xF0,0xF2,0xF4,0xF6,0xF8,0xFA,0xFC,0xFE,0x1D,0x1F,0x19,0x1B,0x15,0x17,0x11,0x13,0x0D,0x0F,0x09,0x0B,0x05,0x07,0x01,0x03,0x3D,0x3F,0x39,0x3B,0x35,0x37,0x31,0x33,0x2D,0x2F,0x29,0x2B,0x25,0x27,0x21,0x23,0x5D,0x5F,0x59,0x5B,0x55,0x57,0x51,0x53,0x4D,0x4F,0x49,0x4B,0x45,0x47,0x41,0x43,0x7D,0x7F,0x79,0x7B,0x75,0x77,0x71,0x73,0x6D,0x6F,0x69,0x6B,0x65,0x67,0x61,0x63,0x9D,0x9F,0x99,0x9B,0x95,0x97,0x91,0x93,0x8D,0x8F,0x89,0x8B,0x85,0x87,0x81,0x83,0xBD,0xBF,0xB9,0xBB,0xB5,0xB7,0xB1,0xB3,0xAD,0xAF,0xA9,0xAB,0xA5,0xA7,0xA1,0xA3,0xDD,0xDF,0xD9,0xDB,0xD5,0xD7,0xD1,0xD3,0xCD,0xCF,0xC9,0xCB,0xC5,0xC7,0xC1,0xC3,0xFD,0xFF,0xF9,0xFB,0xF5,0xF7,0xF1,0xF3,0xED,0xEF,0xE9,0xEB,0xE5,0xE7,0xE1,0xE3},
	{0x00,0x05,0x0A,0x0F,0x14,0x11,0x1E,0x1B,0x28,0x2D,0x22,0x27,0x3C,0x39,0x36,0x33,0x50,0x55,0x5A,0x5F,0x44,0x41,0x4E,0x4B,0x78,0x7D,0x72,0x77,0x6C,0x69,0x66,0x63,0xA0,0xA5,0xAA,0xAF,0xB4,0xB1,0xBE,0xBB,0x88,0x8D,0x82,0x87,0x9C,0x99,0x96,0x93,0xF0,0xF5,0xFA,0xFF,0xE4,0xE1,0xEE,0xEB,0xD8,0xDD,0xD2,0xD7,0xCC,0xC9,0xC6,0xC3,0x5D,0x58,0x57,0x52,0x49,0x4C,0x43,0x46,0x75,0x70,0x7F,0x7A,0x61,0x64,0x6B,0x6E,0x0D,0x08,0x07,0x02,0x19,0x1C,0x13,0x16,0x25,0x20,0x2F,0x2A,0x31,0x34,0x3B,0x3E,0xFD,0xF8,0xF7,0xF2,0xE9,0xEC,0xE3,0xE6,0xD5,0xD0,0xDF,0xDA,0xC1,0xC4,0xCB,0xCE,0xAD,0xA8,0xA7,0xA2,0xB9,0xBC,0xB3,0xB6,0x85,0x80,0x8F,0x8A,0x91,0x94,0x9B,0x9E,0xBA,0xBF,0xB0,0xB5,0xAE,0xAB,0xA4,0xA1,0x92,0x97,0x98,0x9D,0x86,0x83,0x8C,0x89,0xEA,0xEF,0xE0,0xE5,0xFE,0xFB,0xF4,0xF1,0xC2,0xC7,0xC8,0xCD,0xD6,0xD3,0xDC,0xD9,0x1A,0x1F,0x10,0x15,0x0E,0x0B,0x04,0x01,0x32,0x37,0x38,0x3D,0x26,0x23,0x2C,0x29,0x4A,0x4F,0x40,0x45,0x5E,0x5B,0x54,0x51,0x62,0x67,0x68,0x6D,0x76,0x73,0x7C,0x79,0xE7,0xE2,0xED,0xE8,0xF3,0xF6,0xF9,0xFC,0xCF,0xCA,0xC5,0xC0,0xDB,0xDE,0xD1,0xD4,0xB7,0xB2,0xBD,0xB8,0xA3,0xA6,0xA9,0xAC,0x9F,0x9A,0x95,0x90,0x8B,0x8E,0x81,0x84,0x47,0x42,0x4D,0x48,0x53,0x56,0x59,0x5C,0x6F,0x6A,0x65,0x60,0x7B,0x7E,0x71,0x74,0x17,0x12,0x1D,0x18,0x03,0x06,0x09,0x0C,0x3F,0x3A,0x35,0x30,0x2B,0x2E,0x21,0x24},
	{0x00,0x08,0x10,0x18,0x20,0x28,0x30,0x38,0x40,0x48,0x50,0x58,0x60,0x68,0x70,0x78,0x80,0x88,0x90,0x98,0xA0,0xA8,0xB0,0xB8,0xC0,0xC8,0xD0,0xD8,0xE0,0xE8,0xF0,0xF8,0x1D,0x15,0x0D,0x05,0x3D,0x35,0x2D,0x25,0x5D,0x55,0x4D,0x45,0x7D,0x75,0x6D,0x65,0x9D,0x95,0x8D,0x85,0xBD,0xB5,0xAD,0xA5,0xDD,0xD5,0xCD,0xC5,0xFD,0xF5,0xED,0xE5,0x3A,0x32,0x2A,0x22,0x1A,0x12,0x0A,0x02,0x7A,0x72,0x6A,0x62,0x5A,0x52,0x4A,0x42,0xBA,0xB2,0xAA,0xA2,0x9A,0x92,0x8A,0x82,0xFA,0xF2,0xEA,0xE2,0xDA,0xD2,0xCA,0xC2,0x27,0x2F,0x37,0x3F,0x07,0x0F,0x17,0x1F,0x67,0x6F,0x77,0x7F,0x47,0x4F,0x57,0x5F,0xA7,0xAF,0xB7,0xBF,0x87,0x8F,0x97,0x9F,0xE7,0xEF,0xF7,0xFF,0xC7,0xCF,0xD7,0xDF,0x74,0x7C,0x64,0x6C,0x54,0x5C,0x44,0x4C,0x34,0x3C,0x24,0x2C,0x14,0x1C,0x04,0x0C,0xF4,0xFC,0xE4,0xEC,0xD4,0xDC,0xC4,0xCC,0xB4,0xBC,0xA4,0xAC,0x94,0x9C,0x84,0x8C,0x69,0x61,0x79,0x71,0x49,0x41,0x59,0x51,0x29,0x21,0x39,0x31,0x09,0x01,0x19,0x11,0xE9,0xE1,0xF9,0xF1,0xC9,0xC1,0xD9,0xD1,0xA9,0xA1,0xB9,0xB1,0x89,0x81,0x99,0x91,0x4E,0x46,0x5E,0x56,0x6E,0x66,0x7E,0x76,0x0E,0x06,0x1E,0x16,0x2E,0x26,0x3E,0x36,0xCE,0xC6,0xDE,0xD6,0xEE,0xE6,0xFE,0xF6,0x8E,0x86,0x9E,0x96,0xAE,0xA6,0xBE,0xB6,0x53,0x5B,0x43,0x4B,0x73,0x7B,0x63,0x6B,0x13,0x1B,0x03,0x0B,0x33,0x3B,0x23,0x2B,0xD3,0xDB,0xC3,0xCB,0xF3,0xFB,0xE3,0xEB,0x93,0x9B,0x83,0x8B,0xB3,0xBB,0xA3,0xAB},
	{0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0A,0x0B,0x0C,0x0D,0x0E,0x0F,0x10,0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,0x1A,0x1B,0x1C,0x1D,0x1E,0x1F,0x20,0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2A,0x2B,0x2C,0x2D,0x2E,0x2F,0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3A,0x3B,0x3C,0x3D,0x3E,0x3F,0x40,0x41,0x42,0x43,0x44,0x45,0x46,0x47,0x48,0x49,0x4A,0x4B,0x4C,0x4D,0x4E,0x4F,0x50,0x51,0x52,0x53,0x54,0x55,0x56,0x57,0x58,0x59,0x5A,0x5B,0x5C,0x5D,0x5E,0x5F,0x60,0x61,0x62,0x63,0x64,0x65,0x66,0x67,0x68,0x69,0x6A,0x6B,0x6C,0x6D,0x6E,0x6F,0x70,0x71,0x72,0x73,0x74,0x75,0x76,0x77,0x78,0x79,0x7A,0x7B,0x7C,0x7D,0x7E,0x7F,0x80,0x81,0x82,0x83,0x84,0x85,0x86,0x87,0x88,0x89,0x8A,0x8B,0x8C,0x8D,0x8E,0x8F,0x90,0x91,0x92,0x93,0x94,0x95,0x96,0x97,0x98,0x99,0x9A,0x9B,0x9C,0x9D,0x9E,0x9F,0xA0,0xA1,0xA2,0xA3,0xA4,0xA5,0xA6,0xA7,0xA8,0xA9,0xAA,0xAB,0xAC,0xAD,0xAE,0xAF,0xB0,0xB1,0xB2,0xB3,0xB4,0xB5,0xB6,0xB7,0xB8,0xB9,0xBA,0xBB,0xBC,0xBD,0xBE,0xBF,0xC0,0xC1,0xC2,0xC3,0xC4,0xC5,0xC6,0xC7,0xC8,0xC9,0xCA,0xCB,0xCC,0xCD,0xCE,0xCF,0xD0,0xD1,0xD2,0xD3,0xD4,0xD5,0xD6,0xD7,0xD8,0xD9,0xDA,0xDB,0xDC,0xDD,0xDE,0xDF,0xE0,0xE1,0xE2,0xE3,0xE4,0xE5,0xE6,0xE7,0xE8,0xE9,0xEA,0xEB,0xEC,0xED,0xEE,0xEF,0xF0,0xF1,0xF2,0xF3,0xF4,0xF5,0xF6,0xF7,0xF8,0xF9,0xFA,0xFB,0xFC,0xFD,0xFE,0xFF},
	{0x00,0x04,0x08,0x0C,0x10,0x14,0x18,0x1C,0x20,0x24,0x28,0x2C,0x30,0x34,0x38,0x3C,0x40,0x44,0x48,0x4C,0x50,0x54,0x58,0x5C,0x60,0x64,0x68,0x6C,0x70,0x74,0x78,0x7C,0x80,0x84,0x88,0x8C,0x90,0x94,0x98,0x9C,0xA0,0xA4,0xA8,0xAC,0xB0,0xB4,0xB8,0xBC,0xC0,0xC4,0xC8,0xCC,0xD0,0xD4,0xD8,0xDC,0xE0,0xE4,0xE8,0xEC,0xF0,0xF4,0xF8,0xFC,0x1D,0x19,0x15,0x11,0x0D,0x09,0x05,0x01,0x3D,0x39,0x35,0x31,0x2D,0x29,0x25,0x21,0x5D,0x59,0x55,0x51,0x4D,0x49,0x45,0x41,0x7D,0x79,0x75,0x71,0x6D,0x69,0x65,0x61,0x9D,0x99,0x95,0x91,0x8D,0x89,0x85,0x81,0xBD,0xB9,0xB5,0xB1,0xAD,0xA9,0xA5,0xA1,0xDD,0xD9,0xD5,0xD1,0xCD,0xC9,0xC5,0xC1,0xFD,0xF9,0xF5,0xF1,0xED,0xE9,0xE5,0xE1,0x3A,0x3E,0x32,0x36,0x2A,0x2E,0x22,0x26,0x1A,0x1E,0x12,0x16,0x0A,0x0E,0x02,0x06,0x7A,0x7E,0x72,0x76,0x6A,0x6E,0x62,0x66,0x5A,0x5E,0x52,0x56,0x4A,0x4E,0x42,0x46,0xBA,0xBE,0xB2,0xB6,0xAA,0xAE,0xA2,0xA6,0x9A,0x9E,0x92,0x96,0x8A,0x8E,0x82,0x86,0xFA,0xFE,0xF2,0xF6,0xEA,0xEE,0xE2,0xE6,0xDA,0xDE,0xD2,0xD6,0xCA,0xCE,0xC2,0xC6,0x27,0x23,0x2F,0x2B,0x37,0x33,0x3F,0x3B,0x07,0x03,0x0F,0x0B,0x17,0x13,0x1F,0x1B,0x67,0x63,0x6F,0x6B,0x77,0x73,0x7F,0x7B,0x47,0x43,0x4F,0x4B,0x57,0x53,0x5F,0x5B,0xA7,0xA3,0xAF,0xAB,0xB7,0xB3,0xBF,0xBB,0x87,0x83,0x8F,0x8B,0x97,0x93,0x9F,0x9B,0xE7,0xE3,0xEF,0xEB,0xF7,0xF3,0xFF,0xFB,0xC7,0xC3,0xCF,0xCB,0xD7,0xD3,0xDF,0xDB},
	{0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0A,0x0B,0x0C,0x0D,0x0E,0x0F,0x10,0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,0x1A,0x1B,0x1C,0x1D,0x1E,0x1F,0x20,0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2A,0x2B,0x2C,0x2D,0x2E,0x2F,0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3A,0x3B,0x3C,0x3D,0x3E,0x3F,0x40,0x41,0x42,0x43,0x44,0x45,0x46,0x47,0x48,0x49,0x4A,0x4B,0x4C,0x4D,0x4E,0x4F,0x50,0x51,0x52,0x53,0x54,0x55,0x56,0x57,0x58,0x59,0x5A,0x5B,0x5C,0x5D,0x5E,0x5F,0x60,0x61,0x62,0x63,0x64,0x65,0x66,0x67,0x68,0x69,0x6A,0x6B,0x6C,0x6D,0x6E,0x6F,0x70,0x71,0x72,0x73,0x74,0x75,0x76,0x77,0x78,0x79,0x7A,0x7B,0x7C,0x7D,0x7E,0x7F,0x80,0x81,0x82,0x83,0x84,0x85,0x86,0x87,0x88,0x89,0x8A,0x8B,0x8C,0x8D,0x8E,0x8F,0x90,0x91,0x92,0x93,0x94,0x95,0x96,0x97,0x98,0x99,0x9A,0x9B,0x9C,0x9D,0x9E,0x9F,0xA0,0xA1,0xA2,0xA3,0xA4,0xA5,0xA6,0xA7,0xA8,0xA9,0xAA,0xAB,0xAC,0xAD,0xAE,0xAF,0xB0,0xB1,0xB2,0xB3,0xB4,0xB5,0xB6,0xB7,0xB8,0xB9,0xBA,0xBB,0xBC,0xBD,0xBE,0xBF,0xC0,0xC1,0xC2,0xC3,0xC4,0xC5,0xC6,0xC7,0xC8,0xC9,0xCA,0xCB,0xCC,0xCD,0xCE,0xCF,0xD0,0xD1,0xD2,0xD3,0xD4,0xD5,0xD6,0xD7,0xD8,0xD9,0xDA,0xDB,0xDC,0xDD,0xDE,0xDF,0xE0,0xE1,0xE2,0xE3,0xE4,0xE5,0xE6,0xE7,0xE8,0xE9,0xEA,0xEB,0xEC,0xED,0xEE,0xEF,0xF0,0xF1,0xF2,0xF3,0xF4,0xF5,0xF6,0xF7,0xF8,0xF9,0xFA,0xFB,0xFC,0xFD,0xFE,0xFF},
};


static void whirlpool_round(uint8_t block[restrict static 64], const uint8_t key[restrict static 64]) {
	uint8_t temp[64];
	
	// Non-linear layer (gamma, SubBytes)
	for (int i = 0; i < 64; i++)
		block[i] = SBOX[block[i]];
	
	// Cyclical permutation (pi, ShiftColumns)
	for (int i = 0; i < 8; i++) {
		for (int j = 0; j < 8; j++)
			temp[((i + j) & 7) << 3 | i] = block[j << 3 | i];
	}
	
	// Linear diffusion layer (theta, MixRows)
	for (int i = 0; i < 8; i++) {
		for (int j = 0; j < 8; j++) {
			int sum = 0;
			for (int k = 0; k < 8; k++)
				sum ^= MULTIPLY[k][temp[i << 3 | ((j + k) & 7)]];
			block[i << 3 | j] = sum;
		}
	}
	
	// Key addition (sigma, AddRoundKey)
	for (int i = 0; i < 64; i++)
		block[i] ^= key[i];
}
