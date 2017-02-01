/* 
 * Lowest SHA-512 value by brute force (C)
 * 
 * Copyright (c) 2017 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/lowest-sha512-value-by-brute-force
 */

#include <inttypes.h>
#include <pthread.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <unistd.h>


// This constant does not comprehensively cover all dependencies on the number of channels - do not modify
#define NUM_CH 4

// Please customize this to your system
static const int num_threads = 4;

// The message length can be anywhere from 1 to 111 (so that the message plus footer fits in a block).
// For an alphabet of lowercase letters, 16 characters already provides about 2^75 possibilities to explore, which is much more than enough.
#define MSG_LEN 28


/* Function prototypes */

static int self_check(void);
static void benchmark(void);
static void *worker(void *data);
static int compare_hashes(const uint64_t quadhash[8 * NUM_CH], int channel, const uint64_t hash[8]);
static uint8_t get_byte(const uint8_t blocks[128 * NUM_CH], int index, int channel);
static void    set_byte(uint8_t blocks[128 * NUM_CH], int index, int channel, uint8_t val);
static void get_message(const uint8_t blocks[128 * NUM_CH], int channel, char *message);

// Link this program with an external C or x86 compression function
extern void sha512_compress_quad(uint64_t states[8 * NUM_CH], const uint8_t blocks[128 * NUM_CH]);


#define QUAD(x)  x, x, x, x
static const uint64_t initial_states[8 * NUM_CH] = {
	QUAD(UINT64_C(0x6A09E667F3BCC908)),
	QUAD(UINT64_C(0xBB67AE8584CAA73B)),
	QUAD(UINT64_C(0x3C6EF372FE94F82B)),
	QUAD(UINT64_C(0xA54FF53A5F1D36F1)),
	QUAD(UINT64_C(0x510E527FADE682D1)),
	QUAD(UINT64_C(0x9B05688C2B3E6C1F)),
	QUAD(UINT64_C(0x1F83D9ABFB41BD6B)),
	QUAD(UINT64_C(0x5BE0CD19137E2179)),
};


/* Global variables */

static pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;
static uint64_t total_iterations = 0;
static uint64_t global_lowest_hash[8];
static int prev_print_type = 0;  // 0 = hash, 1 = status
static int finished_threads = 0;


/* Main program */

int main(void) {
	// Sanity test
	if (!self_check()) {
		fprintf(stderr, "Self-check failed\n");
		return EXIT_FAILURE;
	}
	benchmark();
	
	// Set up the SHA-512 processed blocks: Message (28 bytes), terminator and padding (96 bytes), length (16 bytes)
	uint8_t *blocks = calloc(128 * NUM_CH * num_threads, sizeof(uint8_t));
	if (blocks == NULL) {
		perror("calloc");
		return EXIT_FAILURE;
	}
	{
		struct timespec ts;
		clock_gettime(CLOCK_REALTIME, &ts);
		uint64_t time = ts.tv_sec * UINT64_C(1000000000) + ts.tv_nsec;
		
		for (int i = 0; i < num_threads; i++) {
			for (int ch = 0; ch < NUM_CH; ch++) {
				uint8_t *blks = &blocks[128 * NUM_CH * i];
				uint64_t temp = time + i * NUM_CH + ch;
				for (int j = 0; j < MSG_LEN / 2; j++, temp /= 26)
					set_byte(blks, j, ch, 'a' + temp % 26);
				for (int j = 0; j < MSG_LEN / 2; j++)
					set_byte(blks, j + MSG_LEN / 2, ch, 'a');
				set_byte(blks, MSG_LEN, ch, 0x80);
				set_byte(blks, 126, ch, MSG_LEN >> 5);
				set_byte(blks, 127, ch, MSG_LEN << 3);
			}
		}
	}
	
	// Initialize initial lowest hash
	memset(global_lowest_hash, 0xFF, sizeof(global_lowest_hash));
	global_lowest_hash[0] >>= 24;  // Exclude trivial matches
	
	// Launch threads
	pthread_t *threads = malloc(num_threads * sizeof(pthread_t));
	if (threads == NULL) {
		perror("malloc");
		return EXIT_FAILURE;
	}
	for (int i = 0; i < num_threads; i++)
		pthread_create(&threads[i], NULL, worker, &blocks[128 * NUM_CH * i]);
	
	// Print status until threads finish
	while (true) {
		pthread_mutex_lock(&mutex);
		if (finished_threads >= num_threads) {
			pthread_mutex_unlock(&mutex);
			break;
		}
		
		char message[MSG_LEN + 1];
		get_message(blocks, 0, message);  // Only print thread 0, channel 0
		fprintf(stderr, "\rHash trials: %.3f billion (%s)", total_iterations * NUM_CH / 1000000000.0, message);
		fflush(stderr);
		prev_print_type = 1;
		
		pthread_mutex_unlock(&mutex);
		sleep(10);
	}
	fprintf(stderr, "\nSearch space exhausted\n");
	
	// Clean up
	for (int i = 0; i < num_threads; i++)
		pthread_join(threads[i], NULL);
	free(blocks);
	free(threads);
	return EXIT_SUCCESS;
}


