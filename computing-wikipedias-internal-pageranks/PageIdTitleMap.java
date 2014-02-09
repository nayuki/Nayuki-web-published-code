/* 
 * Computing Wikipedia's internal PageRanks
 * 
 * Copyright (c) 2014 Nayuki Minase
 * All rights reserved. Contact Nayuki for licensing.
 * http://nayuki.eigenstate.org/page/computing-wikipedias-internal-pageranks
 */

import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.GZIPInputStream;


final class PageIdTitleMap {
	
	public static Map<String,Integer> readSqlFile(File file) throws IOException {
		long startTime = System.currentTimeMillis();
		Map<String,Integer> result = new HashMap<String,Integer>();
		
		SqlReader in = new SqlReader(new BufferedReader(new InputStreamReader(new GZIPInputStream(new FileInputStream(file)), "UTF-8")), "page");
		try {
			while (true) {
				List<List<Object>> data = in.readInsertionTuples();
				if (data == null)
					break;
				
				for (List<Object> tuple : data) {
					if (tuple.size() != 12)
						throw new IllegalArgumentException();
					
					Object namespace = tuple.get(1);
					if (!(namespace instanceof Integer))
						throw new IllegalArgumentException();
					if (((Integer)namespace).intValue() != 0)
						continue;
					
					Object id = tuple.get(0);
					Object title = tuple.get(2);
					if (!(id instanceof Integer && title instanceof String))
						throw new IllegalArgumentException();
					if (result.containsKey(title))
						throw new IllegalArgumentException();
					result.put((String)title, (Integer)id);
				}
				System.out.printf("\rParsing %s: %.3f million entries stored...", file.getName(), result.size() / 1000000.0);
			}
		} finally {
			in.close();
		}
		
		System.out.printf("\rParsing %s: %.3f million entries stored... Done (%.2f s)%n", file.getName(), result.size() / 1000000.0, (System.currentTimeMillis() - startTime) / 1000.0);
		return result;
	}
	
	
	public static Map<String,Integer> readRawFile(File file) throws IOException {
		long startTime = System.currentTimeMillis();
		Map<String,Integer> result = new HashMap<String,Integer>();
		BufferedReader in = new BufferedReader(new InputStreamReader(new FileInputStream(file), "UTF-8"));
		int nextPrint = 0;
		try {
			for (int i = 0; ; i++) {
				String line = in.readLine();
				if (line == null)
					break;
				if (i >= nextPrint) {
					System.out.printf("\rReading %s: %.1f million entries...", file.getName(), i / 1000000.0);
					nextPrint += 100000;
				}
				result.put(line, new Integer(in.readLine()));
			}
			System.out.printf("\rReading %s: %.1f million entries... Done (%.2f s)%n", file.getName(), result.size() / 1000000.0, (System.currentTimeMillis() - startTime) / 1000.0);
		} finally {
			in.close();
		}
		return result;
	}
	
	
	public static void writeRawFile(Map<String,Integer> idByTitle, File file) throws IOException {
		long startTime = System.currentTimeMillis();
		PrintWriter out = new PrintWriter(new OutputStreamWriter(new BufferedOutputStream(new FileOutputStream(file), 128 * 1024), "UTF-8"));
		try {
			int nextPrint = 0;
			int i = 0;
			for (String title : idByTitle.keySet()) {
				if (i >= nextPrint) {
					System.out.printf("\rWriting %s: %.1f million entries...", file.getName(), i / 1000000.0);
					nextPrint += 100000;
				}
				out.println(title);
				out.println(idByTitle.get(title));
				i++;
			}
			System.out.printf("\rWriting %s: %.1f million entries... Done (%.2f s)%n", file.getName(), i / 1000000.0, (System.currentTimeMillis() - startTime) / 1000.0);
		} finally {
			out.close();
		}
	}
	
	
	public static <K,V> Map<V,K> reverseMap(Map<K,V> map) {
		Map<V,K> result = new HashMap<V,K>();
		for (K key : map.keySet())
			result.put(map.get(key), key);
		return result;
	}
	
	
	
	private PageIdTitleMap() {}  // Not instantiable
	
}
