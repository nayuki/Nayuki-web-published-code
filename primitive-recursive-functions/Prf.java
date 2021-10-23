/* 
 * Primitive recursive functions (Java)
 * 
 * Copyright (c) 2021 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/primitive-recursive-functions
 */

import java.util.Arrays;
import java.util.Objects;


public abstract class Prf {
	
	/*---- Instance methods ----*/
	
	public Prf() {}
	
	// We can use long instead of bigint because PRFs work in unary,
	// so it'll take forever to overflow a long anyway
	public abstract long eval(long... xs);
	
	public abstract String toString();
	
	
	
	/*---- Constants/factories for primitive recursive functions ----*/
	
	// Zero function: Z(x) = 0
	public static final Prf Z = new Prf() {
		public long eval(long... xs) {
			if (xs.length != 1 || xs[0] < 0)
				throw new IllegalArgumentException();
			return 0;
		}
		public String toString() {
			return "Z";
		}
	};
	
	
	// Successor function: S(x) = x + 1
	public static final Prf S = new Prf() {
		public long eval(long... xs) {
			if (xs.length != 1 || xs[0] < 0)
				throw new IllegalArgumentException();
			return xs[0] + 1;
		}
		public String toString() {
			return "S";
		}
	};
	
	
	// Projection function: I_{n,i}(x_0, ..., x_{n-1}) = x_i
	// n is the arity of the function, with n > 0. i is the index to take.
	public static Prf I(final int n, final int i) {
		if (!(0 <= i && i < n))
			throw new IllegalArgumentException();
		return new Prf() {
			public long eval(long... xs) {
				if (xs.length != n)
					throw new IllegalArgumentException();
				for (long x : xs) {
					if (x < 0)
						throw new IllegalArgumentException();
				}
				return xs[i];
			}
			public String toString() {
				return String.format("I(%d,%d)", n, i);
			}
		};
	}
	
	
	// Composition function: C_{f, g_0, ..., g_{k-1}}(xs) = f(g_0(xs), ..., g_{k-1}(xs))
	public static Prf C(final Prf f, Prf... gs) {
		Objects.requireNonNull(f);
		Objects.requireNonNull(gs);
		if (gs.length == 0)
			throw new IllegalArgumentException();
		final Prf[] myGs = gs.clone();  // Defensive copy
		for (Prf g : myGs)
			Objects.requireNonNull(g);
		return new Prf() {
			public long eval(long... xs) {
				long[] temp = new long[myGs.length];
				for (int i = 0; i < myGs.length; i++)
					temp[i] = myGs[i].eval(xs);
				return f.eval(temp);
			}
			public String toString() {
				StringBuilder sb = new StringBuilder("C(").append(f).append(", [");
				boolean head = true;
				for (Prf g : myGs) {
					if (head) head = false;
					else sb.append(", ");
					sb.append(g);
				}
				return sb.append("])").toString();
			}
		};
	}
	
	
	// Primitive recursion: R_{f,g}(y, xs) = if (y == 0) then (f xs) else g(R_{f,g}(y-1, xs), y-1, xs)
	public static Prf R(final Prf f, final Prf g) {
		return new Prf() {
			// Efficient evaluation - less iteration overhead (faster) and does not recurse on self (constant stack space)
			public long eval(long... xs) {
				if (xs.length < 2)
					throw new IllegalArgumentException();
				long val = f.eval(Arrays.copyOfRange(xs, 1, xs.length));
				long[] temp = new long[xs.length + 1];
				System.arraycopy(xs, 1, temp, 2, xs.length - 1);
				for (long i = 0, n = xs[0]; i < n; i++) {
					temp[0] = val;
					temp[1] = i;
					val = g.eval(temp);
				}
				return val;
			}
			// Naive evaluation - directly from the mathematical definition
			public long evalNaive(long... xs) {
				if (xs.length < 2)
					throw new IllegalArgumentException();
				long y = xs[0];
				if (y == 0)
					return f.eval(Arrays.copyOfRange(xs, 1, xs.length));
				else {
					long[] tempA = xs.clone();
					tempA[0] = y - 1;
					long[] tempB = new long[xs.length + 1];
					tempB[0] = eval(tempA);
					System.arraycopy(tempA, 0, tempB, 1, tempA.length);
					return g.eval(tempB);
				}
			}
			public String toString() {
				return String.format("R(%s, %s)", f, g);
			}
		};
	}
	
	
	
