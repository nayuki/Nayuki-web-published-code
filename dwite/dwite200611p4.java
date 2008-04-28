import java.io.*;
import java.util.*;


// DWITE - November 2006 - Problem 4: Money Prize
public class dwite200611p4 {

	static final int HEIGHT = 8;
	static final int WIDTH = 8;
	
	
	
	@SuppressWarnings("unchecked")
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		int[][] money = new int[HEIGHT][WIDTH];
		for (int y = 0; y < HEIGHT; y++) {
			StringTokenizer st = new StringTokenizer(in.readLine(), " ");
			for (int x = 0; x < WIDTH; x++)
				money[y][x] = Integer.parseInt(st.nextToken());
		}
		
		List<Integer>[][] maxmoney = new List[HEIGHT][WIDTH];
		for (int y = HEIGHT - 1; y >= 0; y--) {
			for (int x = 0; x < WIDTH; x++) {
				maxmoney[y][x] = new ArrayList<Integer>();
				if (y == HEIGHT - 1 && x == 0)  // Bottom left, the starting cell
					maxmoney[y][x].add(money[y][x]);
				else {
					List<Integer> temp = new ArrayList<Integer>();
					if (x >= 1) temp.addAll(maxmoney[y][x - 1]);
					if (y < HEIGHT - 1) temp.addAll(maxmoney[y + 1][x]);
					
					Collections.sort(temp, Collections.reverseOrder());
					for (int i = 0; i < Math.min(5, temp.size()); i++)
						maxmoney[y][x].add(temp.get(i) + money[y][x]);
				}
			}
		}
		// At the end of the loop, each list in maxmoney is in descending order.
		
		List<Integer> end = maxmoney[0][WIDTH - 1];
		for (int i = 0; i < Math.min(5, end.size()); i++)
			out.println(end.get(i));
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