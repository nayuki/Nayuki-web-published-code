import java.io.*;
import java.util.StringTokenizer;


// DWITE - January 2005 - Problem 4: Zeller's Congruence
public class dwite200501p4 {
	
	static final String[] months = {"JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"};
	static final String[] daysOfWeek = {"SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"};
	
	
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		StringTokenizer st = new StringTokenizer(in.readLine(), " ");
		int m = getMonth(st.nextToken());
		String daystr = st.nextToken();
		int d = Integer.parseInt(daystr.substring(0, daystr.length() - 1));
		int y = Integer.parseInt(st.nextToken());
		
		// Zeller's congruence computation
		if (m <= 2) {
			m += 12;
			y--;
		}
		int c = y / 100;
		y %= 100;
		int dow = (26*(m+1)/10 + d + y + y/4 + c/4 - 2*c) % 7;
		if (dow < 0)
			dow += 7;
		
		out.println(daysOfWeek[dow]);
	}
	
	
	// Returns the month number corresponding to the string, starting with January = 1.
	static int getMonth(String s) {
		for (int i = 0; i < months.length; i++) {
			if (s.equals(months[i]))
				return i + 1;
		}
		throw new AssertionError();
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