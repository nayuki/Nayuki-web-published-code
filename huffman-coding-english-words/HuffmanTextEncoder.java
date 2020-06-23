/* 
 * Word-based Huffman coding encoder
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
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.Queue;
import java.util.TreeMap;


public final class HuffmanTextEncoder {
	
	public static void main(String[] args) throws IOException {
		// Check arguments
		if (args.length != 2) {
			System.err.println("Usage: java HuffmanTextEncoder Input.txt Encoded.txt");
			System.exit(1);
		}
		
		// Tokenize input text file
		List<TextToken> tokens = TextTokenizer.tokenize(new File(args[0]));
		
		// Build a Huffman codebook (decent but not necessarily optimal)
		Map<String,String> wordToCodeword = makeHuffmanCodebook(tokens);
		
		// Start writing output text file
		Writer out = new OutputStreamWriter(new BufferedOutputStream(new FileOutputStream(args[1])), StandardCharsets.UTF_8);
		try {
			// Build and write inverted codebook (looks neater for decoding)
			Map<String,String> codewordToWord = new TreeMap<String,String>();
			for (String word : wordToCodeword.keySet())
				codewordToWord.put(wordToCodeword.get(word), word);
			for (String codeword : codewordToWord.keySet())
				out.write(codeword + " " + codewordToWord.get(codeword) + "\n");
			out.write("----------\n");  // End of codebook
			
			// Encode input text tokens to output
			for (int i = 0; i < tokens.size(); i++) {
				TextToken tok = tokens.get(i);
				if (tok.type >= 0 && tok.type <= 3) {
					// Try to write whole word
					String word = tok.value;
					boolean nextIsSpace = i + 1 < tokens.size() && tokens.get(i + 1).value.equals(" ");
					if (nextIsSpace) {  // Try to fuse with next space
						String newWord = word + " ";
						if (wordToCodeword.containsKey(newWord)) {
							out.write(wordToCodeword.get(newWord));
							i++;
							continue;
						}
					}
					if (wordToCodeword.containsKey(word)) {
						out.write(wordToCodeword.get(word));
						continue;
					}
					
					// Write letter by letter
					for (int j = 0; j < word.length() - (nextIsSpace ? 1 : 0); j++) {  // Note: 'word' does not end with a space
						String letter = word.substring(j, j + 1);
						if (!wordToCodeword.containsKey(letter))
							throw new AssertionError();
						out.write(wordToCodeword.get(letter));
					}
					if (nextIsSpace) {
						String letter = word.substring(word.length() - 1);
						String letterSpace = letter + " ";
						if (wordToCodeword.containsKey(letterSpace)) {
							out.write(wordToCodeword.get(letterSpace));
							i++;
						} else if (wordToCodeword.containsKey(letter))
							out.write(wordToCodeword.get(letter));
						else
							throw new AssertionError();
					}
				} else if (tok.type == 4)  // Symbol
					out.write(tok.value);
				else
					throw new AssertionError();
			}
		} finally {
			out.close();
		}
	}
	
	
	private static Map<String,String> makeHuffmanCodebook(List<TextToken> tokens) {
		// Count word frequencies
		Map<String,Integer> wordFreq = new HashMap<String,Integer>();
		for (int i = 0; i < tokens.size(); i++) {
			TextToken tok = tokens.get(i);
			if (tok.type >= 0 && tok.type <= 3) {
				String word = tok.value;
				if (i + 1 < tokens.size() && tokens.get(i + 1).value.equals(" ")) {  // Fuse with next space
					word += " ";
					i++;
				}
				increment(wordFreq, word, 1);
			}
		}
		
		// Merge trailing-space words that have freq=1 with regular words
		Map<String,Integer> newWordFreq = new HashMap<String,Integer>();
		for (String word : wordFreq.keySet()) {
			int freq = wordFreq.get(word);
			if (word.endsWith(" ") && freq == 1)
				word = word.substring(0, word.length() - 1);
			increment(newWordFreq, word, freq);
		}
		wordFreq = newWordFreq;
		
		// Break words with freq=1 into constitutent letters but keep trailing space with last letter
		newWordFreq = new HashMap<String,Integer>();
		for (String word : wordFreq.keySet()) {
			int freq = wordFreq.get(word);
			if (freq > 1 || word.length() == 1)
				increment(newWordFreq, word, freq);
			else {
				boolean endsWithSpace = word.endsWith(" ");
				for (int i = 0; i < word.length() - (endsWithSpace ? 2 : 0); i++) {
					String letter = word.substring(i, i + 1);
					increment(newWordFreq, letter, 1);
				}
				if (endsWithSpace) {
					String letterSpace = word.substring(word.length() - 2);
					increment(newWordFreq, letterSpace, 1);
				}
			}
		}
		wordFreq = newWordFreq;
		
		// Merge trailing-space single letters that have freq=1 with regular letters
		newWordFreq = new TreeMap<String,Integer>();
		for (String word : wordFreq.keySet()) {
			int freq = wordFreq.get(word);
			if (freq == 1 && word.length() == 2 && word.endsWith(" "))
				word = word.substring(0, 1);
			increment(newWordFreq, word, freq);
		}
		wordFreq = newWordFreq;
		
		// Build codebook
		Map<String,String> wordToCodeword = new HashMap<String,String>();
		if (!wordFreq.isEmpty()) {
			// Build Huffman tree
			Queue<HuffmanNode> queue = new PriorityQueue<>();
			for (String word : wordFreq.keySet())
				queue.add(new LeafNode(word, wordFreq.get(word)));
			
			int order = 0;  // Number of internal nodes created
			do {
				// First iteration may take fewer than 52 children; subsequent iters always take 52
				int take = queue.size() % 51;
				if (take <= 1 && queue.size() >= 51)
					take += 51;
				List<HuffmanNode> children = new ArrayList<>();
				for (int i = 0; i < take; i++)
					children.add(queue.remove());
				Collections.reverse(children);
				
				// Construct the internal node
				InternalNode node = new InternalNode(order);
				for (int i = 0; i < children.size(); i++) {
					HuffmanNode child = children.get(i);
					node.children[i] = child;
					node.frequency += child.frequency;
				}
				queue.add(node);
				
				if (queue.size() % 51 != 1)  // Loop invariant for building good Huffman trees
					throw new AssertionError();
				order++;
			} while (queue.size() > 1);
			
			HuffmanNode root = queue.remove();
			buildCodebookFromTree(root, "", wordToCodeword);
		}
		return wordToCodeword;
	}
	
	
	private static void buildCodebookFromTree(HuffmanNode node, String prefix, Map<String,String> codebook) {
		if (node instanceof LeafNode) {
			if (prefix.equals(""))
				throw new IllegalArgumentException();
			codebook.put(((LeafNode)node).value, prefix);
		} else if (node instanceof InternalNode) {
			HuffmanNode[] children = ((InternalNode)node).children;
			for (int i = 0; i < 52; i++) {
				if (children[i] != null)
					buildCodebookFromTree(children[i], prefix + (char)(i < 26 ? 'A' + i : 'a' + i - 26), codebook);
			}
		} else
			throw new AssertionError();
	}
	
	
	private static <K> void increment(Map<K,Integer> map, K key, int val) {
		map.put(key, (map.containsKey(key) ? map.get(key) : 0) + val);
	}
	
	
	
	/* Huffman tree node classes */
	
	private static abstract class HuffmanNode implements Comparable<HuffmanNode> {
		
		public int frequency;
		
		
		public HuffmanNode(int freq) {
			frequency = freq;
		}
		
		
		public int compareTo(HuffmanNode other) {
			if (frequency != other.frequency)
				return Integer.compare(frequency, other.frequency);
			else if (this instanceof InternalNode && !(other instanceof InternalNode))
				return -1;
			else if (!(this instanceof InternalNode) && other instanceof InternalNode)
				return 1;
			else if (this instanceof InternalNode && other instanceof InternalNode)
				return Integer.compare(((InternalNode)this).order, ((InternalNode)other).order);
			else if (this instanceof LeafNode && other instanceof LeafNode)
				return ((LeafNode)this).value.compareTo(((LeafNode)other).value);
			else
				throw new AssertionError();
		}
		
	}
	
	
	
	private static final class InternalNode extends HuffmanNode {
		
		public HuffmanNode[] children;
		public int order;  // For tie-breaking
		
		
		public InternalNode(int order) {
			super(0);
			children = new HuffmanNode[52];
			this.order = order;
		}
		
	}
	
	
	
	private static final class LeafNode extends HuffmanNode {
		
		public String value;
		
		
		public LeafNode(String word, int freq) {
			super(freq);
			value = word;
		}
		
	}
	
}
