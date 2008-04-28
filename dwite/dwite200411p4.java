import java.io.*;
import java.util.*;


// DWITE - November 2004 - Problem 4: For Loops
public class dwite200411p4 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		List<String> formula = new ArrayList<String>();
		StringTokenizer st;
		
		st = new StringTokenizer(in.readLine(), " ");  // "sum = value"
		if (!st.nextToken().equals("sum")) throw new AssertionError();
		if (!st.nextToken().equals("=")) throw new AssertionError();
		int sum = Integer.parseInt(st.nextToken());
		
		st = new StringTokenizer(in.readLine(), " ");  // "For i = start To finish"
		if (!st.nextToken().equals("For")) throw new AssertionError();
		if (!st.nextToken().equals("i")) throw new AssertionError();
		if (!st.nextToken().equals("=")) throw new AssertionError();
		int start = Integer.parseInt(st.nextToken());
		if (!st.nextToken().equals("To")) throw new AssertionError();
		int finish = Integer.parseInt(st.nextToken());
		
		st = new StringTokenizer(in.readLine(), " ");  // "sum = formula"
		if (!st.nextToken().equals("sum")) throw new AssertionError();
		if (!st.nextToken().equals("=")) throw new AssertionError();
		while (st.hasMoreTokens())
			formula.add(st.nextToken());
		
		if (!in.readLine().equals("Next i")) throw new AssertionError();  // "Next i"
		
		for (int i = start; i <= finish; i++)
			sum = executeOnce(sum, i, formula);
		
		out.println(sum);
	}
	
	
	static int executeOnce(int sum, int i, List<String> formula) {
		// Dijkstra's shunting yard algorithm
		Stack<Integer> operands = new Stack<Integer>();
		Stack<Character> operators = new Stack<Character>();
		for (String token : formula) {
			// Operators
			if (isOperator(token)) {
				while (!operators.empty() && canEvaluate(operators.peek(), token.charAt(0))) {
					int y = operands.pop();
					int x = operands.pop();
					operands.push(evaluate(x, y, operators.pop()));
				}
				operators.push(token.charAt(0));
			// Values
			} else {
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
	static boolean canEvaluate(char opA, char opB) {
		if (opB == '+' || opB == '-')
			return opA == '+' || opA == '-' || opA == '*' || opA == '\\';
		else if (opB == '*' || opB == '\\')
			return opA == '*' || opA == '\\';
		else
			throw new AssertionError();
	}
	
	
	static int evaluate(int x, int y, char op) {
		switch (op) {
			case '+':
				return x + y;
			case '-':
				return x - y;
			case '*':
				return x * y;
			case '\\':
				return x / y;
			default:
				throw new AssertionError();
		}
	}
	
	
	static boolean isOperator(String s) {
		return s.equals("+")
		    || s.equals("-")
		    || s.equals("*")
		    || s.equals("\\");
	}
	
	
	
	static String infile = "DATA41.txt";  // Specify null to use System.in
	static String outfile = "OUT41.txt";  // Specify null to use System.out
	
	
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