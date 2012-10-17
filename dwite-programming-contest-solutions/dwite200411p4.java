/* 
 * DWITE - November 2004 - Problem 4: For Loops
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */

import java.util.ArrayList;
import java.util.List;


public final class dwite200411p4 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA41.txt", "OUT41.txt", new dwite200411p4());
	}
	
	
	protected void runOnce() {
		// Parse input
		io.tokenizeLine();  // "sum = value"
		expectNextToken(io, "sum");
		expectNextToken(io, "=");
		int sum = io.readIntToken();
		
		io.tokenizeLine();  // "For i = start To finish"
		expectNextToken(io, "For");
		expectNextToken(io, "i");
		expectNextToken(io, "=");
		int start = io.readIntToken();
		expectNextToken(io, "To");
		int finish = io.readIntToken();
		
		io.tokenizeLine();  // "sum = formula"
		expectNextToken(io, "sum");
		expectNextToken(io, "=");
		List<Object> formula = new ArrayList<Object>();
		while (io.canReadToken())
			formula.add(io.readToken());
		parseNumbers(formula);
		
		io.tokenizeLine();  // "Next i"
		expectNextToken(io, "Next");
		expectNextToken(io, "i");
		
		// Execute formula
		for (int i = start; i <= finish; i++)
			sum = evaluate(sum, i, formula);
		
		// Write output
		io.println(sum);
	}
	
	
	private static void parseNumbers(List<Object> formula) {
		for (int i = 0; i < formula.size(); i++) {
			Object token = formula.get(i);
			if (token instanceof String) {
				String tok = (String)token;
				if (tok.matches("\\d+"))
					formula.set(i, Integer.parseInt(tok));
				else if (tok.matches("\\(-?\\d+\\)"))
					formula.set(i, Integer.parseInt(tok.substring(1, tok.length() - 1)));
			}
		}
	}
	
	
	private static int evaluate(int sum, int i, List<Object> formula) {
		// Make a copy of the formula
		formula = new ArrayList<Object>(formula);
		
		// Scan for multiplication and division
		for (int j = 0; j < formula.size(); j++) {
			Object token = formula.get(j);
			if (token.equals("*") || token.equals("\\")) {
				int x = getValue(sum, i, formula.get(j - 1));
				int y = getValue(sum, i, formula.get(j + 1));
				int z;
				if (token.equals("*")) z = x * y;
				else                   z = x / y;
				// Replace x OP y with z
				formula.subList(j - 1, j + 2).clear();
				formula.add(j - 1, z);
				j -= 2;
			}
		}
		
		// Scan for addition and subtraction
		for (int j = 0; j < formula.size(); j++) {
			Object token = formula.get(j);
			if (token.equals("+") || token.equals("-")) {
				int x = getValue(sum, i, formula.get(j - 1));
				int y = getValue(sum, i, formula.get(j + 1));
				int z;
				if (token.equals("+")) z = x + y;
				else                   z = x - y;
				// Replace x OP y with z
				formula.subList(j - 1, j + 2).clear();
				formula.add(j - 1, z);
				j -= 2;
			}
		}
		
		if (formula.size() != 1)
			throw new IllegalArgumentException("Invalid formula");
		else
			return getValue(sum, i, formula.get(0));
	}
	
	
	private static int getValue(int sum, int i, Object token) {
		if (token instanceof Integer)
			return (Integer)token;
		else if (token instanceof String) {
			String tok = (String)token;
			if (tok.equals("i"))
				return i;
			else if (tok.equals("sum"))
				return sum;
			else
				throw new IllegalArgumentException("Not a value: " + tok);
		} else
			throw new IllegalArgumentException("Not a value: " + token);
	}
	
	
	private static void expectNextToken(DwiteIo io, String expectedToken) {
		String actualToken = io.readToken();
		if (!expectedToken.equals(actualToken))
			throw new AssertionError(String.format("Expected \"%s\", got \"%s\"", expectedToken, actualToken));
	}
	
}
