/* 
 * CRC-32 forcer (Java)
 * 
 * Copyright (c) 2015 Project Nayuki
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

import java.io.File;
import java.io.IOException;
import java.io.RandomAccessFile;


public class forcecrc32 {
	
	/*---- Main application ----*/
	
	public static void main(String[] args) {
		String errmsg = submain(args);
		if (errmsg != null) {
			System.err.println(errmsg);
			System.exit(1);
		}
	}
	
	
	private static String submain(String[] args) {
		// Handle arguments
		long offset;
		int newCrc;
		if (args.length != 3)
			return "Usage: java forcecrc32 FileName ByteOffset NewCrc32Value";
		try {
			offset = Long.parseLong(args[1]);
		} catch (NumberFormatException e) {
			return "Error: Invalid byte offset";
		}
		if (offset < 0)
			return "Error: Negative byte offset";
		try {
			if (args[2].length() != 8 || args[2].startsWith("+") || args[2].startsWith("-"))
				return "Error: Invalid new CRC-32 value";
			long temp = Long.parseLong(args[2], 16);
			if ((temp & 0xFFFFFFFFL) != temp)
				return "Error: Invalid new CRC-32 value";
			newCrc = Integer.reverse((int)temp);
		} catch (NumberFormatException e) {
			return "Error: Invalid new CRC-32 value";
		}
		File file = new File(args[0]);
		if (!file.isFile())
			return "Error: File does not exist: " + file;
		
		// Process the file
		try {
			modifyFileCrc32(file, offset, newCrc, true);
		} catch (IOException e) {
			return "I/O error: " + e.getMessage();
		} catch (IllegalArgumentException e) {
			return "Error: " + e.getMessage();
		} catch (AssertionError e) {
			return "Assertion error: " + e.getMessage();
		}
		return null;
	}
	
	
	/*---- Main function ----*/
	
	// Public library function.
	public static void modifyFileCrc32(File file, long offset, int newCrc, boolean printStatus) throws IOException {
		if (file == null)
			throw new NullPointerException();
		if (offset < 0)
			throw new IllegalArgumentException("Negative file offset");
		
		try (RandomAccessFile raf = new RandomAccessFile(file, "rws")) {
			if (offset + 4 > raf.length())
				throw new IllegalArgumentException("Byte offset plus 4 exceeds file length");
			
			// Read entire file and calculate original CRC-32 value
			int crc = getCrc32(raf);
			if (printStatus)
				System.out.printf("Original CRC-32: %08X%n", Integer.reverse(crc));
			
			// Compute the change to make
			int delta = crc ^ newCrc;
			delta = (int)multiplyMod(reciprocalMod(powMod(2, (raf.length() - offset) * 8)), delta & 0xFFFFFFFFL);
			
			// Patch 4 bytes in the file
			raf.seek(offset);
			byte[] bytes4 = new byte[4];
			raf.readFully(bytes4);
			for (int i = 0; i < bytes4.length; i++)
				bytes4[i] ^= Integer.reverse(delta) >>> (i * 8);
			raf.seek(offset);
			raf.write(bytes4);
			if (printStatus)
				System.out.println("Computed and wrote patch");
			
			// Recheck entire file
			if (getCrc32(raf) != newCrc)
				throw new AssertionError("Failed to update CRC-32 to desired value");
			else if (printStatus)
				System.out.println("New CRC-32 successfully verified");
		}
	}
	
	
	/*---- Utilities ----*/
	
	private static long POLYNOMIAL = 0x104C11DB7L;  // Generator polynomial. Do not modify, because there are many dependencies
	
	
	private static int getCrc32(RandomAccessFile raf) throws IOException {
		raf.seek(0);
		int crc = 0xFFFFFFFF;
		byte[] buffer = new byte[32 * 1024];
		while (true) {
			int n = raf.read(buffer);
			if (n == -1)
				return ~crc;
			for (int i = 0; i < n; i++) {
				for (int j = 0; j < 8; j++) {
					crc ^= (buffer[i] >>> j) << 31;
					if ((crc & (1 << 31)) != 0)
						crc = (crc << 1) ^ (int)POLYNOMIAL;
					else
						crc <<= 1;
				}
			}
		}
	}
	
	
	/*---- Polynomial arithmetic ----*/
	
	// Returns polynomial x multiplied by polynomial y modulo the generator polynomial.
	private static long multiplyMod(long x, long y) {
		// Russian peasant multiplication algorithm
		long z = 0;
		while (y != 0) {
			z ^= x * (y & 1);
			y >>>= 1;
			x <<= 1;
			if ((x & (1L << 32)) != 0)
				x ^= POLYNOMIAL;
		}
		return z;
	}
	
	
	// Returns polynomial x to the power of natural number y modulo the generator polynomial.
	private static long powMod(long x, long y) {
		// Exponentiation by squaring
		long z = 1;
		while (y != 0) {
			if ((y & 1) != 0)
				z = multiplyMod(z, x);
			x = multiplyMod(x, x);
			y >>>= 1;
		}
		return z;
	}
	
	
	// Computes polynomial x divided by polynomial y, returning the quotient and remainder.
	private static long[] divideAndRemainder(long x, long y) {
		if (y == 0)
			throw new IllegalArgumentException("Division by zero");
		if (x == 0)
			return new long[]{0, 0};
		
		int ydeg = getDegree(y);
		long z = 0;
		for (int i = getDegree(x) - ydeg; i >= 0; i--) {
			if ((x & (1 << (i + ydeg))) != 0) {
				x ^= y << i;
				z |= 1 << i;
			}
		}
		return new long[]{z, x};
	}
	
	
	// Returns the reciprocal of polynomial x with respect to the generator polynomial.
	private static long reciprocalMod(long x) {
		// Based on a simplification of the extended Euclidean algorithm
		long y = x;
		x = POLYNOMIAL;
		long a = 0;
		long b = 1;
		while (y != 0) {
			long[] divRem = divideAndRemainder(x, y);
			long c = a ^ multiplyMod(divRem[0], b);
			x = y;
			y = divRem[1];
			a = b;
			b = c;
		}
		if (x == 1)
			return a;
		else
			throw new IllegalArgumentException("Reciprocal does not exist");
	}
	
	
	private static int getDegree(long x) {
		return 63 - Long.numberOfLeadingZeros(x);
	}
	
}
