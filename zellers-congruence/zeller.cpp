/* 
 * Zeller's congruence (C++)
 * by Project Nayuki, 2022. Public domain.
 * https://www.nayuki.io/page/zellers-congruence
 */

#include <cstdlib>
#include <exception>
#include <iostream>
#include <random>
#include <vector>


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

bool isLeapYear(int y) {
	return y % 4 == 0 && (y % 100 != 0 || y % 400 == 0);
}


const int MONTH_LENGTHS[] = {-1, 31, -1, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};

static int monthLength(int y, int m) {
	if (m != 2)
		return MONTH_LENGTHS[m];
	else
		return isLeapYear(y) ? 29 : 28;
}


static void nextDate(int ymd[3]) {
	if (!(1 <= ymd[1] && ymd[1] <= 12))
		throw std::domain_error("Invalid month");
	if (!(1 <= ymd[2] && ymd[2] <= monthLength(ymd[0], ymd[1])))
		throw std::domain_error("Invalid day-of-month");
	
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


static void previousDate(int ymd[3]) {
	if (!(1 <= ymd[1] && ymd[1] <= 12))
		throw std::domain_error("Invalid month");
	if (!(1 <= ymd[2] && ymd[2] <= monthLength(ymd[0], ymd[1])))
		throw std::domain_error("Invalid day-of-month");
	
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


static int compare(int ymd[3], int y, int m, int d) {
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

std::default_random_engine randGen((std::random_device())());


template <typename T>
static void assertEquals(T x, T y) {
	if (x != y)
		throw std::runtime_error("Value mismatch");
}


static void testSimple() {
	struct TestCase {
		int y;
		int m;
		int d;
		int dow;
	};
	const std::vector<TestCase> CASES{
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
	for (const TestCase &cs : CASES)
		assertEquals(cs.dow, dayOfWeek(cs.y, cs.m, cs.d));
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
	std::uniform_int_distribution<int> yearDist(1600, 2400);
	std::uniform_int_distribution<int> monthDist(1, 12);
	for (long i = 0; i < TRIALS; i++) {
		int y = yearDist(randGen);
		int m = monthDist(randGen);
		std::uniform_int_distribution<int> dayDist(1, monthLength(y, m));
		int d = dayDist(randGen);
		assertEquals(dayOfWeekNaive(y, m, d), dayOfWeek(y, m, d));
	}
}


static void testLenientRandomly() {
	const long TRIALS = 1000000;
	std::uniform_int_distribution<int> yearDist(2000, 2400);
	std::uniform_int_distribution<int> monthDist(1, 12);
	std::uniform_int_distribution<int> yearPerturbDist(-2500, 2500);
	std::uniform_int_distribution<int> dayPerturbDist(-500, 500);
	for (long i = 0; i < TRIALS; i++) {
		int y = yearDist(randGen);
		int m = monthDist(randGen);
		std::uniform_int_distribution<int> dayDist(1, monthLength(y, m));
		int d = dayDist(randGen);
		int dow = dayOfWeek(y, m, d);
		
		int temp = yearPerturbDist(randGen);
		y += temp;
		m -= temp * 12;
		d += dayPerturbDist(randGen) * 7;
		assertEquals(dow, dayOfWeek(y, m, d));
	}
}


int main() {
	try {
		testSimple();
		testAscending();
		testDescending();
		testVsNaiveRandomly();
		testLenientRandomly();
		
		std::cerr << "Test passed" << std::endl;
		return EXIT_SUCCESS;
	} catch (std::exception &e) {
		std::cerr << e.what() << std::endl;
		return EXIT_FAILURE;
	}
}
