import java.io.*;
import java.util.StringTokenizer;


// DWITE - November 2005 - Problem 4: Stacking Blocks
public class dwite200511p4 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		int[] minBlocks = new int[32001];  // minBlocks[i] is the minimum number of blocks to build a tower of height i
		minBlocks[0] = 0;
		for (int i = 1; i < minBlocks.length; i++)
			minBlocks[i] = Integer.MAX_VALUE / 2;
		
		int n = Integer.parseInt(in.readLine());
		for (int i = 0; i < n; i++) {
			StringTokenizer st = new StringTokenizer(in.readLine(), " ");
			int h = Integer.parseInt(st.nextToken());
			int m = Integer.parseInt(st.nextToken());
			update(minBlocks, h, m);
		}
		int t = Integer.parseInt(in.readLine());
		out.println(minBlocks[t]);
	}
	
	static void update(int[] minBlocks, int blockHeight, int blockCount) {
		for (int i = minBlocks.length - 1; i >= 0; i--) {
			if (minBlocks[i] == Integer.MAX_VALUE / 2)
				continue;
			for (int j = 1; j <= blockCount && i+j*blockHeight < minBlocks.length; j++) {
				minBlocks[i + j * blockHeight] = Math.min(minBlocks[i] + j, minBlocks[i + j * blockHeight]);
			}
		}
	}
	
	
	static String infile = "DATA41.txt";  // Specify null to use System.in
	static String outfile = "OUT41.txt";  // Specify null to use System.out
	
	public static void main(String[] args) throws IOException {
		InputStream in0;
		if (infile != null) in0 = new FileInputStream(infile);
		else in0 = System.in;
		Reader in1 = new InputStreamReader(in0, "US-ASCII");
		BufferedReader in = new BufferedReader(in1);
		
		OutputStream out0;
		if (outfile != null) out0 = new FileOutputStream(outfile);
		else out0 = System.out;
		Writer out1 = new OutputStreamWriter(out0, "US-ASCII");
		PrintWriter out = new PrintWriter(out1, true);
		
		main(in, out);
		
		in.close();
		in1.close();
		in0.close();
		out.close();
		out1.close();
		out0.close();
	}
	
}