import java.io.*;
import java.util.StringTokenizer;


// DWITE - October 2006 - Problem 2: Body Mass Index
public class dwite200610p2 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		StringTokenizer st = new StringTokenizer(in.readLine(), " ");
		double height = Double.parseDouble(st.nextToken());
		double weight = Double.parseDouble(st.nextToken());
		String system = in.readLine();
		double bmi = weight / (height * height);
		
		if      (system.equals("METRIC"  )) bmi *= 1;
		else if (system.equals("IMPERIAL")) bmi *= 703;
		else throw new AssertionError();
		
		String category;
		if      (bmi <  15.0) category = "STARVATION";
		else if (bmi <  18.5) category = "UNDERWEIGHT";
		else if (bmi <= 25.0) category = "IDEAL";
		else if (bmi <= 30.0) category = "OVERWEIGHT";
		else if (bmi <= 40.0) category = "OBESE";
		else                  category = "MORBIDLY OBESE";
		
		out.printf("%.2f-%s%n", bmi, category);
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