/* 
 * DWITE - February 2006 - Problem 3: UPC Check Digit
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */


public final class dwite200602p3 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA31.txt", "OUT31.txt", new dwite200602p3());
	}
	
	
	protected void runOnce() {
		String line = io.readLine();
		if (line.length() != 12)
			throw new AssertionError("Invalid length for UPC digit sequence");
		int sum = getUpcSumWithoutCheckDigit(DwiteAlgorithm.toDigits(line));
		io.printf("%s%d%n", line.substring(0, 11), (10 - sum) % 10);  // Calculate the correct check digit using modular arithmetic magic
	}
	
	
	private static int getUpcSumWithoutCheckDigit(int[] digits) {
		int sum = 0;
		for (int i = 0; i < digits.length - 1; i++) {
			if (i % 2 == 0) sum += digits[i] * 3;
			else            sum += digits[i] * 1;
		}
		return sum % 10;
	}
	
}