	/*---- Library of primitive recursive functions ----*/
	
	// The ordering is unnatural (especially compared to the Haskell version) because some functions depend on others, and the dependency must be at the top.
	
	/*-- Early functions --*/
	
	// Constant: konst_{n}(x) = n
	// This is actually a PRF generator
	public static Prf konst(int n) {
		if (n < 0)
			throw new IllegalArgumentException();
		else if (n == 0)
			return Z;
		else
			return C(S, konst(n - 1));
	}
	
	// Is zero: z(x, y) = if x == 0 then 1 else 0
	public static final Prf z = C(R(konst(1), C(Z, I(3,0))), I(1,0), Z);
	
	// Multiplex/select: mux(x, y, z) = if x == true then y else z. (x is Boolean; y and z are numbers)
	public static final Prf mux = R(I(2,1), I(4,2));
	
	
	/*-- Boolean functions --*/
	// 0 means false, 1 means true, and all other input values yield arbitrary output values
	
	// Negation (NOT): not(x)
	public static final Prf not = z;
	
	// Conjunction (AND): and(x, y)
	public static final Prf and = R(Z, I(3,2));
	
	// Disjunction (OR): or(x, y)
	public static final Prf or = R(I(1,0), C(S, I(3,1)));
	
	// Exclusive OR (XOR): xor(x, y)
	public static final Prf xor = R(I(1,0), C(not, I(3,2)));
	
	
	/*-- Arithmetic functions --*/
	
	// Predecessor: pred(0) = 0; pred(x) = x - 1
	public static final Prf pred = C(R(Z, I(3,1)), I(1,0), Z);
	
	// Addition/sum: add(x, y) = x + y
	public static final Prf add = R(I(1,0), C(S, I(3,0)));
	
	// Reverse subtraction: subrev(x, y) = max(y - x, 0)
	public static final Prf subrev = R(I(1,0), C(pred, I(3,0)));
	
	// Subtraction/difference: sub(x, y) = max(x - y, 0)
	public static final Prf sub = C(subrev, I(2,1), I(2,0));
	
	// Absolute difference: diff(x, y) = abs(x - y)
	public static final Prf diff = C(add, sub, subrev);
	
	// Minimum: min(x, y) = if x <= y then x else y
	public static final Prf min = C(subrev, subrev, I(2,1));
	
	// Maximum: max(x, y) = if x >= y then x else y
	public static final Prf max = C(add, subrev, I(2,0));
	
	// Multiplication/product: mul(x, y) = x * y
	public static final Prf mul = R(Z, C(add, I(3,0), I(3,2)));
	
	// Power/exponentiation: pow(x, y) = x ^ y
	public static final Prf pow = C(R(konst(1), C(mul, I(3,2), I(3,0))), I(2,1), I(2,0));
	
	// Factorial: factorial(x) = x!
	public static final Prf factorial = C(R(konst(1), C(mul, C(S, I(3,1)), I(3,0))), I(1,0), Z);
	
	
	/*-- Comparison functions --*/
	// Every function returns only Boolean values, i.e. 0 or 1
	
	// Is nonzero: nz(x) = if x == 0 then 0 else 1
	public static final Prf nz = C(R(Z, C(konst(1), I(3,0))), I(1,0), Z);
	
	// Equal: eq(x, y) = if x == y then 1 else 0
	public static final Prf eq = C(z, diff);
	
