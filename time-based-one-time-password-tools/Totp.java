/* 
 * Time-based One-Time Password tools (Java)
 * 
 * Copyright (c) 2020 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/time-based-one-time-password-tools
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

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.Objects;
import org.junit.Assert;
import org.junit.Test;


public final class Totp {
	
	/*---- Main program ----*/
	
	public static void main(String[] args) {
		if (args.length != 1) {
			System.err.println("Usage: java Totp SecretKey");
			System.exit(1);
			return;
		}
		
		byte[] secretKey = decodeBase32(args[0]);
		String code;
		try {
			long timestamp = Math.floorDiv(System.currentTimeMillis(), 1000);
			code = calcTotp(secretKey, 0, 30, timestamp, 6, "SHA-1", 64);
		} catch (NoSuchAlgorithmException e) {
			// Algorithm "SHA-1" is guaranteed to exist
			throw new AssertionError(e);
		}
		System.out.println(code);
	}
	
	
	private static byte[] decodeBase32(String str) {
		ByteArrayOutputStream result = new ByteArrayOutputStream();
		int bits = 0;
		int bitsLen = 0;
		for (int i = 0; i < str.length(); i++) {
			char c = str.charAt(i);
			if (c == ' ')
				continue;
			int j = BASE32_ALPHABET.indexOf(Character.toUpperCase(c));
			if (j == -1)
				throw new IllegalArgumentException("Invalid Base32 string");
			bits = (bits << 5) | j;
			bitsLen += 5;
			if (bitsLen >= 8) {
				bitsLen -= 8;
				result.write(bits >>> bitsLen);
				bits &= (1 << bitsLen) - 1;
			}
		}
		return result.toByteArray();
	}
	
	
	
	/*---- Library functions ----*/
	
	// Time-based One-Time Password algorithm (RFC 6238)
	public static String calcTotp(
			byte[] secretKey,
			long epoch,
			int timeStep,
			long timestamp,
			int codeLen,
			String hashFunc,
			int blockSize)
			throws NoSuchAlgorithmException {
		
		// Calculate counter and HOTP
		long timeCounter = Math.floorDiv(timestamp - epoch, timeStep);
		byte[] counter = new byte[8];
		for (int i = counter.length - 1; i >= 0; i--, timeCounter >>>= 8)
			counter[i] = (byte)timeCounter;
		return calcHotp(secretKey, counter, codeLen, hashFunc, blockSize);
	}
	
	
	// HMAC-based One-Time Password algorithm (RFC 4226)
	public static String calcHotp(
			byte[] secretKey,
			byte[] counter,
			int codeLen,
			String hashFunc,
			int blockSize)
			throws NoSuchAlgorithmException {
		
		// Check argument, calculate HMAC
		if (!(1 <= codeLen && codeLen <= 9))
			throw new IllegalArgumentException("Invalid number of digits");
		byte[] hash = calcHmac(secretKey, counter, hashFunc, blockSize);
		
		// Dynamically truncate the hash value
		int offset = hash[hash.length - 1] & 0xF;
		int val = 0;
		for (int i = 0; i < 4; i++)
			val |= (hash[offset + i] & 0xFF) << ((3 - i) * 8);
		val &= 0x7FFFFFFF;
		
		// Extract and format base-10 digits
		int tenPow = 1;
		for (int i = 0; i < codeLen; i++)
			tenPow *= 10;
		return String.format("%0" + codeLen + "d", val % tenPow);
	}
	
	
	private static byte[] calcHmac(
			byte[] key,
			byte[] message,
			String hashFunc,
			int blockSize)
			throws NoSuchAlgorithmException {
		
		Objects.requireNonNull(key);
		Objects.requireNonNull(message);
		Objects.requireNonNull(hashFunc);
		if (blockSize < 1)
			throw new IllegalArgumentException("Invalid block size");
		
		if (key.length > blockSize)
			key = MessageDigest.getInstance(hashFunc).digest(key);
		key = Arrays.copyOf(key, blockSize);
		
		byte[] innerMsg = new byte[key.length + message.length];
		for (int i = 0; i < key.length; i++)
			innerMsg[i] = (byte)(key[i] ^ 0x36);
		System.arraycopy(message, 0, innerMsg, key.length, message.length);
		byte[] innerHash = MessageDigest.getInstance(hashFunc).digest(innerMsg);
		
		byte[] outerMsg = new byte[key.length + innerHash.length];
		for (int i = 0; i < key.length; i++)
			outerMsg[i] = (byte)(key[i] ^ 0x5C);
		System.arraycopy(innerHash, 0, outerMsg, key.length, innerHash.length);
		return MessageDigest.getInstance(hashFunc).digest(outerMsg);
	}
	
	
	private static final String BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
	
	
	
	/*---- Test suite ----*/
	
	@Test public void testHotp() throws NoSuchAlgorithmException {
		final String[][] CASES = {
			{"0", "284755224"},
			{"1", "094287082"},
			{"2", "137359152"},
			{"3", "726969429"},
			{"4", "640338314"},
			{"5", "868254676"},
			{"6", "918287922"},
			{"7", "082162583"},
			{"8", "673399871"},
			{"9", "645520489"},
		};
		final byte[] SECRET_KEY = "12345678901234567890".getBytes(StandardCharsets.UTF_8);
		
		for (String[] cs : CASES) {
			long counter = Long.parseLong(cs[0]);
			byte[] counterBytes = new byte[8];
			for (int i = counterBytes.length - 1; i >= 0; i--, counter >>>= 8)
				counterBytes[i] = (byte)counter;
			String actual = calcHotp(SECRET_KEY, counterBytes, 9, "SHA-1", 64);
			Assert.assertEquals(cs[1], actual);
		}
	}
	
	
	@Test public void testTotp() throws NoSuchAlgorithmException {
		final String[][] CASES = {
			{         "59", "94287082", "46119246", "90693936"},
			{ "1111111109", "07081804", "68084774", "25091201"},
			{ "1111111111", "14050471", "67062674", "99943326"},
			{ "1234567890", "89005924", "91819424", "93441116"},
			{ "2000000000", "69279037", "90698825", "38618901"},
			{"20000000000", "65353130", "77737706", "47863826"},
		};
		final byte[][] SECRET_KEYS = {
			"12345678901234567890".getBytes(StandardCharsets.UTF_8),
			"12345678901234567890123456789012".getBytes(StandardCharsets.UTF_8),
			"1234567890123456789012345678901234567890123456789012345678901234".getBytes(StandardCharsets.UTF_8),
		};
		
		for (String[] cs : CASES) {
			long timestamp = Long.parseLong(cs[0]);
			Assert.assertEquals(cs[1], calcTotp(SECRET_KEYS[0], 0, 30, timestamp, 8, "SHA-1"  ,  64));
			Assert.assertEquals(cs[2], calcTotp(SECRET_KEYS[1], 0, 30, timestamp, 8, "SHA-256",  64));
			Assert.assertEquals(cs[3], calcTotp(SECRET_KEYS[2], 0, 30, timestamp, 8, "SHA-512", 128));
		}
	}
	
}
