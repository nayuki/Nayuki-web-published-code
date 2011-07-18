// DWITE - January 2006 - Problem 4: Equivalent Amounts
// Solution by Nayuki Minase

import java.util.HashMap;
import java.util.Map;


public final class dwite200601p4 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA41.txt", "OUT41.txt", new dwite200601p4());
	}
	
	
	/*
	 * 1 bushel     =  4 pecks        = 6144 teaspoons
	 * 1 peck       =  8 quarts       = 1536 teaspoons
	 * 1 gallon     =  4 quarts       =  768 teaspoons
	 * 1 quart      =  4 cups         =  192 teaspoons
	 * 1 pint       =  2 cups         =   96 teaspoons
	 * 1 cup        =  16 tablespoons =   48 teaspoons
	 * 1 tablespoon =  3 teaspoons    =    3 teaspoons
	 * 1 teaspoon   = ~5 millilitres  =    1 teaspoon
	 */
	private static final Map<String,Integer> teaspoonsByUnit;
	
	static {
		teaspoonsByUnit = new HashMap<String,Integer>();
		teaspoonsByUnit.put("TEASPOONS"  ,    1);
		teaspoonsByUnit.put("TABLESPOONS",    3);
		teaspoonsByUnit.put("CUPS"       ,   48);
		teaspoonsByUnit.put("PINTS"      ,   96);
		teaspoonsByUnit.put("QUARTS"     ,  192);
		teaspoonsByUnit.put("GALLONS"    ,  768);
		teaspoonsByUnit.put("PECKS"      , 1536);
		teaspoonsByUnit.put("BUSHELS"    , 6144);
	}
	
	
	protected void runOnce() {
		io.tokenizeLine();
		int x = io.readIntToken();
		String fromunit = io.readToken();
		if (!io.readToken().equals("=")) throw new AssertionError("Expected \"=\"");
		if (!io.readToken().equals("?")) throw new AssertionError("Expected \"?\"");
		String tounit = io.readToken();
		io.printf("%.2f%n", (double)x * teaspoonsByUnit.get(fromunit) / teaspoonsByUnit.get(tounit));
	}
	
}