	// Not equal: neq(x, y) = if x != y then 1 else 0
	public static final Prf neq = C(nz, diff);
	
	// Less than: lt(x, y) = if x < y then 1 else 0
	public static final Prf lt = C(nz, subrev);
	
	// Less than or equal: le(x, y) = if x <= y then 1 else 0
	public static final Prf le = C(z, sub);
	
	// Greater than: gt(x, y) = if x > y then 1 else 0
	public static final Prf gt = C(nz, sub);
	
	// Greater than or equal: ge(x, y) = if x >= y then 1 else 0
	public static final Prf ge = C(z, subrev);
	
	
	/*-- Late functions --*/
	
	// Is even: even(x) = if x mod 2 == 0 then 1 else 0
	public static final Prf even = C(R(konst(1), C(not, I(3,0))), I(1,0), Z);
	
	// Is odd: odd(x) = if x mod 2 == 1 then 1 else 0
	public static final Prf odd = C(R(Z, C(not, I(3,0))), I(1,0), Z);
	
	// Square root: sqrt(x) = floor(sqrt(x))
	public static final Prf sqrt = C(R(Z, C(mux, C(le, C(mul, C(S, I(3,0)), C(S, I(3,0))), I(3,2)), C(S, I(3,0)), I(3,0))), I(1,0), I(1,0));
	
	// Logarithm: log(x, y) = if x >= 2 then (if y >= 1 then floor(ln(y) / ln(x)) else 0) else y
	public static final Prf log = C(R(C(Z, I(2,0)), C(mux, C(le, C(pow, I(4,2), C(S, I(4,0))), I(4,3)), C(S, I(4,0)), I(4,0))), I(2,1), I(2,0), I(2,1));
	
	// Truncating division: div(x, y) = if y != 0 then floor(x / y) else x
	public static final Prf div = C(R(C(Z, I(2,0)), C(mux, C(le, C(mul, C(S, I(4,0)), I(4,3)), I(4,2)), C(S, I(4,0)), I(4,0))), I(2,0), I(2,0), I(2,1));
	
	// Modulo: mod(x, y) = if y != 0 then (x mod y) else x
	public static final Prf mod = C(R(I(2,0), C(mux, C(ge, I(4,0), I(4,3)), C(sub, I(4,0), I(4,3)), I(4,0))), I(2,0), I(2,0), I(2,1));
	
	// Is divisible: divisible(x, y) = if (y > 0 and x mod y == 0) or x == 0 then 1 else 0
	public static final Prf divisible = C(z, mod);
	
	// Is prime: prime(x) = if x is prime then 1 else 0
	public static final Prf prime = C(eq, C(R(Z, C(add, C(divisible, I(3,2), I(3,1)), I(3,0))), I(1,0), I(1,0)), konst(1));
	
	// Greatest common divisor: gcd(x, y) = if (x != 0 or y != 0) then (largest z such that z divides x and z divides y) else 0
	public static final Prf gcd = C(R(C(Z, I(2,0)), C(mux, C(and, C(divisible, I(4,2), I(4,1)), C(divisible, I(4,3), I(4,1))), I(4,1), I(4,0))), C(S, max), I(2,0), I(2,1));
	
	// Least common multiple: lcm(x, y) = if (x != 0 and y != 0) then (smallest z such that x divides z and y divides z) else 0
	public static final Prf lcm = C(R(C(Z, I(2,0)), C(mux, C(and, C(nz, I(4,0)), C(and, C(divisible, I(4,0), I(4,2)), C(divisible, I(4,0), I(4,3)))), I(4,0), I(4,1))), C(S, mul), I(2,0), I(2,1));
	
	// Divisibility count: divisiblecount(x, y) =
	//     if x == 0 or y == 0 then 0
	//     elseif y >= 2 then (the highest power of y that divides x)
	//     else y == 1 then x
	public static final Prf divisiblecount = C(R(C(Z, I(2,0)), C(mux, C(divisible, I(4,2), C(pow, I(4,3), C(S, I(4,0)))), C(S, I(4,0)), I(4,0))), I(2,0), I(2,0), I(2,1));
	
