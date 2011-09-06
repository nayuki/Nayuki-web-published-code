// DWITE - March 2010 - Problem 4: Kind of like OCR
// Solution by Nayuki Minase


public final class dwite201003p4 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA4.txt", "OUT4.txt", new dwite201003p4());
	}
	
	
	protected void runOnce() {
		String line0 = io.readLine();
		String line1 = io.readLine();
		if (line0.length() != line1.length())
			throw new IllegalArgumentException();
		
		// Interleave the lines for easier processing
		StringBuilder sb = new StringBuilder();
		for (int i = 0; i < line0.length(); i++)
			sb.append(line0.charAt(i)).append(line1.charAt(i));
		
		io.println(parse(sb.toString()));
	}
	
	
	private static String[] alphabet = {
		"xx.x",    // A
		"xxxx",    // B
		"xx.xxx",  // C
		"x.xx",    // D
		"x.xxxx",  // E
	};
	
	private static String parse(String s) {
		if (s.equals(""))
			return "";
		
		for (int i = 0; i < alphabet.length; i++) {
			if (s.startsWith(alphabet[i])) {
				String temp = parse(s.substring(alphabet[i].length()));
				if (temp != null)
					return (char)('A' + i) + temp;
			}
		}
		return null;
	}
	
}
