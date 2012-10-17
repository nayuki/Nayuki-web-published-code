/* 
 * DWITE - October 2006 - Problem 1: Pete's Printing Press
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */

import java.util.HashMap;
import java.util.Map;


public final class dwite200610p1 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA11.txt", "OUT11.txt", new dwite200610p1());
	}
	
	
	private static final Map<PrintConfig,Double> unitCostByConfig;
	
	static {
		unitCostByConfig = new HashMap<PrintConfig,Double>();
		
		addConfig(    1, "8.5\"x11\"", "B&W", 0.08);
		addConfig(  100, "8.5\"x11\"", "B&W", 0.06);
		addConfig(  500, "8.5\"x11\"", "B&W", 0.05);
		addConfig( 1000, "8.5\"x11\"", "B&W", 0.04);
		addConfig(10000, "8.5\"x11\"", "B&W", 0.03);
		
		addConfig(    1, "8.5\"x14\"", "B&W", 0.09);
		addConfig(  100, "8.5\"x14\"", "B&W", 0.07);
		addConfig(  500, "8.5\"x14\"", "B&W", 0.06);
		addConfig( 1000, "8.5\"x14\"", "B&W", 0.05);
		addConfig(10000, "8.5\"x14\"", "B&W", 0.03);
		
		addConfig(    1, "11\"x17\"", "B&W", 0.15);
		addConfig(  100, "11\"x17\"", "B&W", 0.12);
		addConfig(  500, "11\"x17\"", "B&W", 0.10);
		addConfig( 1000, "11\"x17\"", "B&W", 0.08);
		addConfig(10000, "11\"x17\"", "B&W", 0.05);
		
		addConfig(    1, "8.5\"x11\"", "COLOUR", 0.75);
		addConfig(  100, "8.5\"x11\"", "COLOUR", 0.65);
		addConfig(  500, "8.5\"x11\"", "COLOUR", 0.55);
		addConfig( 1000, "8.5\"x11\"", "COLOUR", 0.45);
		addConfig(10000, "8.5\"x11\"", "COLOUR", 0.30);
		
		addConfig(    1, "8.5\"x14\"", "COLOUR", 0.90);
		addConfig(  100, "8.5\"x14\"", "COLOUR", 0.85);
		addConfig(  500, "8.5\"x14\"", "COLOUR", 0.65);
		addConfig( 1000, "8.5\"x14\"", "COLOUR", 0.50);
		addConfig(10000, "8.5\"x14\"", "COLOUR", 0.30);
		
		addConfig(    1, "11\"x17\"", "COLOUR", 1.40);
		addConfig(  100, "11\"x17\"", "COLOUR", 1.20);
		addConfig(  500, "11\"x17\"", "COLOUR", 1.10);
		addConfig( 1000, "11\"x17\"", "COLOUR", 0.90);
		addConfig(10000, "11\"x17\"", "COLOUR", 0.60);
	}
	
	
	private static void addConfig(int quantity, String paperSize, String colour, double unitCost) {
		unitCostByConfig.put(new PrintConfig(quantity, paperSize, colour), unitCost);
	}
	
	
	protected void runOnce() {
		// Read input
		int n = io.readIntLine();
		String papersize = io.readLine();
		String colour = io.readLine();
		
		// Compute and write output
		PrintConfig config = new PrintConfig(n, papersize, colour);
		double cost = n * unitCostByConfig.get(config);
		io.printf("$%.2f%n", cost);
	}
	
	
	
	private static class PrintConfig {
		
		/*
		 * 0 for [1, 99]
		 * 1 for [100, 499]
		 * 2 for [500, 999]
		 * 3 for [1000, 9999]
		 * 4 for [10000, infinity)
		 */
		private final int quantityClass;
		
		/*
		 * 0 for 8.5 in. x 11 in.
		 * 1 for 8.5 in. x 14 in.
		 * 2 for 11 in. x 17 in.
		 */
		private final int paperClass;
		
		/*
		 * true for colour copies
		 * false for black and white copies
		 */
		private final boolean colour;
		
		
		
		public PrintConfig(int quantity, String paperSize, String colour) {
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
			else if (!(other instanceof PrintConfig))
				return false;
			else {
				PrintConfig pc = (PrintConfig)other;
				return quantityClass == pc.quantityClass
				    && paperClass    == pc.paperClass
				    && colour        == pc.colour;
			}
		}
		
		
		public int hashCode() {
			return (quantityClass << 3) ^ (paperClass << 1) ^ (colour ? 1 : 0);
		}
		
		
		public String toString() {
			return String.format("Printing configuration (%d, %d, %b)", quantityClass, paperClass, colour);
		}
		
	}
	
}
