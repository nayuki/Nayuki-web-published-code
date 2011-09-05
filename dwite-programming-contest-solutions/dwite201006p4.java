// DWITE - June 2010 - Problem 4: What is this Algebra?
// Solution by Nayuki Minase

import java.util.regex.Matcher;
import java.util.regex.Pattern;


public final class dwite201006p4 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA4.txt", "OUT4.txt", new dwite201006p4());
	}
	
	
	private static Pattern BRACKET  = Pattern.compile("\\((-?\\d+)\\)");
	private static Pattern EXPONENT = Pattern.compile("(-?\\d+)\\^(-?\\d+)");
	private static Pattern MULT_DIV = Pattern.compile("(-?\\d+)([*/])(-?\\d+)");
	private static Pattern ADD_SUB  = Pattern.compile("(-?\\d+)([+-])(-?\\d+)");
	
	
	protected void runOnce() {
		String line = io.readLine();
		line = line.replace(" ", "");  // Strip spaces
		
		// Keep replacing the leftmost highest precedence subexpression
		while (true) {
			Matcher m;
			
			// Brackets
			m = BRACKET.matcher(line);
			if (m.find()) {
				line = m.replaceFirst("$1");
				continue;
			}
			
			// "Exponentiation"
			m = EXPONENT.matcher(line);
			if (m.find()) {
				int x = Integer.parseInt(m.group(1));
				int y = Integer.parseInt(m.group(2));
				int z = Integer.parseInt(Math.abs(x) + "" + Math.abs(y));
				line = m.replaceFirst(Integer.toString(z));
				continue;
			}
			
			// Multiplication, division
			m = MULT_DIV.matcher(line);
			if (m.find()) {
				int x = Integer.parseInt(m.group(1));
				int y = Integer.parseInt(m.group(3));
				int z = m.group(2).equals("*") ? x * y : x / y;
				line = m.replaceFirst(Integer.toString(z));
				continue;
			}
			
			// Addition, subtraction
			m = ADD_SUB.matcher(line);
			if (m.find()) {
				int x = Integer.parseInt(m.group(1));
				int y = Integer.parseInt(m.group(3));
				int z = m.group(2).equals("+") ? x + y : x - y;
				line = m.replaceFirst(Integer.toString(z));
				continue;
			}
			
			break;
		}
		
		io.println(line);
	}
	
}
