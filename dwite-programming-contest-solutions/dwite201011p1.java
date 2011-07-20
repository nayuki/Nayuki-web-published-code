// DWITE - November 2010 - Problem 1: Pattern Matching
// Solution by Nayuki Minase


public final class dwite201011p1 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA1.txt", "OUT1.txt", new dwite201011p1());
	}
	
	
	protected void runOnce() {
		io.tokenizeLine();
		String struct0 = getStructure(io.readToken());
		String struct1 = getStructure(io.readToken());
		io.println(struct0.equals(struct1) ? "same" : "different");
	}
	
	
	private static String getStructure(String word) {
		word = word.replaceAll("[bcdfghjklmnpqrstvwxyz]", "C");  // Consonants
		word = word.replaceAll("[aeiou]", "V");  // Vowels
		return word;
	}
	
}
