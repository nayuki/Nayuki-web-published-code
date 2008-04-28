import java.io.*;


// DWITE - November 2006 - Problem 1: 13375P34|<
public class dwite200611p1 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		String line = in.readLine();
		
		line = line.replace("4"     , "A");
		line = line.replace("8"     , "B");
		line = line.replace("("     , "C");
		line = line.replace("|)"    , "D");
		line = line.replace("3"     , "E");
		line = line.replace("9"     , "G");
		line = line.replace("|-|"   , "H");
		line = line.replace("|<"    , "K");
		line = line.replace("1"     , "L");
		line = line.replace("/\\/\\", "M");
		line = line.replace("|\\|"  , "N");
		line = line.replace("0"     , "O");
		line = line.replace("|2"    , "R");
		line = line.replace("5"     , "S");
		line = line.replace("7"     , "T");
		line = line.replace("\\/\\/", "W");
		line = line.replace("><"    , "X");
		line = line.replace("'/"    , "Y");
		
		line = line.replace("|"     , "I");
		line = line.replace("\\/"   , "V");
		
		out.println(line);
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
	
}