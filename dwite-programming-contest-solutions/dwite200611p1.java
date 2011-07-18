// DWITE - November 2006 - Problem 1: 13375P34|<
// Solution by Nayuki Minase


public final class dwite200611p1 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA11.txt", "OUT11.txt", new dwite200611p1());
	}
	
	
	protected void runOnce() {
		// Read input
		String line = io.readLine();
		
		// Do replacements
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
		
		line = line.replace("|"     , "I");  // These two are deliberately placed after the other replacements
		line = line.replace("\\/"   , "V");
		
		// Write output
		io.println(line);
	}
	
}
