/* 
 * Text tokenizer
 * 
 * Copyright (c) 2014 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * http://www.nayuki.io/page/huffman-coding-english-words
 */

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.ArrayList;
import java.util.List;


// Tokenizes a string into words (consecutive letters) and single-character non-letters (space, symbols, numbers, etc.).
// Note that two words are never consecutive because word tokenization is greedy.
final class TextTokenizer {
	
	/* Convenience functions */
	
	public static List<TextToken> tokenize(File file) throws IOException {
		return tokenize(readAll(file));
	}
		
	
	public static List<TextToken> tokenize(String text) {
		List<TextToken> result = new ArrayList<TextToken>();
		TextTokenizer toker = new TextTokenizer(text);
		while (true) {
			TextToken tok = toker.next();
			if (tok == null)
				break;
			result.add(tok);
		}
		return result;
	}
	
	
	private static String readAll(File file) throws IOException {
		StringBuilder sb = new StringBuilder();
		Reader in = new InputStreamReader(new BufferedInputStream(new FileInputStream(file)), "UTF-8");
		try {
			while (true) {
				int c = in.read();
				if (c == -1)
					break;
				sb.append((char)c);
			}
		} finally {
			in.close();
		}
		return sb.toString();
	}
	
	
	/* Core tokenizer logic */
	
	private final String text;
	private int offset;
	
	
	public TextTokenizer(String text) {
		this.text = text;
		offset = 0;
	}
	
	
	public TextToken next() {
		if (offset == text.length())
			return null;
		
		int start = offset;
		offset++;
		if (isLetter(text.charAt(start))) {
			while (offset < text.length() && isLetter(text.charAt(offset)))
				offset++;
		}
		return new TextToken(text.substring(start, offset));
	}
	
	
	private static boolean isLetter(char c) {
		return c >= 'A' && c <= 'Z' || c >= 'a' && c <= 'z';
	}
	
}



final class TextToken {
	
	/* 
	 * Types:
	 * - 0: lowercaseword
	 * - 1: Titlecaseword
	 * - 2: UPPERCASEWORD
	 * - 3: WeIrDcaSEWord
	 * - 4: Non-letter single character
	 * Note: A single-letter uppercase word is considered to be title case instead of uppercase 
	 */
	public final int type;
	
	public final String value;
	
	
	public TextToken(String val) {
		value = val;
		if      (value.matches("[a-z]+"     )) type = 0;
		else if (value.matches("[A-Z][a-z]*")) type = 1;
		else if (value.matches("[A-Z]+"     )) type = 2;
		else if (value.matches("[A-Za-z]+"  )) type = 3;
		else                                   type = 4;
	}
	
}
