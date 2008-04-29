import java.io.*;
import java.util.*;


// DWITE - December 2005 - Problem 5: How Many Sums
public class dwite200512p5 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	private static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		int total = Integer.parseInt(in.readLine());
		int n = Integer.parseInt(in.readLine());
		StringTokenizer st = new StringTokenizer(in.readLine(), " ");
		// 'instances' maps a number to the number of instances of it available
		Map<Integer,Integer> instances = new HashMap<Integer,Integer>();
		for (int i = 0; i < n; i++) {
			int x = Integer.parseInt(st.nextToken());
			if (!instances.containsKey(x))
				instances.put(x, 1);
			else
				instances.put(x, instances.get(x) + 1);
		}
		
		// Subset sum problem using dynamic programming
		int[] sums = new int[total + 1];
		sums[0] = 1;
		// For each number
		for (int x : instances.keySet()) {
			int inst = instances.get(x);
			// For each starting point
			for (int j = total; j >= 0; j--) {
				// For each number of instances
				for (int k = 1; k <= inst && j + k * x <= total; k++)
					sums[j + k * x] += sums[j];
			}
		}
		out.println(sums[total]);
	}
	
	
	
	private static String infile = "DATA51.txt";  // Specify null to use System.in
	private static String outfile = "OUT51.txt";  // Specify null to use System.out
	
	
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