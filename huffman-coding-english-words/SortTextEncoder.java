/* 
 * Word-based sort coding encoder
 * 
 * Copyright (c) 2020 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/huffman-coding-english-words
 */

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;


public final class SortTextEncoder {
	
	public static void main(String[] args) throws IOException {
		// Check arguments
		if (args.length != 2) {
			System.err.println("Usage: java SortTextEncoder Input.txt Encoded.txt");
			System.exit(1);
		}
		
		// Tokenize input text file
		List<TextToken> tokens = TextTokenizer.tokenize(new File(args[0]));
		
		// Count word frequencies
		// e.g. {a:137, in:89, the:256}
		Map<String,Integer> wordFreq = new TreeMap<String,Integer>();  // Word keys are in ascending order
		for (TextToken tok : tokens) {
			if (tok.type >= 0 && tok.type <= 2) {  // Skip weird-case words because they must be escape-coded
				String key = tok.value.toLowerCase();  // Normalize to lowercase
				wordFreq.put(key, (wordFreq.containsKey(key) ? wordFreq.get(key) : 0) + 1);
			}
		}
		
		// Group words by frequency
		// e.g. {256:[the], 137:[a], 89:[in], 50:[if,is,on], ..., 2:[garden,little,sends,trolling,...]}
		// Frequency keys are in descending order; word list values are in ascending order
		TreeMap<Integer,List<String>> freqWord = new TreeMap<>(Collections.reverseOrder());
		for (String word : wordFreq.keySet()) {
			Integer freq = wordFreq.get(word);
			if (freq > 1) {  // Don't give codewords to hapax legomena (freq=1) for space efficiency reasons
				if (!freqWord.containsKey(freq))
					freqWord.put(freq, new ArrayList<String>());
				freqWord.get(freq).add(word);
			}
		}
		
		// Start writing output text file
		Writer out = new OutputStreamWriter(new BufferedOutputStream(new FileOutputStream(args[1])), StandardCharsets.UTF_8);
		try {
			// Build and write codebook
			out.write("a ESC\n");  // Hard-coded escape codeword prefix
			Map<String,String> wordToCodeword = new HashMap<String,String>();
			char[] nextCodeword = {'b'};  // The prefix "a" is reserved for escaped words, thus all other codes do not begin with "a"
			for (Integer freq : freqWord.keySet()) {
				for (String word : freqWord.get(freq)) {
					String codeword = new String(nextCodeword);
					wordToCodeword.put(word, codeword);
					out.write(codeword + " " + word + "\n");
					
					// Increment codeword, e.g. ba -> bb -> bc -> ... -> bz -> ca -> ...
					int i = nextCodeword.length - 1;
					while (i >= 0 && nextCodeword[i] == 'z') {
						nextCodeword[i] = 'a';
						i--;
					}
					if (i >= 0)
						nextCodeword[i]++;
					else {
						// Increment codeword length
						nextCodeword = new char[nextCodeword.length + 1];
						Arrays.fill(nextCodeword, 'a');
						nextCodeword[0] = 'b';
					}
				}
			}
			out.write("----------\n");  // End of codebook
			
			// Encode all input text tokens to output
			for (TextToken tok : tokens) {
				if (tok.type == 4) {  // Symbol
					out.write(tok.value);
					continue;
				}
				if (tok.type >= 0 && tok.type <= 2) {
					String key = tok.value.toLowerCase();
					if (wordToCodeword.containsKey(key)) {
						String code = wordToCodeword.get(key);
						if (tok.type == 1)
							code = code.substring(0, 1).toUpperCase() + code.substring(1).toLowerCase();  // To title case
						if (tok.type == 2) {
							if (code.length() >= 2)
								code = code.toUpperCase();
							else
								code = null;  // Not encodable, needs escape
						}
						if (code != null) {
							out.write(code);
							continue;
						}
					}
				}
				if (tok.type >= 0 && tok.type <= 3) {  // Escape
					out.write("a" + tok.value);
					continue;
				}
				throw new AssertionError();
			}
		} finally {
			out.close();
		}
	}
	
}
