/* 
 * Gauss-Jordan elimination over any field (Java)
 * 
 * Copyright (c) 2017 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/gauss-jordan-elimination-over-any-field
 */

import static org.junit.Assert.assertEquals;
import java.util.Random;
import org.junit.Test;


public final class MatrixTest {
	
	private static PrimeField field = new PrimeField(11);
	
	private static Random random = new Random();
	
	
	@Test public void testSingle0() {
		int[][] in = {{0}};
		int[][] out = {{0}};
		testReduceMatrix(in, out);
	}
	
	@Test public void testSingle1() {
		int[][] in = {{1}};
		int[][] out = {{1}};
		testReduceMatrix(in, out);
	}
	
	@Test public void testSingle2() {
		int[][] in = {{2, 3}};
		int[][] out = {{1, 7}};
		testReduceMatrix(in, out);
	}
	
	@Test public void testSingle3() {
		int[][] in = {{9, 2, 7}};
		int[][] out = {{1, 10, 2}};
		testReduceMatrix(in, out);
	}
	
	
	@Test public void testDouble0() {
		int[][] in = {{1, 0}, {0, 1}};
		int[][] out = {{1, 0}, {0, 1}};
		testReduceMatrix(in, out);
	}
	
	@Test public void testDouble1() {
		int[][] in = {{0, 1}, {1, 0}};
		int[][] out = {{1, 0}, {0, 1}};
		testReduceMatrix(in, out);
	}
	
	@Test public void testDouble2() {
		int[][] in = {{2, 3}, {4, 5}};
		int[][] out = {{1, 0}, {0, 1}};
		testReduceMatrix(in, out);
	}
	
	@Test public void testDouble3() {
		int[][] in = {{0, 2}, {0, 5}};
		int[][] out = {{0, 1}, {0, 0}};
		testReduceMatrix(in, out);
	}
	
	@Test public void testDouble4() {
		int[][] in = {{7, 3}, {2, 4}};
		int[][] out = {{1, 2}, {0, 0}};
		testReduceMatrix(in, out);
	}
	
	@Test public void testDouble5() {
		int[][] in = {{6, 1, 5}, {2, 4, 3}};
		int[][] out = {{1, 2, 0}, {0, 0, 1}};
		testReduceMatrix(in, out);
	}
	
	
	@Test public void testTriple0() {
		int[][] in = {{0, 0, 4}, {1, 0, 3}, {0, 8, 2}};
		int[][] out = {{1, 0, 0}, {0, 1, 0}, {0, 0, 1}};
		testReduceMatrix(in, out);
	}
	
	@Test public void testTriple1() {
		int[][] in = {{1, 1, 1, 1}, {1, 1, 2, 3}, {1, 2, 2, 2}};
		int[][] out = {{1, 0, 0, 0}, {0, 1, 0, 10}, {0, 0, 1, 2}};
		testReduceMatrix(in, out);
	}
	
	@Test public void testTriple2() {
		int[][] in = {{2, 5, 10, 1}, {7, 1, 6, 3}, {6, 4, 6, 6}};
		int[][] out = {{1, 8, 0, 8}, {0, 0, 1, 4}, {0, 0, 0, 0}};
		testReduceMatrix(in, out);
	}
	
	
	
	private static void testReduceMatrix(int[][] in, int[][] out) {
		Matrix<Integer> mat = new Matrix<>(in.length, in[0].length, field);
		for (int i = 0; i < in.length; i++) {
			for (int j = 0; j < in[i].length; j++)
				mat.set(i, j, in[i][j]);
		}
		
		mat.reducedRowEchelonForm();
		for (int i = 0; i < out.length; i++) {
			for (int j = 0; j < out[i].length; j++)
				assertEquals(out[i][j], (int)mat.get(i, j));
		}
	}
	
	
	
	@Test public void testDeterminant1() {
		for (int i = 0; i < field.size; i++) {
			Matrix<Integer> mat = new Matrix<>(1, 1, field);
			mat.set(0, 0, i);
			assertEquals(i, (int)mat.determinantAndRef());
		}
	}
	
	
	@Test public void testDeterminant2() {
		for (int i = 0; i < 1000; i++) {
			Matrix<Integer> mat = new Matrix<>(2, 2, field);
			mat.set(0, 0, random.nextInt(field.size));
			mat.set(0, 1, random.nextInt(field.size));
			mat.set(1, 0, random.nextInt(field.size));
			mat.set(1, 1, random.nextInt(field.size));
			Integer expect = field.subtract(field.multiply(mat.get(0, 0), mat.get(1, 1)), field.multiply(mat.get(0, 1), mat.get(1, 0)));
			assertEquals(expect, mat.determinantAndRef());
		}
	}
	
	
	@Test public void testDeterminants() {
		for (int i = 0; i < 10000; i++) {
			int size = (int)(Math.sqrt(random.nextDouble()) * 5) + 2;
			size = Math.max(Math.min(size, 6), 1);
			
			Matrix<Integer> mat = new Matrix<>(size, size, field);
			for (int j = 0; j < size; j++) {
				for (int k = 0; k < size; k++)
					mat.set(j, k, random.nextInt(field.size));
			}
			
			assertEquals(determinant(mat, 0, new boolean[size], field), mat.determinantAndRef());
		}
	}
	
	
	// Slow O(n^n) algorithm using cofactor expansion.
	private static <T> T determinant(Matrix<T> mat, int row, boolean[] colsUsed, Field<T> f) {
		if (row == mat.rowCount())
			return f.one();
		else {
			T sum = f.zero();
			for (int j = 0, k = 0, cols = mat.columnCount(); j < cols; j++) {
				if (!colsUsed[j]) {
					colsUsed[j] = true;
					T term = f.multiply(mat.get(row, j), determinant(mat, row + 1, colsUsed, f));
					colsUsed[j] = false;
					if (k % 2 == 1)
						term = f.negate(term);
					sum = f.add(term, sum);
					k++;
				}
			}
			return sum;
		}
	}
	
	
	@Test public void testInvert() {
		for (int i = 0; i < 10000; i++) {
			int size = (int)(Math.sqrt(random.nextDouble()) * 9) + 2;
			size = Math.max(Math.min(size, 10), 1);
			
			Matrix<Integer> mat = new Matrix<>(size, size, field);
			for (int j = 0; j < size; j++) {
				for (int k = 0; k < size; k++)
					mat.set(j, k, random.nextInt(field.size));
			}
			
			if (field.equals(mat.clone().determinantAndRef(), field.zero()))
				continue;
			
			Matrix<Integer> inverse = mat.clone();
			inverse.invert();
			
			Matrix<Integer> prod = mat.multiply(inverse);
			assertEquals(size, prod.rowCount());
			assertEquals(size, prod.columnCount());
			for (int j = 0; j < size; j++) {
				for (int k = 0; k < size; k++)
					assertEquals(j == k ? field.one() : field.zero(), prod.get(j, k));
			}
			
			prod = inverse.multiply(mat);
			assertEquals(size, prod.rowCount());
			assertEquals(size, prod.columnCount());
			for (int j = 0; j < size; j++) {
				for (int k = 0; k < size; k++)
					assertEquals(j == k ? field.one() : field.zero(), prod.get(j, k));
			}
		}
	}
	
}
