import java.io.*;
import java.util.*;


// DWITE - October 2006 - Problem 1: Pete's Printing Press
public class dwite200610p1 {
	
	static final Map<PrintingConfiguration,Double> unitCost;
	
	static {
		unitCost = new HashMap<PrintingConfiguration,Double>();
		
		unitCost.put(new PrintingConfiguration(    1, "8.5\"x11\"", "B&W"), 0.08);
		unitCost.put(new PrintingConfiguration(  100, "8.5\"x11\"", "B&W"), 0.06);
		unitCost.put(new PrintingConfiguration(  500, "8.5\"x11\"", "B&W"), 0.05);
		unitCost.put(new PrintingConfiguration( 1000, "8.5\"x11\"", "B&W"), 0.04);
		unitCost.put(new PrintingConfiguration(10000, "8.5\"x11\"", "B&W"), 0.03);
		
		unitCost.put(new PrintingConfiguration(    1, "8.5\"x14\"", "B&W"), 0.09);
		unitCost.put(new PrintingConfiguration(  100, "8.5\"x14\"", "B&W"), 0.07);
		unitCost.put(new PrintingConfiguration(  500, "8.5\"x14\"", "B&W"), 0.06);
		unitCost.put(new PrintingConfiguration( 1000, "8.5\"x14\"", "B&W"), 0.05);
		unitCost.put(new PrintingConfiguration(10000, "8.5\"x14\"", "B&W"), 0.03);
		
		unitCost.put(new PrintingConfiguration(    1, "11\"x17\"", "B&W"), 0.15);
		unitCost.put(new PrintingConfiguration(  100, "11\"x17\"", "B&W"), 0.12);
		unitCost.put(new PrintingConfiguration(  500, "11\"x17\"", "B&W"), 0.10);
		unitCost.put(new PrintingConfiguration( 1000, "11\"x17\"", "B&W"), 0.08);
		unitCost.put(new PrintingConfiguration(10000, "11\"x17\"", "B&W"), 0.05);
		
		unitCost.put(new PrintingConfiguration(    1, "8.5\"x11\"", "COLOUR"), 0.75);
		unitCost.put(new PrintingConfiguration(  100, "8.5\"x11\"", "COLOUR"), 0.65);
		unitCost.put(new PrintingConfiguration(  500, "8.5\"x11\"", "COLOUR"), 0.55);
		unitCost.put(new PrintingConfiguration( 1000, "8.5\"x11\"", "COLOUR"), 0.45);
		unitCost.put(new PrintingConfiguration(10000, "8.5\"x11\"", "COLOUR"), 0.30);
		
		unitCost.put(new PrintingConfiguration(    1, "8.5\"x14\"", "COLOUR"), 0.90);
		unitCost.put(new PrintingConfiguration(  100, "8.5\"x14\"", "COLOUR"), 0.85);
		unitCost.put(new PrintingConfiguration(  500, "8.5\"x14\"", "COLOUR"), 0.65);
		unitCost.put(new PrintingConfiguration( 1000, "8.5\"x14\"", "COLOUR"), 0.50);
		unitCost.put(new PrintingConfiguration(10000, "8.5\"x14\"", "COLOUR"), 0.30);
		
		unitCost.put(new PrintingConfiguration(    1, "11\"x17\"", "COLOUR"), 1.40);
		unitCost.put(new PrintingConfiguration(  100, "11\"x17\"", "COLOUR"), 1.20);
		unitCost.put(new PrintingConfiguration(  500, "11\"x17\"", "COLOUR"), 1.10);
		unitCost.put(new PrintingConfiguration( 1000, "11\"x17\"", "COLOUR"), 0.90);
		unitCost.put(new PrintingConfiguration(10000, "11\"x17\"", "COLOUR"), 0.60);
	}
	
	
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		int n = Integer.parseInt(in.readLine());
		String papersize = in.readLine();
		String colour = in.readLine();
		out.printf("$%.2f%n", n * unitCost.get(new PrintingConfiguration(n, papersize, colour)));
	}
	
	
	
	static String infile = "DATA11.txt";  // Specify null to use System.in
	static String outfile = "OUT11.txt";  // Specify null to use System.out
	
	
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
	
	
	
	static class PrintingConfiguration {
		
		/*
		 * 0 for [1, 99]
		 * 1 for [100, 499]
		 * 2 for [500, 999]
		 * 3 for [1000, 9999]
		 * 4 for [10000, infinity)
		 */
		int quantityClass;
		
		/*
		 * 0 for 8.5 in. x 11 in.
		 * 1 for 8.5 in. x 14 in.
		 * 2 for 11 in. x 17 in.
		 */
		int paperClass;
		
		boolean colour;
		
		
		
		PrintingConfiguration(int quantity, String paperSize, String colour) {
			if      (quantity <     1) throw new AssertionError("Invalid quantity");
			else if (quantity <   100) quantityClass = 0;
			else if (quantity <   500) quantityClass = 1;
			else if (quantity <  1000) quantityClass = 2;
			else if (quantity < 10000) quantityClass = 3;
			else                       quantityClass = 4;
			
			if      (paperSize.equals("8.5\"x11\"")) paperClass = 0;
			else if (paperSize.equals("8.5\"x14\"")) paperClass = 1;
			else if (paperSize.equals("11\"x17\"" )) paperClass = 2;
			else throw new AssertionError("Invalid paper size");
			
			if      (colour.equals("B&W"   )) this.colour = false;
			else if (colour.equals("COLOUR")) this.colour = true;
			else throw new AssertionError("Invalid colour configuration");
		}
		
		
		
		public boolean equals(Object other) {
			if (this == other)
				return true;
			else if (!(other instanceof PrintingConfiguration))
				return false;
			else {
				PrintingConfiguration pc = (PrintingConfiguration)other;
				return quantityClass == pc.quantityClass
				    && paperClass    == pc.paperClass
				    && colour        == pc.colour;
			}
		}
		
		
		public int hashCode() {
			return (quantityClass << 3) ^ (paperClass << 1) ^ (colour ? 1 : 0);
		}
		
	}
	
}