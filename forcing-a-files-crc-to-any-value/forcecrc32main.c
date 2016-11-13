/*
 * CRC-32 forcer (C)
 *
 * Copyright (c) 2016 Project Nayuki
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

#include <inttypes.h>
#include <limits.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#ifndef DISABLE_ZLIB
#include <zlib.h>
#endif

#include "forcecrc32.h"


/* Forward declarations */

static uint32_t get_crc32_and_length(FILE *f, uint64_t *length);
static void fseek64(FILE *f, uint64_t offset);
static uint32_t reverse_bits(uint32_t x);


/* Main program */

int main(int argc, char **argv) {
	// Handle arguments
	if (argc != 4) {
		fprintf(stderr, "Usage: %s FileName ByteOffset NewCrc32Value\n", argv[0]);
		return EXIT_FAILURE;
	}

	// Parse and check file offset argument
	uint64_t offset;
	if (sscanf(argv[2], "%" SCNu64, &offset) != 1) {
		fprintf(stderr, "Error: Invalid byte offset\n");
		return EXIT_FAILURE;
	}
	char temp[21] = {0};
	sprintf(temp, "%" PRIu64, offset);
	if (strcmp(temp, argv[2]) != 0) {
		fprintf(stderr, "Error: Invalid byte offset\n");
		return EXIT_FAILURE;
	}

	// Parse and check new CRC argument
	uint32_t newcrc;
	if (strlen(argv[3]) != 8 || argv[3][0] == '+' || argv[3][0] == '-'
			|| sscanf(argv[3], "%" SCNx32, &newcrc) != 1) {
		fprintf(stderr, "Error: Invalid new CRC-32 value\n");
		return EXIT_FAILURE;
	}
	newcrc = reverse_bits(newcrc);

	// Process the file
	FILE *f = fopen(argv[1], "r+b");
	if (f == NULL) {
		perror("fopen");
		return EXIT_FAILURE;
	}

	// Read entire file and calculate original CRC-32 value.
	// Note: We can't use fseek(f, 0, SEEK_END) + ftell(f) to determine the length of the file, due to undefined behavior.
	// To be portable, we also avoid using POSIX fseeko()+ftello() or Windows GetFileSizeEx()/_filelength().
	uint64_t length;
	uint32_t crc = get_crc32_and_length(f, &length);
	if (offset > UINT64_MAX - 4 || offset + 4 > length) {
		fprintf(stderr, "Error: Byte offset plus 4 exceeds file length\n");
		return EXIT_FAILURE;
	}
	fprintf(stdout, "Original CRC-32: %08" PRIX32 "\n", reverse_bits(crc));

	// Compute the change to make
	uint32_t delta = reverse_crc32(crc ^ newcrc, length - offset);

	// Patch 4 bytes in the file
	fseek64(f, offset);
	int i;
	for (i = 0; i < 4; i++) {
		int b = fgetc(f);
		if (b == EOF) {
			perror("fgetc");
			return EXIT_FAILURE;
		}
		b ^= (int)((delta >> (i * 8)) & 0xFF);
		if (fseek(f, -1, SEEK_CUR) != 0) {
			perror("fseek");
			return EXIT_FAILURE;
		}
		if (fputc(b, f) == EOF) {
			perror("fputc");
			return EXIT_FAILURE;
		}
	}
	fprintf(stdout, "Computed and wrote patch\n");

	// Recheck entire file
	if (get_crc32_and_length(f, &length) == newcrc) {
		fprintf(stdout, "New CRC-32 successfully verified\n");
		fclose(f);
		return EXIT_SUCCESS;
	} else {
		fprintf(stderr, "Error: Failed to update CRC-32 to desired value\n");
		return EXIT_FAILURE;
	}
}


/* Utilities */

static const uint64_t POLYNOMIAL = UINT64_C(0x104C11DB7);  // Generator polynomial. Do not modify, because there are many dependencies


static uint32_t get_crc32_and_length(FILE *f, uint64_t *length) {
	rewind(f);
#ifdef DISABLE_ZLIB
	uint32_t crc = UINT32_C(0xFFFFFFFF);
#else
	uint32_t crc = 0;
#endif
	*length = 0;
	while (true) {
		char buffer[32 * 1024];
		size_t n = fread(buffer, 1, sizeof(buffer), f);
		if (ferror(f) != 0) {
			perror("fread");
			exit(EXIT_FAILURE);
		}
#ifdef DISABLE_ZLIB
		size_t i;
		for (i = 0; i < n; i++) {
			int j;
			for (j = 0; j < 8; j++) {
				int bit = ((uint8_t)buffer[i] >> j) & 1;
				crc ^= (uint32_t)bit << 31;
				int xor = crc >> 31;  // Boolean
				crc = (crc & UINT32_C(0x7FFFFFFFF)) << 1;
				if (xor)
					crc ^= (uint32_t)POLYNOMIAL;
			}
		}
#else
		crc = crc32(crc, (Bytef *)buffer, n);
#endif
		*length += n;
		if (feof(f))
#ifdef DISABLE_ZLIB
			return ~crc;
#else
			return reverse_bits(crc);
#endif
	}
}


static void fseek64(FILE *f, uint64_t offset) {
	rewind(f);
	while (offset > 0) {
		long n = LONG_MAX;
		if (offset < (unsigned long)n)
			n = (long)offset;
		fseek(f, n, SEEK_CUR);
		offset -= (unsigned long)n;
	}
}


static uint32_t reverse_bits(uint32_t val) {
	int s;
	// blitter-type solution, rather faster than the naive solution
	const uint32_t masks[] = {0x55555555, 0x33333333, 0xF0F0F0F, 0xFF00FF, 0xFFFF};
	for (s = 0; s<sizeof(masks)/sizeof(masks[0]); ++s)
		val = ((val >> (1<<s)) & masks[s]) | ((val & masks[s]) << (1<<s));

	return val;
}

