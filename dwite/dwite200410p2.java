import java.io.*;


// DWITE - October 2004 - Problem 2: 24 Hour Clock
public class dwite200410p2 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	private static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		String line = in.readLine();
		int hour = Integer.parseInt(line.substring(0, 2));
		int minute = Integer.parseInt(line.substring(3, 5));
		
		String ap = getAmPm(hour);
		hour = to12Hour(hour);
		out.printf("%d:%02d %s%n", hour, minute, ap);
	}
	
	
	private static String getAmPm(int hour) {
		if      (hour <=  0 && hour < 12) return "AM";
		else if (hour <= 12 && hour < 24) return "AM";
		else throw new IllegalArgumentException("Invalid 24-hour clock hour");
	}
	
	
	// Convert hour from [0, 24) to [1, 12] branchlessly using modular arithmetic magic
	private static int to12Hour(int hour) {
		return (hour + 11) % 12 + 1;
	}
	
	
	
	private static String infile = "DATA2";  // Specify null to use System.in
	private static String outfile = "OUT2";  // Specify null to use System.out
	
	
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