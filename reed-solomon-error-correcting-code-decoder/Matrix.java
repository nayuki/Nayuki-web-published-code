/* 
 * Reed-Solomon error-correcting code decoder
 * 
 * Copyright (c) 2017 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/reed-solomon-error-correcting-code-decoder
 */


/**
 * Represents a mutable matrix of field elements, supporting linear algebra operations.
 * Note that the dimensions of a matrix cannot be changed after construction. Not thread-safe.
 */
public final class Matrix<E> implements Cloneable {
	
	/*---- Fields ----*/
	
	// The values of the matrix stored in row-major order, with each element initially null.
	private Object[][] values;
	
	// The field used to operate on the values in the matrix.
	private final Field<E> f;
	
	
	
	/*---- Constructors ----*/
	
	/**
	 * Constructs a blank matrix with the specified number of rows and columns,
	 * with operations from the specified field. All the elements are initially {@code null}.
	 * @param rows the number of rows in this matrix
	 * @param cols the number of columns in this matrix
	 * @param f the field used to operate on the values in this matrix
	 * @throws IllegalArgumentException if {@code rows} &le; 0 or {@code cols} &le; 0
	 * @throws NullPointerException if {@code f} is {@code null}
	 */
	public Matrix(int rows, int cols, Field<E> f) {
		if (rows <= 0 || cols <= 0)
			throw new IllegalArgumentException("Invalid number of rows or columns");
		if (f == null)
			throw new NullPointerException();
		
		values = new Object[rows][cols];
		this.f = f;
	}
	
	
	
	/*---- Basic matrix methods ----*/
	
	/**
	 * Returns the number of rows in this matrix, which is positive.
	 * @return the number of rows in this matrix
	 */
	public int rowCount() {
		return values.length;
	}
	
	
	/**
	 * Returns the number of columns in this matrix, which is positive.
	 * @return the number of columns in this matrix
	 */
	public int columnCount() {
		return values[0].length;
	}
	
	
	/**
	 * Returns the element at the specified location in this matrix. The result may be {@code null}.
	 * @param row the row to read from (0-based indexing)
	 * @param col the column to read from (0-based indexing)
	 * @return the element at the specified location in this matrix (possibly {@code null})
	 * @throws IndexOutOfBoundsException if the specified row or column exceeds the bounds of the matrix
	 */
	@SuppressWarnings("unchecked")
	public E get(int row, int col) {
		if (row < 0 || row >= values.length || col < 0 || col >= values[row].length)
			throw new IndexOutOfBoundsException("Row or column index out of bounds");
		return (E)values[row][col];
	}
	
	
	/**
	 * Stores the specified element at the specified location in this matrix. The value to store can be {@code null}.
	 * @param row the row to write to (0-based indexing)
	 * @param col the column to write to (0-based indexing)
	 * @param val the element value to write (possibly {@code null})
	 * @throws IndexOutOfBoundsException if the specified row or column exceeds the bounds of the matrix
	 */
	public void set(int row, int col, E val) {
		if (row < 0 || row >= values.length || col < 0 || col >= values[0].length)
			throw new IndexOutOfBoundsException("Row or column index out of bounds");
		values[row][col] = val;
	}
	
	
	/**
	 * Returns a string representation of this matrix. The format is subject to change.
	 * @return a string representation of this matrix
	 */
	public String toString() {
		StringBuilder sb = new StringBuilder("[");
		for (int i = 0; i < rowCount(); i++) {
			if (i > 0)
				sb.append(",\n ");
			sb.append("[");
			for (int j = 0; j < columnCount(); j++) {
				if (j > 0)
					sb.append(", ");
				sb.append(values[i][j]);
			}
			sb.append("]");
		}
		return sb.append("]").toString();
	}
	
	
	
	/*---- Simple matrix row operations ----*/
	
