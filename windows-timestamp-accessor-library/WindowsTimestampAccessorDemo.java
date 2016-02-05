/* 
 * Windows timestamp accessor demo (Java)
 * 
 * Copyright (c) 2014 Project Nayuki
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
	 *   - Creation time = 2000-01-01 00:00:00 UTC
	 *   - Modification time = 2005-05-05 05:05:05 UTC
	 * 2. Creates a file named 你好ジャバ.txt with:
	 *   - Creation time = 2014-09-21 01:23:45 UTC
	 *   - Modification time = 2014-09-21 12:34:56.789000 UTC
	 */
	public static void main(String[] args) throws IOException, InterruptedException {
		WindowsTimestampAccessor wt = new WindowsTimestampAccessor();
		try {
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
			wt.setCreationTime(file, 630822816000000000L);
			wt.setModificationTime(file, 632508663050000000L);
			
			// Action 2
			file = new File("你好ジャバ.txt");
			if (file.exists()) {
				if (file.length() > 0)
					throw new RuntimeException("File already exists");
			} else if (!file.createNewFile())
				throw new IOException("Failed to create file");
			wt.setCreationTime(file, WindowsTimestampAccessor.datetimeToTicks(2014, 9, 21, 1, 23, 45, 0));
			wt.setModificationTime(file, WindowsTimestampAccessor.datetimeToTicks(2014, 9, 21, 12, 34, 56, 789000));
			
		} finally {
			wt.dispose();
		}
	}
	
	
	private static String datetimeToString(int[] dt) {
		if (dt.length != 7)
			throw new IllegalArgumentException();
		
		return String.format("%d-%02d-%02d-%s %02d:%02d:%02d.%06d",
			dt[0], dt[1], dt[2], DAYS_OF_WEEK[getDayOfWeek(dt)], dt[3], dt[4], dt[5], dt[6]);
	}
	
	
	private static int getDayOfWeek(int[] dt) {
		int y = dt[0];
		int m = dt[1];
		int d = dt[2];
		y = (y % 400 + 400) % 400;
		m = (int)((((long)m - 3) % 4800 + 4800) % 4800);
		y += m / 12;
		m %= 12;
		d = (d % 7 + 7) % 7;
		return (y + y/4 - y/100 + y/400 + (13*m+2)/5 + d + 2) % 7;
	}
	
	
	private static String[] DAYS_OF_WEEK = {"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"};
	
}
