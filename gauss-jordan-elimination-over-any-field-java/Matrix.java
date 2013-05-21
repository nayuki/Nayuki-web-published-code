/* 
 * Gauss-Jordan elimination over any field (Java)
 * Copyright (c) 2013 Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/gauss-jordan-elimination-over-any-field-java
 */


public final class Matrix<T> implements Cloneable {
	
	/* Basic matrix implementation */
	
	// The values of the matrix, initially null
	private Object[][] values;
	
	// The field used to operate on the values in the matrix
	private Field<T> f;
	
	
	
	/**
	 * Constructs a blank matrix with the specified number of rows and columns, with operations from the specified field.
	 * @param rows the number of rows in this matrix
	 * @param cols the number of columns in this matrix
	 * @param f the field used to operate on the values in this matrix
	 * @throws IllegalArgumentException if {@code rows} &le; 0 or {@code cols} &le; 0
	 */
	public Matrix(int rows, int cols, Field<T> f) {
		if (rows <= 0 || cols <= 0)
			throw new IllegalArgumentException("Invalid number of rows or columns");
		
		values = new Object[rows][cols];
		this.f = f;
	}
	
	
	
	/**
	 * Returns the number of rows in this matrix.
	 * @return the number of rows in this matrix
	 */
	public int rowCount() {
		return values.length;
	}
	
	
	/**
	 * Returns the number of columns in this matrix.
	 * @return the number of columns in this matrix
	 */
	public int columnCount() {
		return values[0].length;
	}
	
	
	/**
	 * Returns the element at the specified location in this matrix.
	 * @param row the row to read from
	 * @param col the column to read from
	 * @return the element at the specified location in this matrix
	 * @throws IndexOutOfBoundsException if the specified row or column exceeds the bounds of the matrix
	 */
	@SuppressWarnings("unchecked")
	public T get(int row, int col) {
		if (row < 0 || row >= values.length || col < 0 || col >= values[row].length)
			throw new IndexOutOfBoundsException("Row or column index out of bounds");
		return (T)values[row][col];
	}
	
	
	/**
	 * Stores the specified element at the specified location in this matrix.
	 * @param row the row to write to
	 * @param col the column to write to
	 * @param val the element value to write
	 * @throws IndexOutOfBoundsException if the specified row or column exceeds the bounds of the matrix
	 */
	public void set(int row, int col, T val) {
		if (row < 0 || row >= values.length || col < 0 || col >= values[0].length)
			throw new IndexOutOfBoundsException("Row or column index out of bounds");
		values[row][col] = val;
	}
	
	
	/**
	 * Returns a clone of this matrix. The field and underlying values are shallow-copied because they are assumed to be immutable.
	 * @return a clone of this matrix
	 */
	public Matrix<T> clone() {
		int rows = rowCount();
		int cols = columnCount();
		Matrix<T> result = new Matrix<T>(rows, cols, f);
		for (int i = 0; i < rows; i++) {
			for (int j = 0; j < cols; j++)
				result.set(i, j, get(i, j));
		}
		return result;
	}
	
	
	/* Basic matrix operations */
	
