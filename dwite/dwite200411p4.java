import java.io.*;
import java.util.*;


// DWITE - November 2004 - Problem 4: For Loops
public class dwite200411p4 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	private static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		// Parse input
		StringTokenizer st;
		
		st = new StringTokenizer(in.readLine(), " ");  // "sum = value"
		expectNextToken(st, "sum");
		expectNextToken(st, "=");
		int sum = Integer.parseInt(st.nextToken());
		
		st = new StringTokenizer(in.readLine(), " ");  // "For i = start To finish"
		expectNextToken(st, "For");
		expectNextToken(st, "i");
		expectNextToken(st, "=");
		int start = Integer.parseInt(st.nextToken());
		expectNextToken(st, "To");
		int finish = Integer.parseInt(st.nextToken());
		
		st = new StringTokenizer(in.readLine(), " ");  // "sum = formula"
		expectNextToken(st, "sum");
		expectNextToken(st, "=");
		List<String> formula = new ArrayList<String>();
		while (st.hasMoreTokens())
			formula.add(st.nextToken());
		
		st = new StringTokenizer(in.readLine(), " ");  // "Next i"
		expectNextToken(st, "Next");
		expectNextToken(st, "i");
		
		for (int i = start; i <= finish; i++)
			sum = executeOnce(sum, i, formula);
		
		out.println(sum);
	}
	
	
	private static int executeOnce(int sum, int i, List<String> formula) {
		// Dijkstra's shunting yard algorithm
		Stack<Integer> operands = new Stack<Integer>();
		Stack<Character> operators = new Stack<Character>();
		for (String token : formula) {
			if (isOperator(token)) {
				// Operators
				while (!operators.empty() && canEvaluate(operators.peek(), token.charAt(0))) {
					int y = operands.pop();
					int x = operands.pop();
					operands.push(evaluate(x, y, operators.pop()));
				}
				operators.push(token.charAt(0));
			} else {
				// Values
				int value;
				if (token.equals("sum"))
					value = sum;
				else if (token.equals("i"))
					value = i;
				else if (token.charAt(0) == '(')
					value = Integer.parseInt(token.substring(1, token.length() - 1));
				else
					value = Integer.parseInt(token);
				operands.push(value);
			}
		}
		while (!operators.empty()) {
			int y = operands.pop();
			int x = operands.pop();
			operands.push(evaluate(x, y, operators.pop()));
		}
		
		return operands.pop();
	}
	
	
	// Returns true if opA has higher precedence than opB.
	private static boolean canEvaluate(char opA, char opB) {
		if (opB == '+' || opB == '-')
			return opA == '+' || opA == '-' || opA == '*' || opA == '\\';
		else if (opB == '*' || opB == '\\')
			return opA == '*' || opA == '\\';
		else
			throw new AssertionError("Invalid operator");
	}
	
	
	private static int evaluate(int x, int y, char op) {
		switch (op) {
			case '+' : return x + y;
			case '-' : return x - y;
			case '*' : return x * y;
			case '\\': return x / y;
			default: throw new AssertionError("Invalid operator");
		}
	}
	
	
	private static boolean isOperator(String s) {
		return s.equals("+")
		    || s.equals("-")
		    || s.equals("*")
		    || s.equals("\\");
	}
	
	
	private static void expectNextToken(StringTokenizer st, String expectedToken) {
		String actualToken = st.nextToken();
		if (!expectedToken.equals(actualToken))
			throw new AssertionError(String.format("Expected \"%s\", got \"%s\"", expectedToken, actualToken));
	}
	
	
	
	private static String infile = "DATA41.txt";  // Specify null to use System.in
	private static String outfile = "OUT41.txt";  // Specify null to use System.out
	
	
	public static void main(String[] args) throws IOException {
		InputStream in0;
		if (infile != null) in0 = new FileInputStream(infile);
		else in0 = System.in;
		Reader in1 = new InputStreamReader(in0, "US-ASCII");
		BufferedReader in = new BufferedReader(in1);
		
		OutputStream out0;
		if (outfile != null) out0 = new FileOutputStream(outfile);
		else out0 = System.out;
		Writer out1 = new OutputStreamWriter(out0, "US-ASCII");
		PrintWriter out = new PrintWriter(out1, true);
		
		main(in, out);
		
		in.close();
		in1.close();
		in0.close();
		out.close();
		out1.close();
		out0.close();
	}
	
}