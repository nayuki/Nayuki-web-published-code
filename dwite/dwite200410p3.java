import java.io.*;
import java.util.*;


// DWITE - October 2004 - Problem 3: The Tallest in the Class
public class dwite200410p3 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		// Read input
		List<Student> students = new ArrayList<Student>();
		int n = Integer.parseInt(in.readLine());
		for (int i = 0; i < n; i++) {
			StringTokenizer st = new StringTokenizer(in.readLine(), " ");
			String name = st.nextToken();
			double height = Double.parseDouble(st.nextToken());
			String unit = st.nextToken();
			students.add(new Student(name, height, unit));
		}
		
		// Sort by height and write names to output
		Collections.sort(students);
		for (int i = 0; i < 5; i++)
			out.println(students.get(i).name);
	}
	
	
	
	private static String infile = "DATA3";  // Specify null to use System.in
	private static String outfile = "OUT3";  // Specify null to use System.out
	
	
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
	
	
	
	private static class Student implements Comparable<Student> {
		
		public final String name;
		public final double height;  // In millimetres
		
		
		
		public Student(String name, double height, String unit) {
			this.name = name;
			if      (unit.equals( "m")) this.height = height * 1000;
			else if (unit.equals("dm")) this.height = height *  100;
			else if (unit.equals("cm")) this.height = height *   10;
			else if (unit.equals("mm")) this.height = height *    1;
			else throw new AssertionError("Invalid unit");
		}
		
		
		
		public int compareTo(Student s) {  // Compares by descending height, then by ascending name
			if (height != s.height)
				return Double.compare(s.height, height);
			else
				return name.compareTo(s.name);
		}
		
	}
	
}