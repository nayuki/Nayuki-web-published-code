import java.io.*;
import java.util.*;


// DWITE - February 2005 - Problem 4: Matrix Chain Product
public class dwite200502p4 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		// Read the matrix dimensions
		List<Integer> dimensions = new ArrayList<Integer>();
		StringTokenizer st = new StringTokenizer(in.readLine(), " ");
		while (true) {
			int temp = Integer.parseInt(st.nextToken());
			if (temp == 0)
				break;
			dimensions.add(temp);
		}
		
		// mincost[i][j] is the minimum cost of multiplying the chain from i (inclusive) to j (inclusive)
		int[][] mincost = new int[dimensions.size() - 1][dimensions.size()];
		int[][] maxcost = new int[dimensions.size() - 1][dimensions.size()];
		
		// Mark uninitialized positions with -1
		for (int i = 0; i < mincost.length; i++) {
			for (int j = 0; j < mincost[i].length; j++) {
				mincost[i][j] = -1;
				maxcost[i][j] = -1;
			}
		}
		
		// The cost for multiplying a single matrix is zero
		for (int i = 0; i + 1 < dimensions.size(); i++) {
			mincost[i][i + 1] = 0;
			maxcost[i][i + 1] = 0;
		}
		
		// For each number of consecutive matrices
		for (int i = 2; i < dimensions.size(); i++) {
			// For each starting position
			for (int j = 0; j + i < dimensions.size(); j++) {
				int min = Integer.MAX_VALUE;
				int max = 0;
				// For each split position
				for (int k = 1; k < i; k++) {
					int cost = dimensions.get(j) * dimensions.get(j + k) * dimensions.get(j + i);  // The cost of the current operation
					min = Math.min(cost + mincost[j][j + k] + mincost[j + k][j + i], min);
					max = Math.max(cost + maxcost[j][j + k] + maxcost[j + k][j + i], max);
				}
				mincost[j][j + i] = min;
				maxcost[j][j + i] = max;
			}
		}
		
		out.printf("%d %d%n", mincost[0][dimensions.size() - 1], maxcost[0][dimensions.size() - 1]);
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