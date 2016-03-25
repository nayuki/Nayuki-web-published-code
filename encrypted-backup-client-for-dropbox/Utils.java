/* 
 * Utilities and crypto primitives for Dropbox backup utility
 * 
 * Copyright (c) 2016 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/encrypted-backup-client-for-dropbox
 */

package io.nayuki.dropboxbackup;

import static java.lang.Integer.rotateRight;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Arrays;


/* 
 * Miscellaneous shared simple utility functions shared by both main programs.
 */
final class Utils {
	
	// Tests whether the given byte array represents a valid Unicode string encoded in UTF-8.
	// This function correctly rejects overlong encodings and UTF-16 surrogate code points.
	public static boolean isValidUtf8(byte[] b) {
		for (int i = 0; i < b.length; ) {
			int c = b[i] & 0xFF;
			i++;
			int rest;   // Number of continuation bytes to consume
			int least;  // Code point must be at least this number to not be overlong
			int accum;  // Accumulator of code point bits
			if (c < 0x80)
				continue;
			else if (c < 0xC0)
				return false;
			else if (c < 0xE0) {
				rest = 1;
				least = 0x80; 
				accum = c & 0x1F;
			} else if (c < 0xF0) {
				rest = 2;
				least = 0x800;
				accum = c & 0x0F;
			} else if (c < 0xF8) {
				rest = 3;
				least = 0x10000;
				accum = c & 0x07;
			} else  // 0xF8 <= c <= 0xFF
				return false;
			
			for (; rest > 0; rest--, i++) {
				if (i >= b.length)
					return false;
				accum = accum << 6 | (b[i] & 0x3F);
			}
			if (accum < least || accum > 0x10FFFF || 0xD800 <= accum && accum <= 0xDFFF)
				return false;
		}
		return true;
	}
	
	
	// Converts the given hexadecimal string to a new byte array. The string must have
	// even length and only contain the characters 0 to 9, A to F (case-insensitive).
	public static byte[] hexToBytes(String s) {
		if (!s.matches("(?:[0-9A-Fa-f]{2})*"))
			throw new IllegalArgumentException("Invalid hexadecimal string");
		byte[] b = new byte[s.length() / 2];
		for (int i = 0; i < s.length(); i += 2)
			b[i / 2] = (byte)Integer.parseInt(s.substring(i, i + 2), 16);
		return b;
	}
	
	
	// Reverses all elements of the given array in place.
	public static void reverseArray(byte[] b) {
		for (int i = 0, j = b.length - 1; i < j; i++, j--) {
			byte temp = b[i];
			b[i] = b[j];
			b[j] = temp;
		}
	}
	
	
	// Packs the 4 bytes at the given offset into an int32 in big endian.
	public static int toInt32(byte[] b, int off) {
		return (b[off + 0] & 0xFF) << 24
		     | (b[off + 1] & 0xFF) << 16
		     | (b[off + 2] & 0xFF) <<  8
		     | (b[off + 3] & 0xFF) <<  0;
	}
	
}



/* 
 * The AES block cipher, supporting all three key lengths of {128, 192, 256} bits.
 * Note that the cipher object is stateless; i.e. encryptBlock() and decryptBlock()
 * produce the same output when given the same key and message, regardless of
 * any other data previously processed by the methods.
 */
final class Aes {
	