#define ITERS_PER_ACCUMULATE 3000000

static void *worker(void *blks) {
	// State variables
	uint64_t lowesthash[8];
	pthread_mutex_lock(&mutex);
	memcpy(lowesthash, global_lowest_hash, sizeof(lowesthash));
	pthread_mutex_unlock(&mutex);
	uint8_t *blocks = (uint8_t *)blks;
	
	for (int i = 0; ; i++) {
		// Accumulate status
		if (i >= ITERS_PER_ACCUMULATE) {
			pthread_mutex_lock(&mutex);
			total_iterations += i;
			pthread_mutex_unlock(&mutex);
			i = 0;
		}
		
		// Do hashing
		uint64_t hashes[8 * NUM_CH];
		memcpy(hashes, initial_states, sizeof(hashes));
		sha512_compress_quad(hashes, blocks);
		
		// Compare with lowest hash
		if (hashes[0] <= lowesthash[0] || hashes[1] <= lowesthash[0] || hashes[2] <= lowesthash[0] || hashes[3] <= lowesthash[0]) {  // Assumes NUM_CH = 4
			pthread_mutex_lock(&mutex);
			for (int ch = 0; ch < NUM_CH; ch++) {
				if (compare_hashes(hashes, ch, global_lowest_hash) < 0) {
					char message[MSG_LEN + 1];
					get_message(blocks, ch, message);
					fprintf(stdout, "%016" PRIx64 "%016" PRIx64 "%016" PRIx64 "%016" PRIx64 "%016" PRIx64 "%016" PRIx64 "%016" PRIx64 "%016" PRIx64 " %s\n",
					        hashes[0 * NUM_CH + ch], hashes[1 * NUM_CH + ch], hashes[2 * NUM_CH + ch], hashes[3 * NUM_CH + ch],
					        hashes[4 * NUM_CH + ch], hashes[5 * NUM_CH + ch], hashes[6 * NUM_CH + ch], hashes[7 * NUM_CH + ch], message);
					if (prev_print_type == 1)
						fprintf(stderr, "    ");
					fprintf(stderr, "%016" PRIx64 "%016" PRIx64 "... %s\n", hashes[0 * NUM_CH + ch], hashes[1 * NUM_CH + ch], message);
					fflush(stdout);
					fflush(stderr);
					for (int j = 0; j < 8; j++)
						global_lowest_hash[j] = hashes[j * NUM_CH + ch];
					prev_print_type = 0;
				}
			}
			for (int j = 0; j < 8; j++)
				lowesthash[j] = global_lowest_hash[j];
			pthread_mutex_unlock(&mutex);
		}
		
		// Increment messages
		int j;
		for (j = MSG_LEN - 1; j >= 0 && get_byte(blocks, j, 0) >= 'z'; j--) {
			for (int ch = 0; ch < NUM_CH; ch++)
				set_byte(blocks, j, ch, 'a');
		}
		if (j < 0)
			break;
		for (int ch = 0; ch < NUM_CH; ch++)
			set_byte(blocks, j, ch, get_byte(blocks, j, ch) + 1);
	}
	pthread_mutex_lock(&mutex);
	finished_threads++;
	pthread_mutex_unlock(&mutex);
	return NULL;
}


