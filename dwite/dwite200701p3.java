import java.io.*;
import java.util.StringTokenizer;


// DWITE - January 2007 - Problem 3: Elapsed Time in Seconds
public class dwite200701p3 {
	
	private static final int[] cumulativeDays = {-1, -1, -1, 0, 31, 61, 92, 122, 153, 184, 214, 245, 275, 306, 337};
	
	
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	private static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		StringTokenizer st = new StringTokenizer(in.readLine(), " /:");
		int day = Integer.parseInt(st.nextToken());
		int mth = Integer.parseInt(st.nextToken());
		int yr = Integer.parseInt(st.nextToken());
		int hr = Integer.parseInt(st.nextToken());
		int min = Integer.parseInt(st.nextToken());
		int sec = Integer.parseInt(st.nextToken());
		out.println(toSeconds(yr, mth, day, hr, min, sec) - toSeconds(2000, 1, 1, 0, 0, 0));
	}
	
	
	/*
	 * Returns the number of seconds after an arbitrary, fixed epoch.
	 * At the very least, it requires that yr >= 0 and 01 <= mth <= 12.
	 */
	private static long toSeconds(int yr, int mth, int day, int hr, int min, int sec) {
		if (mth < 3) {
			mth += 12;
			yr--;
		}
		int d = yr*365 + yr/4 - yr/100 + yr/400 + cumulativeDays[mth] + day;  // The epoch is 0000-02-29, to be exact
		return d*86400L + hr*3600 + min*60 + sec*1;
	}
	
	
	
	private static String infile = "DATA31.txt";  // Specify null to use System.in
	private static String outfile = "OUT31.txt";  // Specify null to use System.out
	
	
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