	public static final int KEY_LENGTH = 32;  // In bytes, for AES-256
	public static final int BLOCK_LENGTH = 16;  // In bytes
	
	
	private byte[][] keySchedule;
	
	
	public Aes(byte[] key) {
		if (key.length != 16 && key.length != 24 && key.length != 32)
			throw new IllegalArgumentException("Invalid key length");
		
		// Expand key into key schedule
		int nk = key.length / 4;
		int rounds = Math.max(nk, 4) + 6;
		int[] w = new int[(rounds + 1) * 4];  // Key schedule
		for (int i = 0; i < nk; i++)
			w[i] = Utils.toInt32(key, i * 4);
		byte rcon = 1;
		for (int i = nk; i < w.length; i++) {  // rcon = 2^(i/nk) mod 0x11B
			int tp = w[i - 1];
			if (i % nk == 0) {
				tp = subInt32Bytes(rotateRight(tp, 24)) ^ (rcon << 24);
				rcon = multiply(rcon, (byte)0x02);
			} else if (nk > 6 && i % nk == 4)
				tp = subInt32Bytes(tp);
			w[i] = w[i - nk] ^ tp;
		}
		
		// Pack into one 16-byte array per round
		keySchedule = new byte[w.length / 4][BLOCK_LENGTH];
		for (int i = 0; i < keySchedule.length; i++) {
			for (int j = 0; j < keySchedule[i].length; j++)
				keySchedule[i][j] = (byte)(w[i * 4 + j / 4] >>> ((3 - j % 4) * 8));
		}
	}
	
	
	// Encrypts one message block in place at the given offset.
	public void encryptBlock(byte[] msg, int off) {
		// Initial round
		byte[] temp0 = Arrays.copyOfRange(msg, off, off + BLOCK_LENGTH);
		addRoundKey(temp0, keySchedule[0]);
		byte[] temp1 = new byte[BLOCK_LENGTH];
		
		// Middle rounds
		for (int k = 1; k < keySchedule.length - 1; k++) {
			for (int i = 0; i < 4; i++) {  // Shift rows and sub bytes
				for (int j = 0; j < 4; j++)
					temp1[i + j * 4] = SBOX[temp0[i + (j + i) % 4 * 4] & 0xFF];
			}
			for (int i = 0; i < BLOCK_LENGTH; i += 4) {  // Mix columns
				for (int j = 0; j < 4; j++) {
					temp0[i + j] = (byte)(
						  multiply(temp1[i + (j + 0) % 4], (byte)0x02)
						^ multiply(temp1[i + (j + 1) % 4], (byte)0x03)
						^ multiply(temp1[i + (j + 2) % 4], (byte)0x01)
						^ multiply(temp1[i + (j + 3) % 4], (byte)0x01));
				}
			}
			addRoundKey(temp0, keySchedule[k]);
		}
		
		// Final round
		for (int i = 0; i < 4; i++) {  // Shift rows and sub bytes
			for (int j = 0; j < 4; j++)
				temp1[i + j * 4] = SBOX[temp0[i + (j + i) % 4 * 4] & 0xFF];
		}
		addRoundKey(temp1, keySchedule[keySchedule.length - 1]);
		System.arraycopy(temp1, 0, msg, off, temp1.length);
	}
	
	
	// Decrypts one message block in place at the given offset.
	public void decryptBlock(byte[] msg, int off) {
		// Initial round
		byte[] temp0 = Arrays.copyOfRange(msg, off, off + BLOCK_LENGTH);
		addRoundKey(temp0, keySchedule[keySchedule.length - 1]);
		byte[] temp1 = new byte[BLOCK_LENGTH];
		for (int i = 0; i < 4; i++) {  // Shift rows inverse and sub bytes inverse
			for (int j = 0; j < 4; j++)
				temp1[i + j * 4] = SBOX_INVERSE[temp0[i + (j - i + 4) % 4 * 4] & 0xFF];
		}
		
		// Middle rounds
		for (int k = keySchedule.length - 2; k >= 1; k--) {
			addRoundKey(temp1, keySchedule[k]);
			for (int i = 0; i < BLOCK_LENGTH; i += 4) {  // Mix columns inverse
				for (int j = 0; j < 4; j++) {
					temp0[i + j] = (byte)(
						  multiply(temp1[i + (j + 0) % 4], (byte)0x0E)
						^ multiply(temp1[i + (j + 1) % 4], (byte)0x0B)
						^ multiply(temp1[i + (j + 2) % 4], (byte)0x0D)
						^ multiply(temp1[i + (j + 3) % 4], (byte)0x09));
				}
			}
			for (int i = 0; i < 4; i++) {  // Shift rows inverse and sub bytes inverse
				for (int j = 0; j < 4; j++)
					temp1[i + j * 4] = SBOX_INVERSE[temp0[i + (j - i + 4) % 4 * 4] & 0xFF];
			}
		}
		
		// Final round
		addRoundKey(temp1, keySchedule[0]);
		System.arraycopy(temp1, 0, msg, off, temp1.length);
	}
	
	
	private static void addRoundKey(byte[] block, byte[] key) {
		for (int i = 0; i < BLOCK_LENGTH; i++)
			block[i] ^= key[i];
	}
	
	
	/* Utilities */
	
	private static byte[] SBOX = new byte[256];
	private static byte[] SBOX_INVERSE = new byte[256];
	