	/**
	 * Swaps the two specified rows of this matrix. If the two row indices are the same, the swap is a no-op.
	 * Any matrix element can be {@code null} when performing this operation.
	 * @param row0 one row to swap (0-based indexing)
	 * @param row1 the other row to swap (0-based indexing)
	 * @throws IndexOutOfBoundsException if a specified row exceeds the bounds of the matrix
	 */
	public void swapRows(int row0, int row1) {
		if (row0 < 0 || row0 >= values.length || row1 < 0 || row1 >= values.length)
			throw new IndexOutOfBoundsException("Row index out of bounds");
		Object[] temp = values[row0];
		values[row0] = values[row1];
		values[row1] = temp;
	}
	
	
	/**
	 * Multiplies the specified row in this matrix by the specified factor. In other words, row *= factor.
	 * The elements of the specified row should all be non-{@code null} when performing this operation.
	 * @param row the row index to operate on (0-based indexing)
	 * @param factor the factor to multiply by
	 * @throws IndexOutOfBoundsException if the specified row exceeds the bounds of the matrix
	 */
	public void multiplyRow(int row, E factor) {
		if (row < 0 || row >= values.length)
			throw new IndexOutOfBoundsException("Row index out of bounds");
		for (int j = 0, cols = columnCount(); j < cols; j++)
			set(row, j, f.multiply(get(row, j), factor));
	}
	
	
	/**
	 * Adds the first specified row in this matrix multiplied by the specified factor to the second specified row.
	 * In other words, destRow += srcRow * factor. The elements of the specified two rows
	 * should all be non-{@code null} when performing this operation.
	 * @param srcRow the index of the row to read and multiply (0-based indexing)
	 * @param destRow the index of the row to accumulate to (0-based indexing)
	 * @param factor the factor to multiply by
	 * @throws IndexOutOfBoundsException if a specified row exceeds the bounds of the matrix
	 */
	public void addRows(int srcRow, int destRow, E factor) {
		if (srcRow < 0 || srcRow >= values.length || destRow < 0 || destRow >= values.length)
			throw new IndexOutOfBoundsException("Row index out of bounds");
		for (int j = 0, cols = columnCount(); j < cols; j++)
			set(destRow, j, f.add(get(destRow, j), f.multiply(get(srcRow, j), factor)));
	}
	
	
	
	/*---- Advanced matrix operations ----*/
	
	/**
	 * Converts this matrix to reduced row echelon form (RREF) using Gauss-Jordan elimination.
	 * All elements of this matrix should be non-{@code null} when performing this operation.
	 * Always succeeds, as long as the field follows the mathematical rules and does not throw an exception.
	 * The time complexity of this operation is <var>O</var>(rows &times; cols &times; min(rows, cols)).
	 */
	public void reducedRowEchelonForm() {
		int rows = rowCount();
		int cols = columnCount();
		
		// Compute row echelon form (REF)
		int numPivots = 0;
		for (int j = 0; j < cols && numPivots < rows; j++) {  // For each column
			// Find a pivot row for this column
			int pivotRow = numPivots;
			while (pivotRow < rows && f.equals(get(pivotRow, j), f.zero()))
				pivotRow++;
			if (pivotRow == rows)
				continue;  // Cannot eliminate on this column
			swapRows(numPivots, pivotRow);
			pivotRow = numPivots;
			numPivots++;
			
			// Simplify the pivot row
			multiplyRow(pivotRow, f.reciprocal(get(pivotRow, j)));
			
			// Eliminate rows below
			for (int i = pivotRow + 1; i < rows; i++)
				addRows(pivotRow, i, f.negate(get(i, j)));
		}
		
		// Compute reduced row echelon form (RREF)
		for (int i = numPivots - 1; i >= 0; i--) {
			// Find pivot
			int pivotCol = 0;
			while (pivotCol < cols && f.equals(get(i, pivotCol), f.zero()))
				pivotCol++;
			if (pivotCol == cols)
				continue;  // Skip this all-zero row
			
			// Eliminate rows above
			for (int j = i - 1; j >= 0; j--)
				addRows(i, j, f.negate(get(j, pivotCol)));
		}
	}
	
}
