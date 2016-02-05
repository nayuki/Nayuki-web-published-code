/* 
 * Windows timestamp accessor datetime test (Java)
 * 
 * Copyright (c) 2014 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/windows-timestamp-accessor-library
 */

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import java.util.Random;
import org.junit.Test;


public class WindowsTimestampAccessorDatetimeTest {
	
	/* Test suite */
	
	// Checks that each calendar day (at midnight) from year -500 to 2999 are converted correctly to and from ticks
	@Test public void testWholeDays() {
		long ticks = -158100768000000000L;
		int year = -500;
		int month = 1;
		int day = 1;
		while (year < 3000) {
			int[] dt = new int[]{year, month, day, 0, 0, 0, 0};
			assertArrayEquals(dt, WindowsTimestampAccessor.ticksToDatetime(ticks));
			assertEquals(ticks, WindowsTimestampAccessor.datetimeToTicks(dt));
			
			// Increment a day
			ticks += 864000000000L;
			day++;
			if (day > getMonthLength(year, month)) {
				month++;
				day = 1;
				if (month == 13) {
					year++;
					month = 1;
				}
			}
		}
	}
	
	
	// Checks that random moments in the middle of random days are converted correctly to and from ticks
	@Test public void testFractionalDays() {
		for (int i = 0; i < 300000; i++) {
			int day = rand.nextInt(2000000) - 500000;  // Approximately from year -1400 to 4100
			int hr  = rand.nextDouble() < 0.3 ? rand.nextInt(24) : 0;
			int min = rand.nextDouble() < 0.3 ? rand.nextInt(60) : 0;
			int sec = rand.nextDouble() < 0.3 ? rand.nextInt(60) : 0;
			int us  = rand.nextDouble() < 0.3 ? rand.nextInt(1000000) : 0;
			long ticks = ((((day * 24L + hr) * 60 + min) * 60 + sec) * 1000000 + us) * 10;
			
			// Assumes that the method converts correctly for midnight moments
			int[] answer = WindowsTimestampAccessor.ticksToDatetime(day * 864000000000L);
			// Patch up the correct answer
			answer[3] = hr;
			answer[4] = min;
			answer[5] = sec;
			answer[6] = us;
			
			// Convert and compare
			assertArrayEquals(answer, WindowsTimestampAccessor.ticksToDatetime(ticks));
			assertEquals(ticks, WindowsTimestampAccessor.datetimeToTicks(answer));
		}
	}
	
	
	// Checks that dates in non-standard form are equal to the canonical form.
	// There's no need to test the day, hour, minute, second, or microsecond fields because they are treated linearly in the code.
	@Test public void testLenientDates() {
		for (int i = 0; i < 1000000; i++) {
			int year = rand.nextInt(4000) - 1000;
			int month = rand.nextInt(12) + 1;
			int day = rand.nextInt(getMonthLength(year, month)) + 1;
			int n = rand.nextInt(30000) - 15000;  // Number of years to trade for multiples of 12 months
			assertEquals(
				WindowsTimestampAccessor.datetimeToTicks(new int[]{year, month, day, 0, 0, 0, 0}),
				WindowsTimestampAccessor.datetimeToTicks(new int[]{year + n, month - 12 * n, day, 0, 0, 0, 0}));
		}
	}
	
	
	/* Utilities */
	
	private static int getMonthLength(int y, int m) {
		if (m == 2 && isLeapYear(y))
			return 29;
		else
			return MONTH_LENGTHS[m];
	}
	
	
	private static boolean isLeapYear(int y) {
		return y % 400 == 0 || (y % 4 == 0 && y % 100 != 0);
	}
	
	
	private static Random rand = new Random();
	
	private static int[] MONTH_LENGTHS = {0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
	
}
