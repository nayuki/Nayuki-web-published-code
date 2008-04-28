import java.io.*;
import java.util.*;


// DWITE - November 2006 - Problem 2: Lottery Ticket Checker
public class dwite200611p2 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		List<Integer> winningnumbers = parseNumbers(in.readLine());
		for (int i = 0; i < 5; i++)
			mainOnce(in, out, winningnumbers);
	}
	
	
	static void mainOnce(BufferedReader in, PrintWriter out, List<Integer> winningNumbers) throws IOException {
		List<Integer> numbers = parseNumbers(in.readLine());
		
		int regularMatches = 0;
		for (int i = 0; i < 6; i++) {
			if (numbers.contains(winningNumbers.get(i)))
				regularMatches++;
		}
		
		int bonusMatches = 0;
		if (numbers.contains(winningNumbers.get(6)))
			bonusMatches++;
		
		String prize = getPrize(regularMatches, bonusMatches);
		out.println(prize);
	}
	
	
	static String getPrize(int regularMatches, int bonusMatches) {
		if      (regularMatches <= 2) return "No Prize";
		else if (regularMatches == 3) return "Fifth Prize";
		else if (regularMatches == 4) return "Fourth Prize";
		else if (regularMatches == 5 && bonusMatches == 0) return "Third Prize";
		else if (regularMatches == 5 && bonusMatches == 1) return "Second Prize";
		else if (regularMatches == 6) return "First Prize";
		else throw new IllegalArgumentException("Invalid lottery result");
	}
	
	
	static List<Integer> parseNumbers(String s) {
		StringTokenizer st = new StringTokenizer(s, " ");
		List<Integer> result = new ArrayList<Integer>();
		while (st.hasMoreTokens())
			result.add(Integer.parseInt(st.nextToken()));
		return result;
	}
	
	
	
	static String infile = "DATA21.txt";  // Specify null to use System.in
	static String outfile = "OUT21.txt";  // Specify null to use System.out
	
	
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