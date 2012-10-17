/* 
 * DWITE - December 2009 - Problem 1: Quiz Time
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */


public final class dwite200912p1 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA1.txt", "OUT1.txt", new dwite200912p1());
	}
	
	
	public void run() {
		String[] output = new String[5];
		for (int i = 0; i < output.length; i++) {
			String question = io.readLine();
			int order = io.readIntLine();
			output[order - 1] = question;
		}
		
		for (String s : output)
			io.println(s);
	}
	
}