	// Nth prime: nthprime(0) = 2, nthprime(1) = 3, nthprime(2) = 5, nthprime(3) = 7, nthprime(4) = 11, ...
	public static final Prf nthprime = C(mux, I(1,0), C(R(Z, C(mux, C(even, I(3,0)), C(mux, C(prime, I(3,1)), C(mux, C(eq, I(3,0), C(add, I(3,2), I(3,2))), I(3,1), C(S, C(S, I(3,0)))), I(3,0)), I(3,0))), C(pow, konst(2), C(S, I(1,0))), I(1,0)), konst(2));
	
	// Fibonacci number: fibonacci(0) = 0, fibonacci(1) = 1, fibonacci(2) = 1, fibonacci(3) = 2, fibonacci(4) = 3, fibonacci(5) = 5, ...
	// Private: fib2(n) = fibonacci(n) | fibonacci(n+1)<<n
	private static final Prf fib2 = R(konst(1), C(C(C(add, I(3,0), C(mul, C(add, I(3,0), I(3,1)), I(3,2))), C(div, I(3,0), I(3,2)), C(mod, I(3,0), I(3,2)), C(add, I(3,2), I(3,2))), I(3,0), I(3,1), C(pow, C(konst(2), I(3,0)), I(3,1))));
	public static final Prf fibonacci = C(mod, C(fib2, I(1,0), Z), C(pow, konst(2), I(1,0)));
	
	
	/*-- Bitwise functions --*/
	
	// Left shift: shl(x, y) = x << y
	public static final Prf shl = C(mul, I(2,0), C(pow, C(konst(2), I(2,0)), I(2,1)));
	
	// Right shift: shr(x, y) = x >> y
	public static final Prf shr = C(div, I(2,0), C(pow, C(konst(2), I(2,0)), I(2,1)));
	
	// Private: log2p1(x) = if x != 0 then (floor(lg(x)) + 1) else 1
	private static final Prf log2p1 = C(S, C(log, konst(2), I(1,0)));
	// Private: bitCombine f (x, y, s) = f(floor(x/s), floor(y/s)) * s. (This combines x and y at bit position log2(s) with the Boolean function f. The scaler s must be a power of 2.)
	private static Prf bitCombine(Prf f) {
		return C(mul, C(f, C(odd, C(div, I(3,0), I(3,2))), C(odd, C(div, I(3,1), I(3,2)))), I(3,2));
	}
	// Private: Takes a binary Boolean PRF (i.e. {0,1}*{0,1} -> {0,1}) and produces an integer PRF that applies it to each pair of corresponding bits in x and y
	private static Prf makeBitwiseOp(Prf f) {
		return C(R(C(Z, I(2,0)), C(add, I(4,0), C(bitCombine(f), I(4,2), I(4,3), C(pow, C(konst(2), I(4,0)), I(4,1))))), C(log2p1, C(max, I(2,0), I(2,1))), I(2,0), I(2,1));
	}
	
	// Bitwise AND: band(x, y) = x & y
	public static final Prf band = makeBitwiseOp(and);
	
	// Bitwise AND-NOT: bandnot(x, y) = x & ~y
	public static final Prf bandnot = makeBitwiseOp(C(R(I(1,0), C(Z, I(3,0))), I(2,1), I(2,0)));
	
	// Bitwise OR: bor(x, y) = x | y
	public static final Prf bor = makeBitwiseOp(or);
	
	// Bitwise XOR: bxor(x, y) = x ^ y
	public static final Prf bxor = makeBitwiseOp(xor);
	
	// Get bit: getbit(x, y) = (x >> y) & 1
	public static final Prf getbit = C(odd, shr);
	
}
