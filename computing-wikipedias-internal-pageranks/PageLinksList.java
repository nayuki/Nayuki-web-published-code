/* 
 * Computing Wikipedia's internal PageRanks
 * 
 * Copyright (c) 2020 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/computing-wikipedias-internal-pageranks
 */

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.zip.GZIPInputStream;


/* 
 * Provides static functions for working with page links data.
 */
final class PageLinksList {
	
	// Reads the given gzipped SQL file and returns a compressed list of page links.
	public static int[] readSqlFile(File file, Map<String,Integer> titleToId, Map<Integer,String> idToTitle) throws IOException {
		long startTime = System.currentTimeMillis();
		long[] rawlinks = new long[1];
		int rawlinksLen = 0;
		
		SqlReader in = new SqlReader(new BufferedReader(new InputStreamReader(new GZIPInputStream(new FileInputStream(file)), StandardCharsets.UTF_8)), "pagelinks");
		try {
			long lastPrint = System.currentTimeMillis() - PRINT_INTERVAL;
			while (true) {
				List<List<Object>> multipleRows = in.readInsertionTuples();
				if (multipleRows == null)
					break;
				
				for (List<Object> tuple : multipleRows) {
					// Get tuple fields
					if (tuple.size() != 3)
						throw new IllegalArgumentException("Incorrect number of columns");
					Object srcId = tuple.get(0);
					Object namespace = tuple.get(1);
					Object destTitle = tuple.get(2);
					
					// Check data format
					if (!(srcId instanceof Integer))
						throw new IllegalArgumentException("Source ID must be integer");
					if (!(namespace instanceof Integer))
						throw new IllegalArgumentException("Namespace must be integer");
					if (!(destTitle instanceof String))
						throw new IllegalArgumentException("Destination title must be string");
					if (!(((Integer)namespace).intValue() == 0 && idToTitle.containsKey(srcId) && titleToId.containsKey(destTitle)))
						continue;  // Skip if not in main namespace or either page entry not found
					
					// Append to dynamic array
					if (rawlinksLen == rawlinks.length) {
						if (rawlinksLen >= Integer.MAX_VALUE / 2)
							throw new RuntimeException("Array size too large");
						rawlinks = Arrays.copyOf(rawlinks, rawlinks.length * 2);
					}
					rawlinks[rawlinksLen] = (long)titleToId.get(destTitle) << 32 | (Integer)srcId;
					rawlinksLen++;
				}
				
				if (System.currentTimeMillis() - lastPrint >= PRINT_INTERVAL) {
					System.out.printf("\rParsing %s: %.3f million entries stored", file.getName(), rawlinksLen / 1000000.0);
					lastPrint = System.currentTimeMillis();
				}
			}
		} finally {
			in.close();
		}
		System.out.printf("\rParsing %s: %.3f million entries stored. Done (%.3f s)%n", file.getName(), rawlinksLen / 1000000.0, (System.currentTimeMillis() - startTime) / 1000.0);
		return postprocessLinks(rawlinks, rawlinksLen);
	}
	
	
	private static int[] postprocessLinks(long[] rawlinks, int rawlinksLen) {
		System.out.print("Postprocessing links...");
		long startTime = System.currentTimeMillis();
		Arrays.sort(rawlinks, 0, rawlinksLen);
		int[] links = new int[1];
		int linksLen = 0;
		for (int i = 0; i < rawlinksLen; ) {
			int dest = (int)(rawlinks[i] >>> 32);
			int j = i + 1;
			for (; j < rawlinksLen && (int)(rawlinks[j] >>> 32) == dest; j++);
			while (linksLen + j - i + 2 >= links.length) {
				if (linksLen >= Integer.MAX_VALUE / 2)
					throw new RuntimeException("Array size too large");
				links = Arrays.copyOf(links, links.length * 2);
			}
			links[linksLen++] = dest;
			links[linksLen++] = j - i;
			for (; i < j; i++)
				links[linksLen++] = (int)rawlinks[i];
		}
		links = Arrays.copyOf(links, linksLen);
		System.out.printf(" Done (%.3f s)%n", (System.currentTimeMillis() - startTime) / 1000.0);
		return links;
	}
	
	
	public static int[] readRawFile(File file) throws IOException {
		long startTime = System.currentTimeMillis();
		int[] result;
		DataInputStream in = new DataInputStream(new BufferedInputStream(new FileInputStream(file), 128 * 1024));
		try {
			long lastPrint = System.currentTimeMillis() - PRINT_INTERVAL;
			result = new int[in.readInt()];
			for (int i = 0; i < result.length; i++) {
				result[i] = in.readInt();
				
				if (System.currentTimeMillis() - lastPrint >= PRINT_INTERVAL) {
					System.out.printf("\rReading %s: %.3f of %.3f million raw items...", file.getName(), i / 1000000.0, result.length / 1000000.0);
					lastPrint = System.currentTimeMillis();
				}
			}
			System.out.printf("\rReading %s: %.3f of %.3f million raw items... Done (%.3f s)%n", file.getName(), result.length / 1000000.0, result.length / 1000000.0, (System.currentTimeMillis() - startTime) / 1000.0);
		} finally {
			in.close();
		}
		return result;
	}
	
	
	public static void writeRawFile(int[] links, File file) throws IOException {
		long startTime = System.currentTimeMillis();
		DataOutputStream out = new DataOutputStream(new BufferedOutputStream(new FileOutputStream(file), 128 * 1024));
		try {
			out.writeInt(links.length);
			int i = 0;
			long lastPrint = System.currentTimeMillis() - PRINT_INTERVAL;
			for (int link : links) {
				out.writeInt(link);
				i++;
				
				if (System.currentTimeMillis() - lastPrint >= PRINT_INTERVAL) {
					System.out.printf("\rWriting %s: %.3f of %.3f million raw items...", file.getName(), i / 1000000.0, links.length / 1000000.0);
					lastPrint = System.currentTimeMillis();
				}
			}
			System.out.printf("\rWriting %s: %.3f of %.3f million raw items... Done (%.3f s)%n", file.getName(), i / 1000000.0, links.length / 1000000.0, (System.currentTimeMillis() - startTime) / 1000.0);
		} finally {
			out.close();
		}
	}
	
	
	private static final int PRINT_INTERVAL = 30;  // In milliseconds
	
	
	private PageLinksList() {}  // Not instantiable
	
}