	/**
	 * Swaps the two specified rows of this matrix.
	 * @param row0 one row to swap
	 * @param row1 the other row to swap
	 * @throws IndexOutOfBoundsException if a specified row exceeds the bounds of the matrix
	 */
	public void swapRows(int row0, int row1) {
		if (row0 < 0 || row0 >= values.length || row1 < 0 || row1 >= values.length)
			throw new IndexOutOfBoundsException("Row index out of bounds");
		if (row0 == row1)
			return;
		for (int j = 0, cols = columnCount(); j < cols; j++) {
			@SuppressWarnings("unchecked")
			T temp = (T)values[row0][j];
			values[row0][j] = values[row1][j];
			values[row1][j] = temp;
		}
	}
	
	
	/**
	 * Multiplies the specified row in this matrix by the specified factor. In other words, row *= factor.
	 * @param row the row index to operate on
	 * @param factor the factor to multiply by
	 */
	public void multiplyRow(int row, T factor) {
		for (int j = 0, cols = columnCount(); j < cols; j++)
			set(row, j, f.multiply(get(row, j), factor));
	}
	
	
	/**
	 * Adds the first specified row in this matrix multiplied by the specified factor to the second specified row.
	 * In other words, destRow += srcRow * factor.
	 * @param srcRow the index of the row to read and multiply
	 * @param destRow the index of the row to accumulate to
	 * @param factor the factor to multiply by
	 */
	public void addRows(int srcRow, int destRow, T factor) {
		for (int j = 0, cols = columnCount(); j < cols; j++)
			set(destRow, j, f.add(get(destRow, j), f.multiply(get(srcRow, j), factor)));
	}
	
	
	/**
	 * Returns the product of this matrix with the specified matrix. (Remember that matrix multiplication is not commutative.)
	 * @param other the second matrix multiplicand
	 * @return the product of this matrix with the specified matrix
	 */
	public Matrix<T> multiply(Matrix<T> other) {
		if (columnCount() != other.rowCount())
			throw new IllegalArgumentException("Incompatible matrix sizes for multiplication");
		int rows = rowCount();
		int cols = other.columnCount();
		int cells = columnCount();
		Matrix<T> result = new Matrix<T>(rows, cols, f);
		for (int i = 0; i < rows; i++) {
			for (int j = 0; j < cols; j++) {
				T sum = f.zero();
				for (int k = 0; k < cells; k++)
					sum = f.add(f.multiply(get(i, k), other.get(k, j)), sum);
				result.set(i, j, sum);
			}
		}
		return result;
	}
	
	
	/* Advanced matrix operation methods */
	
	/**
	 * Converts this matrix to reduced row echelon form (RREF) using Gauss-Jordan elimination.
	 */
	public void reducedRowEchelonForm() {
		int rows = rowCount();
		int cols = columnCount();
		
		// Compute row echelon form (REF)
		int numPivots = 0;
		for (int j = 0; j < cols; j++) {  // For each column
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
		for (int i = rows - 1; i >= 0; i--) {
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
	
	
	/**
	 * Replaces the values of this matrix with the inverse of this matrix.
	 */
	public void invert() {
		int rows = rowCount();
		int cols = columnCount();
		if (rows != cols)
			throw new IllegalStateException("Matrix dimensions are not square");
		
		Matrix<T> temp = new Matrix<T>(rows, cols * 2, f);
		for (int i = 0; i < rows; i++) {
			for (int j = 0; j < cols; j++) {
				temp.set(i, j, get(i, j));
				temp.set(i, j + cols, i == j ? f.one() : f.zero());
			}
		}
		
		temp.reducedRowEchelonForm();
		
		for (int i = 0; i < rows; i++) {
			for (int j = 0; j < cols; j++) {
				if (!f.equals(temp.get(i, j), i == j ? f.one() : f.zero()))
					throw new IllegalStateException("Matrix is not invertible");
			}
		}
		
		for (int i = 0; i < rows; i++) {
			for (int j = 0; j < cols; j++)
				set(i, j, temp.get(i, j + cols));
		}
	}
	
	
	/**
	 * Returns the determinant of this matrix, and as a side effect converts the matrix to reduced row echelon form (RREF).
	 * @return the determinant of this matrix
	 */
	public T determinantAndRref() {
		int rows = rowCount();
		int cols = columnCount();
		if (rows != cols)
			throw new IllegalStateException("Matrix dimensions are not square");
		
		T det = f.one();
		
		// Compute row echelon form (REF)
		int numPivots = 0;
		for (int j = 0; j < cols; j++) {  // For each column
			// Find a pivot row for this column
			int pivotRow = numPivots;
			while (pivotRow < rows && f.equals(get(pivotRow, j), f.zero()))
				pivotRow++;
			if (pivotRow == rows)
				continue;  // Cannot eliminate on this column
			swapRows(numPivots, pivotRow);
			if (numPivots != pivotRow)
				det = f.negate(det);
			pivotRow = numPivots;
			numPivots++;
			
			// Simplify the pivot row
			T temp = get(pivotRow, j);
			multiplyRow(pivotRow, f.reciprocal(temp));
			det = f.multiply(temp, det);
			
			// Eliminate rows below
			for (int i = pivotRow + 1; i < rows; i++)
				addRows(pivotRow, i, f.negate(get(i, j)));
		}
		
		// Compute reduced row echelon form (RREF)
		for (int i = rows - 1; i >= 0; i--) {
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
		
		for (int i = 0; i < rows; i++)
			det = f.multiply(get(i, i), det);
		return det;
	}
	
}
