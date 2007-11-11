import java.io.*;


// DWITE - December 2004 - Problem 5: Hidden Geography
public class dwite200412p5 {
	
	static String[] provinces = {"British Columbia", "Alberta", "Saskatchewan", "Manitoba", "Ontario", "Quebec", "Nova Scotia", "Newfoundland", "New Brunswick", "Prince Edward Island"};
	
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		String line = process(in.readLine());
		int minindex = -1;
		String minprovince = null;
		
		for (String prov : provinces) {
			int index = line.indexOf(process(prov));
			if (index != -1 && (minindex == -1 || index < minindex)) {
				minindex = index;
				minprovince = prov;
			}
		}
			
		if (minindex != -1)
			out.println(minprovince);
		else
			out.println("NO PROVINCE FOUND");
	}
	
	static String process(String s) {  // Converts to lowercase and strips all non-letters
		return s.toLowerCase().replaceAll("[^a-z]", "");
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