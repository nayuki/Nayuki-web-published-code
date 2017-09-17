/* 
 * Windows timestamp accessor (Java)
 * 
 * Copyright (c) 2017 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/windows-timestamp-accessor-library
 */

import java.io.BufferedReader;
import java.io.EOFException;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.math.BigInteger;


// Note: Ticks is the number of 100-nanosecond units since the epoch of midnight UTC on January 1st, Year 1 on the proleptic Gregorian calendar

public final class WindowsTimestampAccessor implements AutoCloseable {
	
	/*---- Object state ----*/
	
	private Process process;
	private PrintWriter query;
	private BufferedReader response;
	
	
	
	/*---- Initialization and disposal ----*/
	
	private static final String EXECUTABLE_PATH = "WindowsTimestampAccessor.exe";  // Assumes it is in the current working directory
	
	
	public WindowsTimestampAccessor() throws IOException {
		process = Runtime.getRuntime().exec(new String[]{EXECUTABLE_PATH});
		query = new PrintWriter(new OutputStreamWriter(process.getOutputStream(), "UTF-8"));
		response = new BufferedReader(new InputStreamReader(process.getInputStream(), "UTF-8"));
	}
	
	
	public synchronized void close() throws IOException, InterruptedException {
		query.close();
		response.close();
		if (process.waitFor() != 0)
			throw new RuntimeException("Subprocess exited with non-zero status code");
	}
	
	
	
	/*---- Methods to get/set file/directory timestamps ----*/
	
	public long getCreationTime(File item) throws IOException {
		return getSomeTime("Creation", item);
	}
	
	
	public long getModificationTime(File item) throws IOException {
		return getSomeTime("Modification", item);
	}
	
	
	public long getAccessTime(File item) throws IOException {
		return getSomeTime("Access", item);
	}
	
	
	private synchronized long getSomeTime(String type, File item) throws IOException {
		query.printf("Get%sTime\t%s%n", type, item.getAbsolutePath());
		query.flush();
		String line = response.readLine();
		if (line == null)
			throw new EOFException();
		String[] tokens = line.split("\t", -1);
		if (!tokens[0].equals("ok") || tokens.length != 2)
			throw new RuntimeException("Invalid data");
		return Long.parseLong(tokens[1]);
	}
	
	
	public void setCreationTime(File item, long ticks) throws IOException {
		setSomeTime("Creation", item, ticks);
	}
	
	
	public void setModificationTime(File item, long ticks) throws IOException {
		setSomeTime("Modification", item, ticks);
	}
	
	
	public void setAccessTime(File item, long ticks) throws IOException {
		setSomeTime("Access", item, ticks);
	}
	
	
	private synchronized void setSomeTime(String type, File item, long ticks) throws IOException {
		query.printf("Set%sTime\t%s\t%d%n", type, item.getAbsolutePath(), ticks);
		query.flush();
		String line = response.readLine();
		if (line == null)
			throw new EOFException();
		if (!line.equals("ok"))
			throw new RuntimeException("Invalid data");
	}
	
	
	
	/*---- DateTime/ticks conversion ----*/
	
	/* 
	 * Returns an array of 7 integers representing the date and time:
	 * - [0]: Year
	 * - [1]: Month, range [1, 12]
	 * - [2]: Day, range [1, 31]
	 * - [3]: Hour, range [0, 59]
	 * - [4]: Minute, range [0, 59]
	 * - [5]: Second, range [0, 59]
	 * - [6]: Microsecond, range [0, 999999]
	 */
	public static int[] ticksToDatetime(long ticks) {
		int[] result = new int[7];
		long temp = ticks;
		
		// Calculate sub-day units
		{
			long mod;
			mod = mod(temp, 10000000);  // Ticks modulo second
			result[6] = (int)(mod / 10);  // Microseconds
			long quot = temp / 10000000;  // Do flooring division and avoid overflow
			if (temp < 0 && quot * 10000000 != temp)
				quot--;
			temp = quot;
			
			mod = mod(temp, 60);
			result[5] = (int)mod;  // Seconds
			temp = (temp - mod) / 60;
			
			mod = mod(temp, 60);
			result[4] = (int)mod;  // Minutes
			temp = (temp - mod) / 60;
			
			mod = mod(temp, 24);
			result[3] = (int)mod;  // Hours
			temp = (temp - mod) / 24;
		}
		
		// Calculate years, months, days
		{
			int d = (int)temp + 306;
			int mod = mod(d, 146097);
			int y = (d - mod) / 146097 * 400;
			d = mod;
			y += Math.min(d / 36524, 3) * 100;
			d -= Math.min(d / 36524, 3) * 36524;
			y += d / 1461 * 4;
			d -= d / 1461 * 1461;
			y += Math.min(d / 365, 3);
			d -= Math.min(d / 365, 3) * 365;
			
			int m = 0;
			while (m < 11 && CUMULATIVE_DAYS[m + 1] <= d)
				m++;
			d = d - CUMULATIVE_DAYS[m] + 1;
			m += 3;
			if (m > 12) {
				y++;
				m -= 12;
			}
			
			result[0] = y;
			result[1] = m;
			result[2] = d;
		}
		
		return result;
	}
	
	
	// Takes an array of 7 integers representing the date and time: {year, month, day, hour, minute, second, microsecond}.
	// The method accepts lenient date-time representations (e.g. month 13 = January of the next year, hour -1 = 23 o'clock of the previous day).
	public static long datetimeToTicks(int... dt) {
		if (dt.length != 7)
			throw new IllegalArgumentException();
		
		long y = dt[0];
		long m = dt[1];
		
		// Reduce months
		m -= 3;
		long mmod = mod(m, 12);
		y += (m - mmod) / 12;
		m = mmod;
		
		// Reduce years
		long ymod = mod(y, 400);
		long days = (y - ymod) / 400 * 146097;
		y = ymod;
		
		days += y*365 + y/4 - y/100 + y/400 + (m * 153 + 2) / 5 + dt[2] - 307;
		
		// Accumulate sub-day units
		BigInteger result = BigInteger.valueOf(days);
		result = result.multiply(BigInteger.valueOf(24)).add(BigInteger.valueOf(dt[3]));  // Hours
		result = result.multiply(BigInteger.valueOf(60)).add(BigInteger.valueOf(dt[4]));  // Minutes
		result = result.multiply(BigInteger.valueOf(60)).add(BigInteger.valueOf(dt[5]));  // Seconds
		result = result.multiply(BigInteger.valueOf(1000000)).add(BigInteger.valueOf(dt[6]));  // Microseconds
		result = result.multiply(BigInteger.TEN);  // Ticks
		
		if (result.bitLength() >= 64)
			throw new ArithmeticException("Arithmetic overflow");
		return result.longValue();
	}
	
	
	private static int mod(int x, int y) {
		return (x % y + y) % y;
	}
	
	
	private static long mod(long x, long y) {
		return (x % y + y) % y;
	}
	
	
	private static int[] CUMULATIVE_DAYS = {0, 31, 61, 92, 122, 153, 184, 214, 245, 275, 306, 337};
	
}
