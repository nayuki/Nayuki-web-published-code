/* 
 * Gauss-Jordan elimination over any field (Java)
 * 
 * Copyright (c) 2017 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/gauss-jordan-elimination-over-any-field
 */


/* 
 * Run with no command line arguments.
 */
public class DemoMain {
	
	public static void main(String[] args) {
		// Set up the matrix
		Field<Fraction> f = RationalField.FIELD;
		Matrix<Fraction> mat = new Matrix<>(3, 4, f);
		mat.set(0, 0, new Fraction( 2, 1));
		mat.set(0, 1, new Fraction( 5, 1));
		mat.set(0, 2, new Fraction( 3, 1));
		mat.set(0, 3, new Fraction( 7, 1));
		mat.set(1, 0, new Fraction( 1, 1));
		mat.set(1, 1, new Fraction( 0, 1));
		mat.set(1, 2, new Fraction( 1, 1));
		mat.set(1, 3, new Fraction( 1, 1));
		mat.set(2, 0, new Fraction(-4, 1));
		mat.set(2, 1, new Fraction( 2, 1));
		mat.set(2, 2, new Fraction(-9, 1));
		mat.set(2, 3, new Fraction( 6, 1));
		
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
