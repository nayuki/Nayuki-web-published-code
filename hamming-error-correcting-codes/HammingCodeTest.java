/* 
 * Hamming error-correcting code test (Java)
 * 
 * Copyright (c) 2025 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/hamming-error-correcting-codes
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * - The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 * - The Software is provided "as is", without warranty of any kind, express or
 *   implied, including but not limited to the warranties of merchantability,
 *   fitness for a particular purpose and noninfringement. In no event shall the
 *   authors or copyright holders be liable for any claim, damages or other
 *   liability, whether in an action of contract, tort or otherwise, arising from,
 *   out of or in connection with the Software or the use or other dealings in the
 *   Software.
 */

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import java.util.Arrays;
import java.util.Optional;
import java.util.Random;
import org.junit.Test;


public final class HammingCodeTest {
	
	@Test public void test3_1() {
		var ham = new HammingCode(1, false);
		// All encodings
		assertArrayEquals(ba("000"), ham.encode(ba("0")));
		assertArrayEquals(ba("111"), ham.encode(ba("1")));
		
		// All decodings
		record Case(String cw, String msg, boolean error) {}
		Case[] CASES = {
			new Case("000", "0", false),
			new Case("100", "0", true ),
			new Case("010", "0", true ),
			new Case("001", "0", true ),
			new Case("111", "1", false),
			new Case("011", "1", true ),
			new Case("101", "1", true ),
			new Case("110", "1", true ),
		};
		for (Case cs : CASES) {
			var expect = new HammingCode.DecodeResult(Optional.of(ba(cs.msg)), cs.error);
			assertEquals(expect, ham.decode(ba(cs.cw)));
		}
	}
	
	
	@Test public void test7_4() {
		var ham = new HammingCode(4, false);
		// All encodings
		String[][] CASES = {
			{"0000", "0000000"},
			{"1000", "1110000"},
			{"0100", "1001100"},
			{"0010", "0101010"},
			{"0001", "1101001"},
			{"1100", "0111100"},
			{"1010", "1011010"},
			{"1001", "0011001"},
			{"0110", "1100110"},
			{"0101", "0100101"},
			{"0011", "1000011"},
			{"1110", "0010110"},
			{"1101", "1010101"},
			{"1011", "0110011"},
			{"0111", "0001111"},
			{"1111", "1111111"},
		};
		for (String[] cs : CASES)
			assertArrayEquals(ba(cs[1]), ham.encode(ba(cs[0])));
		
		// All decodings
		for (int i = 0; i < 1 << ham.messageLength; i++) {  // All messages
			var msg = new boolean[ham.messageLength];
			for (int j = 0; j < msg.length; j++)
				msg[j] = ((i >> j) & 1) != 0;
			boolean[] cw = ham.encode(msg);
			var expect = new HammingCode.DecodeResult(Optional.of(msg), false);
			assertEquals(expect, ham.decode(cw));
			for (int j = 0; j < ham.codewordLength; j++) {  // All 1-bit perturbations
				boolean[] newCw = cw.clone();
				newCw[j] ^= true;
				expect = new HammingCode.DecodeResult(Optional.of(msg), true);
				assertEquals(expect, ham.decode(newCw));
			}
		}
	}
	
	
	@Test public void testImperfectDecodeRefused() {
		record Case(int msgLen, String cw) {}
		Case[] CASES = {
			new Case(2, "00101"),
			new Case(2, "01010"),
			new Case(3, "100001"),
			new Case(3, "010010"),
			new Case(3, "001100"),
			new Case(3, "110100"),
			new Case(5, "010000010"),
			new Case(5, "001000010"),
			new Case(5, "000100010"),
			new Case(5, "000010010"),
			new Case(5, "000001010"),
			new Case(5, "000000110"),
			new Case(5, "001000001"),
		};
		for (Case cs : CASES) {
			var ham = new HammingCode(cs.msgLen, false);
			var expect = new HammingCode.DecodeResult(Optional.empty(), true);
			assertEquals(expect, ham.decode(ba(cs.cw)));
		}
	}
	
	
	@Test public void testPerfectRandomly() {
		final int TRIALS = 100;
		for (int i = 2; i < 10; i++) {
			var ham = new HammingCode((1 << i) - i - 1, false);
			assertEquals((1 << i) - 1, ham.codewordLength);
			for (int j = 0; j < TRIALS; j++) {
				var cw = new boolean[ham.codewordLength];
				for (int k = 0; k < cw.length; k++)
					cw[k] = rand.nextBoolean();
				assertTrue(ham.decode(cw).message().isPresent());
			}
		}
	}
	
	
	@Test public void testRandomlyWithoutExtraParity() {
		final int TRIALS = 1_000;
		for (int iter = 0; iter < TRIALS; iter++) {
			var ham = new HammingCode(rand.nextInt(1000) + 1, false);
			var inMsg = new boolean[ham.messageLength];
			for (int k = 0; k < inMsg.length; k++)
				inMsg[k] = rand.nextBoolean();
			boolean[] cw = ham.encode(inMsg);
			var expect = new HammingCode.DecodeResult(Optional.of(inMsg), false);
			assertEquals(expect, ham.decode(cw));
			boolean[] newCw = cw.clone();
			
			// 1-bit perturbation is decodable
			int i = rand.nextInt(ham.codewordLength);
			newCw[i] ^= true;
			expect = new HammingCode.DecodeResult(Optional.of(inMsg), true);
			assertEquals(expect, ham.decode(newCw));
			
			// 2-bit perturbation is detectable and causes refused or wrong decoding
			assert ham.codewordLength >= 2;
			int j;
			do j = rand.nextInt(ham.codewordLength);
			while (j == i);
			newCw[j] ^= true;
			HammingCode.DecodeResult result = ham.decode(newCw);
			assertTrue(result.hasError());
			assertTrue(result.message().isEmpty() || !Arrays.equals(result.message().get(), inMsg));
		}
	}
	
	
	@Test public void testRandomlyWithExtraParity() {
		final int TRIALS = 1_000;
		for (int iter = 0; iter < TRIALS; iter++) {
			var ham = new HammingCode(rand.nextInt(1000) + 1, true);
			var inMsg = new boolean[ham.messageLength];
			for (int k = 0; k < inMsg.length; k++)
				inMsg[k] = rand.nextBoolean();
			boolean[] cw = ham.encode(inMsg);
			var expect = new HammingCode.DecodeResult(Optional.of(inMsg), false);
			assertEquals(expect, ham.decode(cw));
			boolean[] newCw = cw.clone();
			
			// 1-bit perturbation is decodable
			int i = rand.nextInt(ham.codewordLength);
			newCw[i] ^= true;
			expect = new HammingCode.DecodeResult(Optional.of(inMsg), true);
			assertEquals(expect, ham.decode(newCw));
			
			// 2-bit perturbation is detectable and causes refused decoding
			assert ham.codewordLength >= 2;
			int j;
			do j = rand.nextInt(ham.codewordLength);
			while (j == i);
			newCw[j] ^= true;
			expect = new HammingCode.DecodeResult(Optional.empty(), true);
			assertEquals(expect, ham.decode(newCw));
			
			// 3-bit perturbation is detectable and causes refused or wrong decoding
			assert ham.codewordLength >= 3;
			int k;
			do k = rand.nextInt(ham.codewordLength);
			while (k == i || k == j);
			newCw[k] ^= true;
			HammingCode.DecodeResult result = ham.decode(newCw);
			assertTrue(result.hasError());
			assertTrue(result.message().isEmpty() || !Arrays.equals(result.message().get(), inMsg));
		}
	}
	
	
	
	private static boolean[] ba(String s) {
		var result = new boolean[s.length()];
		for (int i = 0; i < result.length; i++) {
			result[i] = switch(s.charAt(i)) {
				case '0' -> false;
				case '1' -> true;
				default -> throw new IllegalArgumentException();
			};
		}
		return result;
	}
	
	
	private static Random rand = new Random();
	
}
