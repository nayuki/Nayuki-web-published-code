/* 
 * Fast DEFLATE implementation
 * 
 * Copyright (c) 2014 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/fast-deflate-implementation
 */

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.fail;
import java.io.ByteArrayInputStream;
import java.io.EOFException;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import org.junit.Test;
import java.util.Random;


public abstract class BitInputStreamTest {
	
	protected abstract BitInputStream newInstance(InputStream in);
	
	
	@Test
	public void testReadBytesAsBits() throws IOException {
		for (int i = 0; i < 1000; i++) {
			byte[] b = new byte[rand.nextInt(1024)];
			rand.nextBytes(b);
			
			BitInputStream in = newInstance(new ByteArrayInputStream(b));
			for (int j = 0; j < b.length; j++)
				assertEquals(b[j] & 0xFF, in.readBits(8));
			try {
				in.readBits(8);
				fail();
			} catch (EOFException e) {}  // Pass
		}
	}
	
	
	@Test
	public void testReadRandomBits() throws IOException {
		for (int i = 0; i < 1000; i++) {
			byte[] b = new byte[rand.nextInt(1024)];
			rand.nextBytes(b);
			
			BitInputStream in = newInstance(new ByteArrayInputStream(b));
			for (int off = 0; ; ) {  // Bit offset
				int n = rand.nextInt(33);
				if (off + n <= b.length * 8) {
					assertEquals(getBits(b, off, n), in.readBits(n));
					off += n;
				} else {
					try {
						in.readBits(n);
						fail();
					} catch (EOFException e) {
						break;  // Pass
					}
				}
			}
		}
	}
	
	
	@Test
	public void testReadBitsAndBytes() throws IOException {
		for (int i = 0; i < 1000; i++) {
			byte[] b = new byte[rand.nextInt(1024)];
			rand.nextBytes(b);
			
			BitInputStream in = newInstance(new ByteArrayInputStream(b));
			for (int off = 0; ; ) {  // Bit offset
				if (rand.nextDouble() < 0.7) {  // Read bits
					int n = rand.nextInt(33);
					if (off + n <= b.length * 8) {
						assertEquals(getBits(b, off, n), in.readBits(n));
						off += n;
					} else {
						try {
							in.readBits(n);
							fail();
						} catch (EOFException e) {
							break;  // Pass
						}
					}
					
				} else {  // Read bytes
					off = (off + 7) / 8 * 8;
					int n = rand.nextInt(64);
					byte[] actual = new byte[n + rand.nextInt(64)];  // Variable offset
					if (off / 8 + n <= b.length) {
						byte[] expected = Arrays.copyOfRange(b, off / 8, off / 8 + n);
						in.readBytes(actual, actual.length - n, n);
						assertArrayEquals(expected, Arrays.copyOfRange(actual, actual.length - n, actual.length));
						off += n * 8;
					} else {
						try {
							in.readBytes(actual, actual.length - n, n);
							fail();
						} catch (EOFException e) {
							break;  // Pass
						}
					}
				}
			}
		}
	}
	
	
	@Test
	public void testDetach() throws IOException {
		for (int i = 0; i < 1000; i++) {
			byte[] b = new byte[rand.nextInt(256)];
			rand.nextBytes(b);
			
			InputStream in0 = new ByteArrayInputStream(b);
			BitInputStream in1 = newInstance(in0);
			int toConsume = rand.nextInt(b.length + 1) * 8;  // In bits
			for (int off = 0; off <= toConsume - 8; ) {
				if (rand.nextDouble() < 0.7) {
					int n = rand.nextInt(33);
					if (off + n <= toConsume) {
						in1.readBits(n);
						off += n;
					}
				} else {
					off = (off + 7) / 8 * 8;
					int n = rand.nextInt(64);
					if (off + n * 8 <= toConsume) {
						in1.readBytes(new byte[n], 0, n);
						off += n * 8;
					} else
						in1.readBytes(new byte[0], 0, 0);
				}
			}
			
			assertSame(in0, in1.detach());
			for (int j = toConsume / 8; j < b.length; j++)
				assertEquals(b[j] & 0xFF, in0.read());
			assertEquals(-1, in0.read());
		}
	}
	
	
	private static int getBits(byte[] b, int off, int len) {
		int result = 0;
		for (int i = 0; i < len; i++)
			result |= ((b[(off + i) / 8] >>> ((off + i) % 8)) & 1) << i;
		return result;
	}
	
	
	protected static Random rand = new Random();
	
}
