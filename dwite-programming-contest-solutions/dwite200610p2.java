// DWITE - October 2006 - Problem 2: Body Mass Index
// Solution by Nayuki Minase


public final class dwite200610p2 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA21.txt", "OUT21.txt", new dwite200610p2());
	}
	
	
	protected void runOnce() {
		// Read input
		io.tokenizeLine();
		double height = io.readDoubleToken();
		double weight = io.readDoubleToken();
		String system = io.readLine();
		
		// Compute
		double bmi = weight / (height * height);
		if      (system.equals("METRIC"  )) bmi *= 1;
		else if (system.equals("IMPERIAL")) bmi *= 703;
		else throw new AssertionError("Invalid measurement system");
		
		// Write output
		io.printf("%.2f-%s%n", bmi, getCategory(bmi));
	}
	
	
	private static String getCategory(double bmi) {
		if      (               bmi <  15.0) return "STARVATION";
		else if (15.0 <= bmi && bmi <  18.5) return "UNDERWEIGHT";
		else if (18.5 <= bmi && bmi <= 25.0) return "IDEAL";
		else if (25.0 <  bmi && bmi <= 30.0) return "OVERWEIGHT";
		else if (30.0 <  bmi && bmi <= 40.0) return "OBESE";
		else if (40.0 <  bmi               ) return "MORBIDLY OBESE";
		else throw new IllegalArgumentException("Invalid BMI");
	}
	
}