// Assumes NUM_CH = 4
static int self_check(void) {
	uint8_t blocks[128 * NUM_CH] = {
		0x80,0,0,0,0,0,0,0,  'a','b','c',0x80,0,0,0,0,  'm','e','s','s','a','g','e',' ',  'a','b','c','d','e','f','g','h',
		0,0,0,0,0,0,0,0,     0,0,0,0,0,0,0,0,           'd','i','g','e','s','t',0x80,0,   'b','c','d','e','f','g','h','i',
		0,0,0,0,0,0,0,0,     0,0,0,0,0,0,0,0,           0,0,0,0,0,0,0,0,                  'c','d','e','f','g','h','i','j',
		0,0,0,0,0,0,0,0,     0,0,0,0,0,0,0,0,           0,0,0,0,0,0,0,0,                  'd','e','f','g','h','i','j','k',
		0,0,0,0,0,0,0,0,     0,0,0,0,0,0,0,0,           0,0,0,0,0,0,0,0,                  'e','f','g','h','i','j','k','l',
		0,0,0,0,0,0,0,0,     0,0,0,0,0,0,0,0,           0,0,0,0,0,0,0,0,                  'f','g','h','i','j','k','l','m',
		0,0,0,0,0,0,0,0,     0,0,0,0,0,0,0,0,           0,0,0,0,0,0,0,0,                  'g','h','i','j','k','l','m','n',
		0,0,0,0,0,0,0,0,     0,0,0,0,0,0,0,0,           0,0,0,0,0,0,0,0,                  'h','i','j','k','l','m','n','o',
		0,0,0,0,0,0,0,0,     0,0,0,0,0,0,0,0,           0,0,0,0,0,0,0,0,                  'i','j','k','l','m','n','o','p',
		0,0,0,0,0,0,0,0,     0,0,0,0,0,0,0,0,           0,0,0,0,0,0,0,0,                  'j','k','l','m','n','o','p','q',
		0,0,0,0,0,0,0,0,     0,0,0,0,0,0,0,0,           0,0,0,0,0,0,0,0,                  'k','l','m','n','o','p','q','r',
		0,0,0,0,0,0,0,0,     0,0,0,0,0,0,0,0,           0,0,0,0,0,0,0,0,                  'l','m','n','o','p','q','r','s',
		0,0,0,0,0,0,0,0,     0,0,0,0,0,0,0,0,           0,0,0,0,0,0,0,0,                  'm','n','o','p','q','r','s','t',
		0,0,0,0,0,0,0,0,     0,0,0,0,0,0,0,0,           0,0,0,0,0,0,0,0,                  'n','o','p','q','r','s','t',0x80,
		0,0,0,0,0,0,0,0,     0,0,0,0,0,0,0,0,           0,0,0,0,0,0,0,0,                  0,0,0,0,0,0,0,0,
		0,0,0,0,0,0,0,0,     0,0,0,0,0,0,0,24,          0,0,0,0,0,0,0,112,                0,0,0,0,0,0,3,120,
	};
	uint64_t states[8 * NUM_CH];
	memcpy(states, initial_states, sizeof(states));
	sha512_compress_quad(states, blocks);
	
	uint64_t answers[8 * NUM_CH] = {
		UINT64_C(0xCF83E1357EEFB8BD), UINT64_C(0xDDAF35A193617ABA), UINT64_C(0x107DBF389D9E9F71), UINT64_C(0x0988DB6EE79AA0B4),
		UINT64_C(0xF1542850D66D8007), UINT64_C(0xCC417349AE204131), UINT64_C(0xA3A95F6C055B9251), UINT64_C(0xB28B0B3D2D9D50A0),
		UINT64_C(0xD620E4050B5715DC), UINT64_C(0x12E6FA4E89A97EA2), UINT64_C(0xBC5268C2BE16D6C1), UINT64_C(0xC2782144BA51A040),
		UINT64_C(0x83F4A921D36CE9CE), UINT64_C(0x0A9EEEE64B55D39A), UINT64_C(0x3492EA45B0199F33), UINT64_C(0x5BDF82F04E895FB6),
		UINT64_C(0x47D0D13C5D85F2B0), UINT64_C(0x2192992A274FC1A8), UINT64_C(0x09E16455AB1E9611), UINT64_C(0xA4848953A0028D33),
		UINT64_C(0xFF8318D2877EEC2F), UINT64_C(0x36BA3C23A3FEEBBD), UINT64_C(0x8E8A905D5597B720), UINT64_C(0xDD6FCE20C3994D07),
		UINT64_C(0x63B931BD47417A81), UINT64_C(0x454D4423643CE80E), UINT64_C(0x38DDB372A8982604), UINT64_C(0x8F8382DFC4890352),
		UINT64_C(0xA538327AF927DA3E), UINT64_C(0x2A9AC94FA54CA49F), UINT64_C(0x6DE66687BB420E7C), UINT64_C(0x1C7AA744DDEBF6C6),
	};
	return memcmp(states, answers, sizeof(answers)) == 0;
}


static void benchmark(void) {
	const int N = 3000000;
	uint8_t blocks[128 * NUM_CH] = {0};
	uint64_t states[8 * NUM_CH] = {0};
	clock_t start_time = clock();
	for (int i = 0; i < N; i++)
		sha512_compress_quad(states, blocks);
	fprintf(stderr, "Speed: %.3f million iterations per second\n", (double)N / (clock() - start_time) * CLOCKS_PER_SEC / 1000000);
}


static int compare_hashes(const uint64_t quadhash[8 * NUM_CH], int channel, const uint64_t hash[8]) {
	for (int i = 0; i < 8; i++) {
		uint64_t x = quadhash[i * NUM_CH + channel];
		uint64_t y = hash[i];
		if (x < y)
			return -1;
		else if (x > y)
			return 1;
	}
	return 0;
}


static uint8_t get_byte(const uint8_t blocks[128 * NUM_CH], int index, int channel) {
	return blocks[((index & ~7) << 2) | (channel << 3) | (index & 7)];  // Assumes NUM_CH = 4
}


static void set_byte(uint8_t blocks[128 * NUM_CH], int index, int channel, uint8_t val) {
	blocks[((index & ~7) << 2) | (channel << 3) | (index & 7)] = val;  // Assumes NUM_CH = 4
}


static void get_message(const uint8_t blocks[128 * NUM_CH], int channel, char *message) {
	for (int i = 0; i < MSG_LEN; i++)
		message[i] = get_byte(blocks, i, channel);
	message[MSG_LEN] = '\0';
}
