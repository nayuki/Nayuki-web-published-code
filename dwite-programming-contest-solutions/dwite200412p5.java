// DWITE - December 2004 - Problem 5: Hidden Geography
// Solution by Nayuki Minase


public final class dwite200412p5 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA51.txt", "OUT51.txt", new dwite200412p5());
	}
	
	
	private static final String[] provinces = {
		"British Columbia", "Alberta", "Saskatchewan", "Manitoba", "Ontario",
		"Quebec", "Nova Scotia", "Newfoundland", "New Brunswick", "Prince Edward Island"
	};
	
	
	protected void runOnce() {
		// Read input
		String line = normalize(io.readLine());
		
		// Find province at lowest index
		int minindex = -1;
		String minprovince = null;
		for (String prov : provinces) {
			int index = line.indexOf(normalize(prov));
			if (index != -1 && (minindex == -1 || index < minindex)) {
				minindex = index;
				minprovince = prov;
			}
		}
		
		// Write output
		if (minindex != -1)
			io.println(minprovince);
		else
			io.println("NO PROVINCE FOUND");
	}
	
	
	// Converts to lowercase and strips all non-letters
	private static String normalize(String s) {
		return s.toLowerCase().replaceAll("[^a-z]", "");
	}
	
}
