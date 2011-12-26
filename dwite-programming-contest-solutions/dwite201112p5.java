// DWITE - December 2011 - Problem 5: Tautology
// Solution by Nayuki Minase

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;


public final class dwite201112p5 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA5.txt", "OUT5.txt", new dwite201112p5());
	}
	
	
	protected void runOnce() {
		for (int i = 0; i < 3; i++) {
			String formula = io.readLine();
			io.print(isTautology(formula) ? "Y" : "N");
		}
		io.println();
	}
	
	
	private static int NUM_ATOMS = 'j' - 'a' + 1;
	
	private static boolean isTautology(String formula) {
		char[] rpnFormula;
		try {
			InputStream in = new ByteArrayInputStream(formula.getBytes("US-ASCII"));
			StringBuilder sb = new StringBuilder();
			toReversePolishNotation(in, sb);
			rpnFormula = sb.toString().toCharArray();
		} catch (IOException e) {
			throw new AssertionError(e);
		}
		
		for (int i = 0; i < (1 << NUM_ATOMS); i++) {
			if (!evaluate(rpnFormula, i))
				return false;
		}
		return true;
	}
	
	
	private static void toReversePolishNotation(InputStream in, StringBuilder out) throws IOException {
		char next = (char)in.read();
		
		if (next >= 'a' && next <= 'a' + NUM_ATOMS - 1)  // Atom
			out.append(next);
		
		else if (next == '~') {  // Unary negation
			toReversePolishNotation(in, out);
			out.append('~');
			
		} else if (next == '(') {  // Binary operations
			toReversePolishNotation(in, out);  // Left subformula
			expect(in, ' ');
			char op = (char)in.read();
			expect(in, ' ');			
			toReversePolishNotation(in, out);  // Right subformula
			expect(in, ')');
			switch (op) {
				case '^':  out.append("&");  break;
				case 'v':  out.append("|");  break;
				default:   throw new IllegalArgumentException();
			}
			
		} else
			throw new IllegalArgumentException();
	}
	
	
	private static boolean evaluate(char[] rpnFormula, int values) {
		boolean[] stack = new boolean[255];
		int stackSize = 0;
		
		for (int c : rpnFormula) {
			if (c >= 'a' && c <= 'z') {
				stack[stackSize] = ((values >>> (c - 'a')) & 1) != 0;
				stackSize++;
			} else if (c == '~')
				stack[stackSize - 1] = !stack[stackSize - 1];
			else if (c == '&') {
				stack[stackSize - 2] = stack[stackSize - 2] && stack[stackSize - 1];
				stackSize--;
			} else if (c == '|') {
				stack[stackSize - 2] = stack[stackSize - 2] || stack[stackSize - 1];
				stackSize--;
			} else
				throw new IllegalArgumentException();
		}
		
		if (stackSize != 1)
			throw new IllegalArgumentException();
		return stack[0];
	}
	
	
	private static void expect(InputStream in, char c) throws IOException {
		if (in.read() != c)
			throw new IllegalArgumentException();
	}
	
}
