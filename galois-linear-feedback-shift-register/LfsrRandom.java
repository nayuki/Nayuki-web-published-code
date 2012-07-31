/*
 * Galois linear feedback shift register (LFSR) in Java
 * Copyright (c) 2012 Nayuki Minase
 */

import java.math.BigInteger;
import java.util.Random;


/**
 * Galois LFSR random number generator. This can be used in place of java.util.Random.
 * In this class, a polynomial is represented as a BigInteger, where the coefficient of
 * the <var>x</var><sup><var>k</var></sup> term is represented by bit <var>k</var>.
 */
public class LfsrRandom extends Random {
	
	private BigInteger characteristic;
	private int degree;
	
	private BigInteger state;
	
	
	/**
	 * Constructs an LFSR with the specified characteristic polynomial and initial state polynomial.
	 * The characteristic polynomial must have degree at least 2. The state polynomial must have degree
	 * less than the degree of the characteristic polynomial, and must not be the zero polynomial.
	 * @param charistic the characteristic polynomial
	 * @param state the initial state polynomial
	 * @throws IllegalArgumentException if the polynomials do not satisfy the requirements
	 */
	public LfsrRandom(BigInteger charis, BigInteger state) {
		if (charis.signum() == -1)
			throw new IllegalArgumentException("Invalid characteristic polynomial - negative");
		if (charis.bitLength() < 2)
			throw new IllegalArgumentException("Invalid characteristic polynomial - degree too low");
		if (state.equals(BigInteger.ZERO))
			throw new IllegalArgumentException("Invalid state polynomial - all zero");
		if (state.bitLength() >= charis.bitLength())
			throw new IllegalArgumentException("Invalid state polynomial - degree >= char poly degree");
		
		characteristic = charis;
		degree = charis.bitLength() - 1;
		this.state = state;
	}
	
	
	public boolean nextBoolean() {
		boolean result = state.testBit(0);      // Use bit 0 in the LFSR state as the result
		state = state.shiftLeft(1);             // Multiply by x
		if (state.testBit(degree))              // If degree of state polynomial matches degree of characteristic polynomial
			state = state.xor(characteristic);  // Then subtract the characteristic polynomial from the state polynomial
		return result;
	}
	
	
	protected int next(int bits) {
		int result = 0;
		for (int i = 0; i < 32; i++)
			result = (result << 1) | (nextBoolean() ? 1 : 0);
		return result;
	}
	
	
	public void printDebug() {
		StringBuilder sb = new StringBuilder();
		sb.append("characteristic: degree=").append(degree).append("  poly = ");
		boolean head = true;
		for (int i = 0; i <= degree; i++) {
			if (characteristic.testBit(i)) {
				if (head) head = false;
				else sb.append(" + ");
				sb.append("x^" + i);
			}
		}
		sb.append(System.getProperty("line.separator")).append("state: degree=").append(state.bitLength() - 1).append("  poly = ");
		head = true;
		for (int i = 0; i <= degree; i++) {
			if (state.testBit(i)) {
				if (head) head = false;
				else sb.append(" + ");
				sb.append("x^" + i);
			}
		}
		System.out.println(sb);
	}
	
}
