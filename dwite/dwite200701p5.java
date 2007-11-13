import java.io.*;
import java.util.*;


// DWITE - January 2007 - Problem 5: Dutch Solitaire
public class dwite200701p5 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		StringTokenizer st = new StringTokenizer(in.readLine(), " ");
		st.nextToken();  // Discard N, the number of candies
		int piles = Integer.parseInt(st.nextToken());
		List<Integer> state = new ArrayList<Integer>();
		for (int i = 0; i < piles; i++)
			state.add(Integer.parseInt(st.nextToken()));
		Collections.sort(state, Collections.reverseOrder());
		
		Set<List<Integer>> paststates = new HashSet<List<Integer>>();
		paststates.add(state);
		for (int i = 0; i < 100; i++) {
			List<Integer> nextstate = new ArrayList<Integer>();
			int newpile = 0;
			for (int candies : state) {  // Note: All elements of 'state' are positive
				newpile++;
				if (candies > 1)
					nextstate.add(candies - 1);				
			}
			nextstate.add(newpile);
			Collections.sort(nextstate, Collections.reverseOrder());
			
			if (nextstate.equals(state)) {
				out.printf("WIN-%d%n", i);
				break;
			}
			if (paststates.contains(nextstate)) {
				out.printf("LOSS-%d%n", i + 1);
				break;
			}
			
			paststates.add(nextstate);
			state = nextstate;
		}
	}
	
	
	static String infile = "DATA51.txt";  // Specify null to use System.in
	static String outfile = "OUT51.txt";  // Specify null to use System.out
	
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