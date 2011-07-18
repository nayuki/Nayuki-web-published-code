// DWITE - February 2011 - Problem 1: Colourful Words
// Solution by Nayuki Minase


public final class dwite201102p1 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA1.txt", "OUT1.txt", new dwite201102p1());
	}
	
	
	protected void runOnce() {
		// Read word and letter colours
		io.tokenizeLine();
		char[] word = io.readToken().toCharArray();
		String colours = io.readToken();
		if (word.length != colours.length())
			throw new IllegalArgumentException();
		
		// Read lights
		String light = io.readLine();
		for (String lightColour : light.split("\\+")) {
			if (lightColour.length() != 1)
				throw new IllegalArgumentException();
			
			// Eliminate letters of the current colour
			for (int i = 0; i < word.length; i++) {
				if (colours.charAt(i) == lightColour.charAt(0))
					word[i] = '_';
			}
		}
		
		io.println(new String(word));
	}
	
}
