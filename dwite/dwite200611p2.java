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
		
		int regularmatch = 0;
		for (int i = 0; i < 6; i++) {
			if (numbers.contains(winningNumbers.get(i)))
				regularmatch++;
		}
		
		int bonusmatch = 0;
		if (numbers.contains(winningNumbers.get(6)))
			bonusmatch++;
		
		String prize;
		if      (regularmatch <= 2) prize = "No Prize";
		else if (regularmatch == 3) prize = "Fifth Prize";
		else if (regularmatch == 4) prize = "Fourth Prize";
		else if (regularmatch == 5 && bonusmatch == 0) prize = "Third Prize";
		else if (regularmatch == 5 && bonusmatch == 1) prize = "Second Prize";
		else if (regularmatch == 6) prize = "First Prize";
		else throw new AssertionError("Invalid lottery result");
		out.println(prize);
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