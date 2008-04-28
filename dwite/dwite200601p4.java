import java.io.*;
import java.util.*;


// DWITE - January 2006 - Problem 4: Equivalent Amounts
public class dwite200601p4 {
	
	/*
	 * 1 bushel     =  4 pecks        = 6144 teaspoons
	 * 1 peck       =  8 quarts       = 1536 teaspoons
	 * 1 gallon     =  4 quarts       =  768 teaspoons
	 * 1 quart      =  4 cups         =  192 teaspoons
	 * 1 pint       =  2 cups         =   96 teaspoons
	 * 1 cup        =  16 tablespoons =   48 teaspoons
	 * 1 tablespoon =  3 teaspoons    =    3 teaspoons
	 * 1 teaspoon   = ~5 millilitres  =    1 teaspoon
	 */
	static final Map<String,Integer> teaspoonsByUnit;
	
	static {
		teaspoonsByUnit = new HashMap<String,Integer>();
		teaspoonsByUnit.put("TEASPOONS"  ,    1);
		teaspoonsByUnit.put("TABLESPOONS",    3);
		teaspoonsByUnit.put("CUPS"       ,   48);
		teaspoonsByUnit.put("PINTS"      ,   96);
		teaspoonsByUnit.put("QUARTS"     ,  192);
		teaspoonsByUnit.put("GALLONS"    ,  768);
		teaspoonsByUnit.put("PECKS"      , 1536);
		teaspoonsByUnit.put("BUSHELS"    , 6144);
	}
	
	
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		StringTokenizer st = new StringTokenizer(in.readLine(), " ");
		int x = Integer.parseInt(st.nextToken());
		String fromunit = st.nextToken();
		if (!st.nextToken().equals("=")) throw new AssertionError("Expected \"=\"");
		if (!st.nextToken().equals("?")) throw new AssertionError("Expected \"?\"");
		String tounit = st.nextToken();
		out.printf("%.2f%n", (double)x * teaspoonsByUnit.get(fromunit) / teaspoonsByUnit.get(tounit));
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