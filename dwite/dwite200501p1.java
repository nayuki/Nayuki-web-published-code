import java.io.*;
import java.util.*;


// DWITE - January 2005 - Problem 1: DWITE Golf Tournament
public class dwite200501p1 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		int n = Integer.parseInt(in.readLine());
		ArrayList<Golfer> golfers = new ArrayList<Golfer>();
		for (int i = 0; i < n; i++) {
			String name = in.readLine();
			int score = 0;
			for (int j = 0; j < 9; j++)
				score += Integer.parseInt(in.readLine());
			golfers.add(new Golfer(name, score));
		}
		
		Collections.sort(golfers);
		for (int i = 0; i < 5; i++)
			out.println(golfers.get(i).name + " " + golfers.get(i).score);
	}
	
	
	static String infile = "DATA11.txt";  // Specify null to use System.in
	static String outfile = "OUT11.txt";  // Specify null to use System.out
	
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
	
	
	
	static class Golfer implements Comparable<Golfer> {
		
		String name;
		int score;
		
		
		Golfer(String name, int score) {
			this.name = name;
			this.score = score;
		}
		
		
		public int compareTo(Golfer g) {
			if (score != g.score)
				return score - g.score;
			else
				return name.compareTo(g.name);
		}
		
	}
	
}