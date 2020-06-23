/* 
 * Windows timestamp accessor demo (Java)
 * 
 * Copyright (c) 2020 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/windows-timestamp-accessor-library
 */

import java.io.File;
import java.io.IOException;


public final class WindowsTimestampAccessorDemo {
	
	/* 
	 * This program performs the following actions:
	 * 0. Prints the creation timestamp and modification timestamp of the current working directory.
	 * 1. Creates a file named Hello Java Timestamp.txt with:
	 *   - Creation time     = 2000-01-01 00:00:00 UTC
	 *   - Modification time = 2005-05-05 05:05:05 UTC
	 * 2. Creates a file named 你好ジャバ.txt with:
	 *   - Creation time     = 2014-09-21 01:23:45 UTC
	 *   - Modification time = 2014-09-21 12:34:56.789000 UTC
	 */
	public static void main(String[] args) throws IOException, InterruptedException {
		try (WindowsTimestampAccessor wt = new WindowsTimestampAccessor()) {
			File file;
			long ticks;
			
			// Action 0
			file = new File(".");
			System.out.println(file.getAbsolutePath());
			ticks = wt.getCreationTime(file);
			System.out.println(ticks + "    " + datetimeToString(WindowsTimestampAccessor.ticksToDatetime(ticks)));
			ticks = wt.getModificationTime(file);
			System.out.println(ticks + "    " + datetimeToString(WindowsTimestampAccessor.ticksToDatetime(ticks)));
			
			// Action 1
			file = new File("Hello Java Timestamp.txt");
			if (file.exists()) {
				if (file.length() > 0)
					throw new RuntimeException("File already exists");
			} else if (!file.createNewFile())
				throw new IOException("Failed to create file");
			wt.setCreationTime    (file, 630822816000000000L);
			wt.setModificationTime(file, 632508663050000000L);
			
			// Action 2
			file = new File("你好ジャバ.txt");
			if (file.exists()) {
				if (file.length() > 0)
					throw new RuntimeException("File already exists");
			} else if (!file.createNewFile())
				throw new IOException("Failed to create file");
			wt.setCreationTime    (file, WindowsTimestampAccessor.datetimeToTicks(2014, 9, 21,  1, 23, 45,      0));
			wt.setModificationTime(file, WindowsTimestampAccessor.datetimeToTicks(2014, 9, 21, 12, 34, 56, 789000));
		}
	}
	
	
	private static String datetimeToString(int[] dt) {
		if (dt.length != 7)
			throw new IllegalArgumentException();
		return String.format("%d-%02d-%02d-%s %02d:%02d:%02d.%06d",
			dt[0], dt[1], dt[2], DAYS_OF_WEEK[getDayOfWeek(dt)], dt[3], dt[4], dt[5], dt[6]);
	}
	
	
	// This algorithm requires m to be in the range [1,12], d in [1,31], and unrestricted y;
	// it is correct for all such inputs. Returns 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
	private static int getDayOfWeek(int[] ymd) {
		int m = ymd[1] + 4797;  // m in [4798,4809]
		int y = ymd[0] % 400 + m / 12;  // y in [0,799]
		return (y + y/4 - y/100 + y/400 + (m%12 * 13 + 2) / 5 + ymd[2] + 2) % 7;
	}
	
	
	private static final String[] DAYS_OF_WEEK = {"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"};
	
}
