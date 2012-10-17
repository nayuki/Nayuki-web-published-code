/* 
 * DWITE - October 2004 - Problem 3: The Tallest in the Class
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;


public final class dwite200410p3 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA3", "OUT3", new dwite200410p3());
	}
	
	
	public void run() {
		// Read input
		List<Student> students = new ArrayList<Student>();
		int n = io.readIntLine();
		for (int i = 0; i < n; i++) {
			io.tokenizeLine();
			String name = io.readToken();
			double height = io.readDoubleToken();
			String unit = io.readToken();
			students.add(new Student(name, height, unit));
		}
		
		// Sort by height and write names to output
		Collections.sort(students);
		for (int i = 0; i < 5; i++)
			io.println(students.get(i).name);
		
		io.close();
	}
	
	
	
	private static class Student implements Comparable<Student> {
		
		public final String name;
		public final double height;  // In millimetres
		
		
		public Student(String name, double height, String unit) {
			this.name = name;
			if      (unit.equals( "m")) this.height = height * 1000;
			else if (unit.equals("dm")) this.height = height *  100;
			else if (unit.equals("cm")) this.height = height *   10;
			else if (unit.equals("mm")) this.height = height *    1;
			else throw new AssertionError("Invalid unit");
		}
		
		
		public int compareTo(Student s) {  // Compares by descending height, then by ascending name
			if (height != s.height)
				return Double.compare(s.height, height);
			else
				return name.compareTo(s.name);
		}
		
		public String toString() {
			return String.format("%s (%.0f mm)", name, height);
		}
		
	}
	
}
