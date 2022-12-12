/* 
 * Zeller's congruence (C)
 * by Project Nayuki, 2022. Public domain.
 * https://www.nayuki.io/page/zellers-congruence
 */

#include <assert.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>


/*---- Zeller's congruence function ----*/

/* 
 * Returns the day-of-week dow for the given date
 * (y, m, d) on the proleptic Gregorian calendar.
 * Values of dow are 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
 * Strict values of m are 1 = January, ..., 12 = December.
 * Strict values of d start from 1.
 * The handling of months and days-of-month is lenient.
 */
int dayOfWeek(int y, int m, int d) {
	m = m % 4800 - 3 + 4800 * 2;
	y = y % 400 + 400 + m / 12;
	m %= 12;
	d = d % 7 + 7;
	int temp = y + y / 4 - y / 100 + y / 400;
	return (temp + (m * 13 + 12) / 5 + d) % 7;
}



/*---- Helper functions ----*/

static bool isLeapYear(int y) {
	return y % 4 == 0 && (y % 100 != 0 || y % 400 == 0);
}


static const int MONTH_LENGTHS[] = {-1, 31, -1, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};

static int monthLength(int y, int m) {
	if (m != 2)
		return MONTH_LENGTHS[m];
	else
		return isLeapYear(y) ? 29 : 28;
}


static void nextDate(int ymd[static 3]) {
	assert(1 <= ymd[1] && ymd[1] <= 12);
	assert(1 <= ymd[2] && ymd[2] <= monthLength(ymd[0], ymd[1]));
	
	ymd[2]++;
	if (ymd[2] > monthLength(ymd[0], ymd[1])) {
		ymd[2] = 1;
		ymd[1]++;
		if (ymd[1] == 13) {
			ymd[1] = 1;
			ymd[0]++;
		}
	}
}


static void previousDate(int ymd[static 3]) {
	assert(1 <= ymd[1] && ymd[1] <= 12);
	assert(1 <= ymd[2] && ymd[2] <= monthLength(ymd[0], ymd[1]));
	
	ymd[2]--;
	if (ymd[2] == 0) {
		ymd[1]--;
		ymd[2] = monthLength(ymd[0], ymd[1]);
		if (ymd[1] == 0) {
			ymd[0]--;
			ymd[1] = 12;
			ymd[2] = 31;
		}
	}
}


static int compare(int ymd[static 3], int y, int m, int d) {
	if (ymd[0] != y)
		return ymd[0] < y ? -1 : 1;
	else if (ymd[1] != m)
		return ymd[1] < m ? -1 : 1;
	else if (ymd[2] != d)
		return ymd[2] < d ? -1 : 1;
	else
		return 0;
}


static int dayOfWeekNaive(int y, int m, int d) {
	int ymd[] = {1600, 1, 1};
	int dow = 6;
	while (compare(ymd, y, m, d) < 0) {
		nextDate(ymd);
		dow = (dow + 1) % 7;
	}
	while (compare(ymd, y, m, d) > 0) {
		previousDate(ymd);
		dow = (dow - 1 + 7) % 7;
	}
	return dow;
}



/*---- Test suite ----*/

static void assertEquals(int x, int y) {
	if (x != y) {
		fprintf(stderr, "Value mismatch\n");
		exit(EXIT_FAILURE);
	}
}


static void testSimple() {
	struct TestCase {
		int y;
		int m;
		int d;
		int dow;
	};
	const struct TestCase CASES[] = {
		{-679,  9,  8, 1},
		{-657,  2,  6, 3},
		{-629,  5, 14, 2},
		{-567,  8, 25, 0},
		{-526,  7, 24, 5},
		{-316, 11, 18, 6},
		{-270,  7, 17, 1},
		{-212,  1, 25, 5},
		{-212, 11,  2, 0},
		{- 43,  7, 20, 6},
		{1619, 10, 16, 3},
		{1620, 11, 30, 1},
		{1631,  9,  3, 3},
		{1637,  2, 18, 3},
		{1653,  5, 25, 0},
		{1735,  1,  7, 5},
		{1753,  8, 28, 2},
		{1804,  6, 30, 6},
		{1810, 10,  3, 3},
		{1835,  3,  2, 1},
		{1844,  8, 14, 3},
		{1844, 12, 16, 1},
		{1899,  5, 23, 2},
		{1912, 12, 10, 2},
		{1915,  8,  2, 1},
		{1938,  6, 18, 6},
		{1945,  6,  7, 4},
		{1965,  4, 28, 3},
		{1998,  6, 18, 4},
		{1999, 12, 31, 5},
		{2000,  1,  1, 6},
		{2000,  2,  1, 2},
		{2000,  2, 29, 2},
		{2000,  3,  1, 3},
		{2001,  3,  1, 4},
		{2002,  3,  1, 5},
		{2003,  3,  1, 6},
		{2004,  3,  1, 1},
		{2071,  6, 13, 6},
		{2094,  1, 20, 3},
		{2124,  7, 26, 3},
		{2196, 10, 12, 3},
		{2213,  5,  5, 3},
		{2216,  3, 15, 5},
		{2225,  8, 26, 5},
		{2268,  9,  2, 3},
		{2306,  7, 25, 3},
		{2336,  6, 20, 6},
		{2348,  7, 16, 5},
	};
	for (size_t i = 0; i < sizeof(CASES) / sizeof(CASES[0]); i++) {
		const struct TestCase *cs = &CASES[i];
		assertEquals(cs->dow, dayOfWeek(cs->y, cs->m, cs->d));
	}
}


static void testAscending() {
	int ymd[] = {1600, 1, 1};
	int dow = 6;
	while (ymd[0] < 2400) {
		assertEquals(dow, dayOfWeek(ymd[0], ymd[1], ymd[2]));
		nextDate(ymd);
		dow = (dow + 1) % 7;
	}
}


static void testDescending() {
	int ymd[] = {1600, 1, 1};
	int dow = 6;
	while (ymd[0] > 800) {
		assertEquals(dow, dayOfWeek(ymd[0], ymd[1], ymd[2]));
		previousDate(ymd);
		dow = (dow - 1 + 7) % 7;
	}
}


static void testVsNaiveRandomly() {
	const long TRIALS = 1000;
	for (long i = 0; i < TRIALS; i++) {
		int y = rand() % 800 + 1600;
		int m = rand() % 12 + 1;
		int d = rand() % monthLength(y, m) + 1;
		assertEquals(dayOfWeekNaive(y, m, d), dayOfWeek(y, m, d));
	}
}


static void testLenientRandomly() {
	const long TRIALS = 1000000;
	for (long i = 0; i < TRIALS; i++) {
		int y = rand() % 400 + 2000;
		int m = rand() % 12 + 1;
		int d = rand() % monthLength(y, m) + 1;
		int dow = dayOfWeek(y, m, d);
		
		int temp = rand() % 5000 - 2500;
		y += temp;
		m -= temp * 12;
		d += (rand() % 1000 - 500) * 7;
		assertEquals(dow, dayOfWeek(y, m, d));
	}
}


int main(void) {
	srand(time(NULL));
	
	testSimple();
	testAscending();
	testDescending();
	testVsNaiveRandomly();
	testLenientRandomly();
	
	fprintf(stderr, "Test passed\n");
	return EXIT_SUCCESS;
}