	// Initialize the S-box and inverse
	static {
		for (int i = 0; i < 256; i++) {
			byte tp = reciprocal((byte)i);
			byte s = (byte)(tp ^ rotateByteLeft(tp, 1) ^ rotateByteLeft(tp, 2)
				^ rotateByteLeft(tp, 3) ^ rotateByteLeft(tp, 4) ^ 0x63);
			SBOX[i] = s;
			SBOX_INVERSE[s & 0xFF] = (byte)i;
		}
	}
	
	
	private static byte multiply(byte x, byte y) {
		// Russian peasant multiplication
		byte z = 0;
		for (int i = 0; i < 8; i++) {
			z ^= x * ((y >>> i) & 1);
			x = (byte)((x << 1) ^ (((x >>> 7) & 1) * 0x11B));
		}
		return z;
	}
	
	
	private static byte reciprocal(byte x) {
		if (x == 0)
			return 0;
		else {
			for (byte y = 1; y != 0; y++) {
				if (multiply(x, y) == 1)
					return y;
			}
			throw new AssertionError();
		}
	}
	
	
	private static byte rotateByteLeft(byte x, int y) {
		if (y < 0 || y >= 8)
			throw new IllegalArgumentException("Input out of range");
		return (byte)((x << y) | ((x & 0xFF) >>> (8 - y)));
	}
	
	
	private static int subInt32Bytes(int x) {
		return (SBOX[x >>> 24 & 0xFF] & 0xFF) << 24
		     | (SBOX[x >>> 16 & 0xFF] & 0xFF) << 16
		     | (SBOX[x >>>  8 & 0xFF] & 0xFF) <<  8
		     | (SBOX[x >>>  0 & 0xFF] & 0xFF) <<  0;
	}
	
}



/* 
 * The SHA-256 hash function, also supporting HMAC.
 */
final class Sha256 {
	
	public static final int HASH_LENGTH = 32;  // In bytes
	private static final int BLOCK_LENGTH = 64;  // In bytes
	
	
	// Returns the SHA-256 hash of the given message array.
	public static byte[] getHash(byte[] msg) {
		if (msg.length > Integer.MAX_VALUE / 8)
			throw new IllegalArgumentException("Message too large for this implementation");
		
		// Add 1 byte for termination, 8 bytes for length, then round up to multiple of block size (64)
		byte[] padded = Arrays.copyOf(msg, (msg.length + 1 + 8 + 63) / 64 * 64);
		padded[msg.length] = (byte)0x80;
		for (int i = 0; i < 4; i++)
			padded[padded.length - 1 - i] = (byte)((msg.length * 8) >>> (i * 8));
		
		// Compress each block
		int[] state = {0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19};
		for (int off = 0; off < padded.length; off += 64) {
			int[] schedule = new int[64];
			for (int i = 0; i < 16; i++)
				schedule[i] = Utils.toInt32(padded, off + i * 4);
			for (int i = 16; i < 64; i++) {
				int x = schedule[i - 15];
				int y = schedule[i -  2];
				schedule[i] = schedule[i - 16] + schedule[i - 7] +
				              (rotateRight(x,  7) ^ rotateRight(x, 18) ^ (x >>>  3)) +
				              (rotateRight(y, 17) ^ rotateRight(y, 19) ^ (y >>> 10));
			}
			
			int a = state[0], b = state[1], c = state[2], d = state[3];
			int e = state[4], f = state[5], g = state[6], h = state[7];
			for (int i = 0; i < 64; i++) {
				int t1 = h + (rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25)) + ((e & f) ^ (~e & g)) + ROUND_CONSTS[i] + schedule[i];
				int t2 = (rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22)) + ((a & b) ^ (a & c) ^ (b & c));
				h = g;
				g = f;
				f = e;
				e = d + t1;
				d = c;
				c = b;
				b = a;
				a = t1 + t2;
			}
			state[0] += a; state[1] += b; state[2] += c; state[3] += d;
			state[4] += e; state[5] += f; state[6] += g; state[7] += h;
		}
		
		// Serialize state as result
		byte[] hash = new byte[state.length * 4];
		for (int i = 0; i < hash.length; i++)
			hash[i] = (byte)(state[i / 4] >>> ((3 - i % 4) * 8));
		return hash;
	}
	
	
	// Returns the HMAC-SHA-256 of the given message using the given key.
	public static byte[] getHmac(byte[] key, byte[] msg) {
		// Preprocess the key
		if (key.length > BLOCK_LENGTH)
			key = getHash(key);
		key = Arrays.copyOf(key, BLOCK_LENGTH);
		
		try {
			// Compute inner hash
			for (int i = 0; i < key.length; i++)
				key[i] ^= 0x36;
			ByteArrayOutputStream bout = new ByteArrayOutputStream();
			bout.write(key);
			bout.write(msg);
			byte[] innerHash = getHash(bout.toByteArray());
			
			// Compute outer hash
			for (int i = 0; i < key.length; i++)
				key[i] ^= 0x36 ^ 0x5C;
			bout = new ByteArrayOutputStream();
			bout.write(key);
			bout.write(innerHash);
			return getHash(bout.toByteArray());
			
		} catch (IOException e) {
			throw new AssertionError(e);
		}
	}
	
	
	private static final int[] ROUND_CONSTS = {
		0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
		0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
		0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
		0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
		0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
		0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
		0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
		0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2,
	};
	
}
