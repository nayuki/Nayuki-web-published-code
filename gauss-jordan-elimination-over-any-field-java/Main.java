/* 
 * Gauss-Jordan elimination over any field (Java)
 * Copyright (c) 2013 Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/gauss-jordan-elimination-over-any-field-java
 */


public class Main {
	
	public static void main(String[] args) {
		// Set up the matrix
		Matrix<Fraction> mat = new Matrix<Fraction>(3, 4, RationalField.FIELD);
		mat.set(0, 0, new Fraction(2, 1));
		mat.set(0, 1, new Fraction(5, 1));
		mat.set(0, 2, new Fraction(3, 1));
		mat.set(0, 3, new Fraction(7, 1));
		mat.set(1, 0, new Fraction(1, 1));
		mat.set(1, 1, new Fraction(0, 1));
		mat.set(1, 2, new Fraction(1, 1));
		mat.set(1, 3, new Fraction(1, 1));
		mat.set(2, 0, new Fraction(-4, 1));
		mat.set(2, 1, new Fraction(2, 1));
		mat.set(2, 2, new Fraction(-9, 1));
		mat.set(2, 3, new Fraction(6, 1));
		
		// Gauss-Jordan elimination
		mat.reducedRowEchelonForm();
		
		// Print resulting matrix
		for (int i = 0; i < mat.rowCount(); i++) {
			for (int j = 0; j < mat.columnCount(); j++) {
				if (j > 0)
					System.out.print(" ");
				System.out.print(mat.get(i, j));
			}
			System.out.println();
		}
	}
	
}
