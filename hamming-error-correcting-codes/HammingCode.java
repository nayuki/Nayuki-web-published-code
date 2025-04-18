/* 
 * Hamming error-correcting code (Java)
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

import java.util.Arrays;
import java.util.Objects;
import java.util.Optional;


public final class HammingCode {
	
	public final int messageLength;
	public final int codewordLength;
	private final int numParity;
	public final boolean hasExtraParity;
	
	
	public HammingCode(int msgLen, boolean extraParity) {
		if (msgLen < 1)
			throw new IllegalArgumentException("Message length too small");
		messageLength = msgLen;
		hasExtraParity = extraParity;
		
		int nParity = 2;
		for (; (1L << nParity) - 1 - nParity < msgLen; nParity++);
		numParity = nParity;
		long cwLen = (long)msgLen + nParity;
		if (extraParity)
			cwLen++;
		if (cwLen + (extraParity ? 0 : 1) > Integer.MAX_VALUE)
			throw new IllegalArgumentException("Codeword length too large");
		codewordLength = (int)cwLen;
	}
	
	
	public boolean[] encode(boolean[] msg) {
		Objects.requireNonNull(msg);
		if (msg.length != messageLength)
			throw new IllegalArgumentException("Message length mismatch");
		
		var tempCw = new boolean[codewordLength + (hasExtraParity ? 0 : 1)];
		{
			int i = 0;
			for (int j = 0; j < tempCw.length; j++) {
				if ((j & (j - 1)) != 0) {  // j is not 0 (extra parity bit) or power of 2 (Hamming parity bit)
					tempCw[j] = msg[i];
					i++;
				}
			}
			assert i == msg.length;
		}
		
		int syndrome = 0;
		for (int i = 0; i < tempCw.length; i++) {
			if (tempCw[i])
				syndrome ^= i;
		}
		for (int i = 0; i < numParity; i++)
			tempCw[1 << i] = ((syndrome >> i) & 1) != 0;
		boolean sum = false;
		for (boolean x : tempCw)
			sum ^= x;
		tempCw[0] = sum;
		
		return hasExtraParity ? tempCw : Arrays.copyOfRange(tempCw, 1, tempCw.length);
	}
	
	
	public DecodeResult decode(boolean[] cw) {
		Objects.requireNonNull(cw);
		if (cw.length != codewordLength)
			throw new IllegalArgumentException("Codeword length mismatch");
		
		var tempCw = new boolean[codewordLength + (hasExtraParity ? 0 : 1)];
		System.arraycopy(cw, 0, tempCw, (hasExtraParity ? 0 : 1), cw.length);
		
		boolean sum = false;
		int syndrome = 0;
		for (int i = 0; i < tempCw.length; i++) {
			sum ^= tempCw[i];
			if (tempCw[i])
				syndrome ^= i;
		}
		
		boolean error = hasExtraParity && sum;
		if (syndrome != 0) {
			error = true;
			if (syndrome >= tempCw.length || hasExtraParity && !sum)
				return new DecodeResult(Optional.empty(), true);
			tempCw[syndrome] ^= true;
		}
		
		var msg = new boolean[messageLength];
		int i = 0;
		for (int j = 0; j < tempCw.length; j++) {
			if ((j & (j - 1)) != 0) {
				msg[i] = tempCw[j];
				i++;
			}
		}
		assert i == msg.length;
		return new DecodeResult(Optional.of(msg), error);
	}
	
	
	
	public record DecodeResult(Optional<boolean[]> message, boolean hasError) {
		
		public DecodeResult {
			Objects.requireNonNull(message);
		}
		
		
		@Override public boolean equals(Object obj) {
			return obj instanceof DecodeResult other
				&& (message.isEmpty() && other.message.isEmpty()
					|| message.isPresent() && other.message.isPresent()
						&& Arrays.equals(message.get(), other.message.get()))
				&& hasError == other.hasError;
		}
		
		
		@Override public int hashCode() {
			return Objects.hash(hasError, (message.isEmpty() ? message : Arrays.hashCode(message.get())));
		}
		
		
		@Override public String toString() {
			var sb = new StringBuilder("DecodeResult(");
			if (message.isEmpty())
				sb.append("empty");
			else {
				for (boolean x : message.get())
					sb.append(x ? "1" : "0");
			}
			return sb.append(", ").append(hasError).append(")").toString();
		}
		
	}
	
}
