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
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.zip.GZIPInputStream;


final class PageLinksList {
	
	public static int[] readSqlFile(File file, Map<String,Integer> idByTitle, Map<Integer,String> titleById) throws IOException {
		long startTime = System.currentTimeMillis();
		long[] rawlinks = new long[1];
		int rawlinksLen = 0;
		
		SqlReader in = new SqlReader(new BufferedReader(new InputStreamReader(new GZIPInputStream(new FileInputStream(file)), "UTF-8")), "pagelinks");
		try {
			while (true) {
				List<List<Object>> data = in.readInsertionTuples();
				if (data == null)
					break;
				
				for (List<Object> tuple : data) {
					if (tuple.size() != 3)
						throw new IllegalArgumentException();
					
					Object srcId = tuple.get(0);
					Object namespace = tuple.get(1);
					Object destTitle = tuple.get(2);
					if (!(srcId instanceof Integer && namespace instanceof Integer && destTitle instanceof String))
						throw new IllegalArgumentException();
					
					if (!(((Integer)namespace).intValue() == 0 && titleById.containsKey(srcId) && idByTitle.containsKey(destTitle)))
						continue;
					if (rawlinksLen == rawlinks.length) {
						if (rawlinksLen >= Integer.MAX_VALUE / 2)
							throw new OutOfMemoryError();
						rawlinks = Arrays.copyOf(rawlinks, rawlinks.length * 2);
					}
					rawlinks[rawlinksLen] = (long)idByTitle.get(destTitle) << 32 | (Integer)srcId;
					rawlinksLen++;
				}
				System.out.printf("\rParsing %s: %.3f million entries stored", file.getName(), rawlinksLen / 1000000.0);
			}
		} finally {
			in.close();
		}
		System.out.printf("\rParsing %s: %.3f million entries stored. Done (%.2f s)%n", file.getName(), rawlinksLen / 1000000.0, (System.currentTimeMillis() - startTime) / 1000.0);
		
		Arrays.sort(rawlinks, 0, rawlinksLen);
		int[] links = new int[1];
		int linksLen = 0;
		for (int i = 0; i < rawlinksLen; ) {
			int dest = (int)(rawlinks[i] >>> 32);
			int j = i + 1;
			for (; j < rawlinksLen && (int)(rawlinks[j] >>> 32) == dest; j++);
			while (linksLen + j - i + 2 >= links.length) {
				if (linksLen >= Integer.MAX_VALUE / 2)
					throw new OutOfMemoryError();
				links = Arrays.copyOf(links, links.length * 2);
			}
			links[linksLen++] = dest;
			links[linksLen++] = j - i;
			for (; i < j; i++)
				links[linksLen++] = (int)rawlinks[i];
		}
		
		return Arrays.copyOf(links, linksLen);
	}
	
	
	public static int[] readRawFile(File file) throws IOException {
		long startTime = System.currentTimeMillis();
		int[] result;
		DataInputStream in = new DataInputStream(new BufferedInputStream(new FileInputStream(file), 128 * 1024));
		try {
			int nextPrint = 0;
			result = new int[in.readInt()];
			for (int i = 0; i < result.length; i++) {
				if (i >= nextPrint) {
					System.out.printf("\rReading %s: %.1f of %.1f million raw items...", file.getName(), i / 1000000.0, result.length / 1000000.0);
					nextPrint += 100000;
				}
				result[i] = in.readInt();
			}
			System.out.printf("\rReading %s: %.1f of %.1f million raw items... Done (%.2f s)%n", file.getName(), result.length / 1000000.0, result.length / 1000000.0, (System.currentTimeMillis() - startTime) / 1000.0);
		} finally {
			in.close();
		}
		return result;
	}
	
	
	public static void writeRawFile(int[] links, File file) throws IOException {
		long startTime = System.currentTimeMillis();
		DataOutputStream out = new DataOutputStream(new BufferedOutputStream(new FileOutputStream(file), 128 * 1024));
		try {
			int nextPrint = 0;
			int i = 0;
			out.writeInt(links.length);
			for (int link : links) {
				if (i >= nextPrint) {
					System.out.printf("\rWriting %s: %.1f of %.1f million raw items...", file.getName(), i / 1000000.0, links.length / 1000000.0);
					nextPrint += 100000;
				}
				out.writeInt(link);
				i++;
			}
			System.out.printf("\rWriting %s: %.1f of %.1f million raw items... Done (%.2f s)%n", file.getName(), i / 1000000.0, links.length / 1000000.0, (System.currentTimeMillis() - startTime) / 1000.0);
		} finally {
			out.close();
		}
	}
	
	
	
	private PageLinksList() {}  // Not instantiable
	
}
