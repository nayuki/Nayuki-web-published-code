/* 
 * Zeller's congruence (Java)
 * by Project Nayuki, 2022. Public domain.
 * https://www.nayuki.io/page/zellers-congruence
 */

import static org.junit.Assert.assertEquals;
import java.util.Random;
import org.junit.Test;


public final class Zeller {
	
	/*---- Zeller's congruence function ----*/
	
	/**
	 * Returns the day-of-week for the given date ({@code y}, {@code m}, {@code d}) on the
	 * proleptic Gregorian calendar. The handling of months and days-of-month is lenient.
	 * @param y the year
	 * @param m the month, where strict values are are 1 = January, ..., 12 = December
	 * @param d the day-of-month, where strict values start from 1
	 * @return the day of week, where 0 = Sunday, 1 = Monday, ..., 6 = Saturday
	 */
	public static int dayOfWeek(int y, int m, int d) {
		m = m % 4800 - 3 + 4800 * 2;
		y = y % 400 + 400 + m / 12;
		m %= 12;
		d = d % 7 + 7;
		int temp = y + y / 4 - y / 100 + y / 400;
		return (temp + (m * 13 + 12) / 5 + d) % 7;
	}
	
	
	
	/*---- Test suite ----*/
	
	@Test public void testSimple() {
		final int[][] CASES = {
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
		for (int[] cs : CASES)
			assertEquals(cs[3], dayOfWeek(cs[0], cs[1], cs[2]));
	}
	
	
	@Test public void testAscending() {
		int[] ymd = {1600, 1, 1};
		int dow = 6;
		while (ymd[0] < 2400) {
			assertEquals(dow, dayOfWeek(ymd[0], ymd[1], ymd[2]));
			nextDate(ymd);
			dow = (dow + 1) % 7;
		}
	}
	
	
	@Test public void testDescending() {
		int[] ymd = {1600, 1, 1};
		int dow = 6;
		while (ymd[0] > 800) {
			assertEquals(dow, dayOfWeek(ymd[0], ymd[1], ymd[2]));
			previousDate(ymd);
			dow = (dow - 1 + 7) % 7;
		}
	}
	
	
	@Test public void testVsNaiveRandomly() {
		final int TRIALS = 1000;
		for (int i = 0; i < TRIALS; i++) {
			int y = rand.nextInt(800) + 1600;
			int m = rand.nextInt(12) + 1;
			int d = rand.nextInt(monthLength(y, m)) + 1;
			assertEquals(dayOfWeekNaive(y, m, d), dayOfWeek(y, m, d));
		}
	}
	
	
	@Test public void testLenientExtreme() {
		final int[][] CASES = {
			{-2147483648, -2147483648, -2147483648, 4},
			{-2147483648, -2147483648,           0, 6},
			{-2147483648, -2147483648,  2147483647, 0},
			{-2147483648,           0, -2147483648, 3},
			{-2147483648,           0,           0, 5},
			{-2147483648,           0,  2147483647, 6},
			{-2147483648,  2147483647, -2147483648, 0},
			{-2147483648,  2147483647,           0, 2},
			{-2147483648,  2147483647,  2147483647, 3},
			{          0, -2147483648, -2147483648, 0},
			{          0, -2147483648,           0, 2},
			{          0, -2147483648,  2147483647, 3},
			{          0,           0, -2147483648, 0},
			{          0,           0,           0, 2},
			{          0,           0,  2147483647, 3},
			{          0,  2147483647, -2147483648, 4},
			{          0,  2147483647,           0, 6},
			{          0,  2147483647,  2147483647, 0},
			{ 2147483647, -2147483648, -2147483648, 3},
			{ 2147483647, -2147483648,           0, 5},
			{ 2147483647, -2147483648,  2147483647, 6},
			{ 2147483647,           0, -2147483648, 3},
			{ 2147483647,           0,           0, 5},
			{ 2147483647,           0,  2147483647, 6},
			{ 2147483647,  2147483647, -2147483648, 6},
			{ 2147483647,  2147483647,           0, 1},
			{ 2147483647,  2147483647,  2147483647, 2},
			
			{-2147482867,        3391,        -370, 6},
			{-2147482916, -2147474794,  2147483083, 6},
			{       -113,        4416,         846, 3},
			{-2147483527,        1953,  2147483113, 0},
			{-2147483609,        5056, -2147483507, 5},
			{-2147483145, -2147473696,  2147483050, 3},
			{-2147483364, -2147476925,  2147483110, 0},
			{-2147482829,  2147478555, -2147482893, 4},
			{ 2147483004,        4207,         439, 5},
			{ 2147483375,  2147476221,        -264, 1},
			{ 2147483331, -2147474091,          24, 1},
			{-2147482651,       -2557,  2147482914, 0},
			{       -474,  2147481275, -2147483361, 6},
			{ 2147483575,        8469,  2147483571, 4},
			{       -729,  2147482455,        -742, 3},
			{-2147483082, -2147482431,         893, 5},
			{       -935,  2147477896,        -983, 3},
			{        989,  2147478994,         103, 2},
			{ 2147483388,       -7349, -2147482986, 3},
			{-2147483243,  2147478174,        -972, 1},
			{ 2147483126, -2147473910,  2147483010, 3},
			{ 2147482852,  2147475470,         762, 4},
			{        978,       -3684,         921, 0},
			{-2147482993,        5521,         659, 2},
			{-2147483592,       -6177,        -416, 6},
			{-2147482685,  2147480301, -2147483125, 0},
			{-2147483117,       -3192,  2147482759, 1},
			{-2147482977,  2147480575, -2147483637, 2},
			{ 2147482784,  2147481908, -2147483231, 0},
			{ 2147483307, -2147482066,          97, 1},
			{-2147482846, -2147483093,        -117, 4},
			{-2147483546, -2147481111,  2147483477, 1},
			{       -978,  2147477925,  2147483516, 5},
			{ 2147483440,       -5509,        -328, 3},
			{-2147482752, -2147482615,  2147483471, 2},
			{-2147483374,  2147477167,        -195, 2},
			{       -655,  2147474795,  2147483487, 3},
			{-2147483616,       -3046, -2147483405, 5},
			{-2147482974, -2147475398,  2147483324, 3},
			{ 2147483293, -2147473953,  2147483436, 5},
			{-2147482873, -2147478425, -2147482858, 1},
			{-2147483483,  2147475023,        -975, 2},
			{-2147482989,  2147478204,         583, 5},
			{ 2147482648, -2147483615,         265, 6},
			{-2147483496, -2147479904, -2147483523, 5},
			{        865,        8184,  2147482837, 2},
			{-2147483395, -2147475567,  2147482843, 1},
			{-2147482753, -2147478064,  2147483301, 2},
			{ 2147483542,  2147474858,         297, 4},
			{-2147483156,  2147480861, -2147482792, 5},
			{       -714,  2147480816,  2147482718, 1},
			{ 2147482678, -2147474015, -2147483327, 6},
			{ 2147482712, -2147480138, -2147482804, 0},
			{-2147482893,       -8853,         767, 2},
			{ 2147483123,       -8226, -2147483251, 3},
			{-2147483312,  2147475396,         397, 3},
			{-2147483272,  2147480332,  2147482777, 6},
			{ 2147483464,       -2587,  2147483428, 3},
			{ 2147483440,         336,  2147483435, 5},
			{ 2147483554, -2147479219,  2147483635, 3},
			{ 2147483098,       -5676,        -777, 2},
			{       -978,        2245,  2147483577, 4},
			{       -385,  2147477663, -2147483334, 1},
			{        493,       -5408, -2147482835, 0},
			{       -832,  2147482578, -2147483289, 1},
			{ 2147483121,         721,        -532, 3},
			{       -839, -2147476439,        -421, 0},
			{-2147483325,  2147475737,        -673, 6},
			{ 2147482803,  2147482782, -2147483052, 1},
			{-2147483289,  2147477201,        -854, 0},
			{ 2147482988, -2147482988,  2147483495, 0},
			{ 2147482833,        -152,        -450, 0},
			{       -680,  2147476457,         614, 6},
			{       -495, -2147482633,         135, 1},
			{ 2147483352,  2147473936,        -231, 1},
			{        538,  2147481471,  2147482683, 1},
			{-2147483258, -2147476749, -2147482982, 3},
			{ 2147483142, -2147476915, -2147483279, 2},
			{-2147482846, -2147477082,        -811, 0},
			{ 2147482814,  2147473863,         811, 1},
			{ 2147483149,        4413, -2147483377, 0},
			{-2147483088,        5846, -2147483562, 4},
			{        -19, -2147481074, -2147482835, 0},
			{ 2147483545,       -5504,  2147483436, 3},
			{       -699, -2147479378,  2147483028, 5},
			{-2147483459, -2147477306,        -669, 5},
			{-2147482851,  2147482950, -2147482920, 0},
			{        844, -2147483061,        -732, 5},
			{ 2147483354,  2147478624, -2147483356, 0},
			{        105,  2147482272,  2147482962, 2},
			{-2147483504,  2147476125,  2147482960, 3},
			{ 2147482773,  2147479428,          57, 4},
			{       -155, -2147480377,         385, 4},
			{       -565, -2147481441,        -627, 5},
			{ 2147483564,  2147477196, -2147482687, 6},
			{ 2147483311, -2147481163,  2147482945, 6},
			{        867, -2147481094,        -470, 3},
			{-2147483548,  2147473721, -2147483013, 0},
			{ 2147483177, -2147482328,         186, 2},
			{        775,  2147474818,  2147482979, 4},
		};
		for (int[] cs : CASES)
			assertEquals(cs[3], dayOfWeek(cs[0], cs[1], cs[2]));
	}
	
	
	@Test public void testLenientRandomly() {
		final int TRIALS = 1_000_000;
		for (int i = 0; i < TRIALS; i++) {
			int y = rand.nextInt(400) + 2000;
			int m = rand.nextInt(12) + 1;
			int d = rand.nextInt(monthLength(y, m)) + 1;
			int dow = dayOfWeek(y, m, d);
			
			int temp = rand.nextInt(10000) - 5000;
			y += temp;
			m -= temp * 12;
			d += (rand.nextInt(1000) - 500) * 7;
			assertEquals(dow, dayOfWeek(y, m, d));
		}
	}
	
	
	private static Random rand = new Random();
	
	
	
	/*---- Helper functions ----*/
	
	private static int dayOfWeekNaive(int y, int m, int d) {
		if (!(1 <= m && m <= 12))
			throw new IllegalArgumentException("Invalid month");
		if (!(1 <= d && d <= monthLength(y, m)))
			throw new IllegalArgumentException("Invalid day-of-month");
		int[] ymd = {1600, 1, 1};
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
	
	
	private static int compare(int[] ymd, int y, int m, int d) {
		if (ymd.length != 3)
			throw new AssertionError();
		if (ymd[0] != y)
			return Integer.compare(ymd[0], y);
		else if (ymd[1] != m)
			return Integer.compare(ymd[1], m);
		else
			return Integer.compare(ymd[2], d);
	}
	
	
	private static void nextDate(int[] ymd) {
		if (!(1 <= ymd[1] && ymd[1] <= 12))
			throw new IllegalArgumentException("Invalid month");
		if (!(1 <= ymd[2] && ymd[2] <= monthLength(ymd[0], ymd[1])))
			throw new IllegalArgumentException("Invalid day-of-month");
		
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
	
	
	private static void previousDate(int[] ymd) {
		if (!(1 <= ymd[1] && ymd[1] <= 12))
			throw new IllegalArgumentException("Invalid month");
		if (!(1 <= ymd[2] && ymd[2] <= monthLength(ymd[0], ymd[1])))
			throw new IllegalArgumentException("Invalid day-of-month");
		
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
	
	
	private static int monthLength(int y, int m) {
		if (m != 2)
			return MONTH_LENGTHS[m];
		else
			return isLeapYear(y) ? 29 : 28;
	}
	
	private static final int[] MONTH_LENGTHS = {-1, 31, -1, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
	
	
	private static boolean isLeapYear(int y) {
		return y % 4 == 0 && (y % 100 != 0 || y % 400 == 0);
	}
	
}
