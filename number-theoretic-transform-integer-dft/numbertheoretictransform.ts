/* 
 * Number-theoretic transform library (TypeScript)
 * 
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/number-theoretic-transform-integer-dft
 */


namespace numbertheoretictransform {
	
	/*---- High-level NTT functions ----*/
	
	// Returns the forward number-theoretic transform of the given vector with
	// respect to the given primitive nth root of unity under the given modulus.
	export function transform(invec: Readonly<Array<bigint>>, root: bigint, mod: bigint): Array<bigint> {
		const n: number = invec.length;
		let outvec: Array<bigint> = [];
		for (let i = 0; i < n; i++) {
			let sum: bigint = 0n;
			for (let j = 0; j < n; j++) {
				const k: bigint = BigInt(i * j % n);
				sum = (sum + invec[j] * powMod(root, k, mod)) % mod;
			}
			outvec.push(sum);
		}
		return outvec;
	}
	
	
	// Returns the inverse number-theoretic transform of the given vector with
	// respect to the given primitive nth root of unity under the given modulus.
	export function inverseTransform(invec: Readonly<Array<bigint>>, root: bigint, mod: bigint): Array<bigint> {
		let outvec: Array<bigint> = transform(invec, reciprocalMod(root, mod), mod);
		let scaler: bigint = reciprocalMod(BigInt(invec.length), mod);
		for (let i = 0; i < outvec.length; i++)
			outvec[i] = (outvec[i] * scaler) % mod;
		return outvec;
	}
	
	
	// Computes the forward number-theoretic transform of the given vector in place,
	// with respect to the given primitive nth root of unity under the given modulus.
	// The length of the vector must be a power of 2.
	export function transformRadix2(vector: Array<bigint>, root: bigint, mod: bigint): void {
		let n: number = vector.length;
		let levels: number = n.toString(2).length - 1;
		if (1 << levels != n)
			throw new RangeError("Length is not a power of 2");
		
		for (let i = 0; i < n; i++) {
			const j: number = reverseBits(i, levels);
			if (j > i) {
				const temp: bigint = vector[i];
				vector[i] = vector[j];
				vector[j] = temp;
			}
		}
		
		let powTable: Array<bigint> = new Array<bigint>(Math.floor(n / 2));
		{
			let temp = 1n;
			for (let i = 0; i < powTable.length; i++) {
				powTable[i] = temp;
				temp = temp * root % mod;
			}
		}
		
		for (let size = 2; size <= n; size *= 2) {
			const halfsize: number = size / 2;
			const tablestep: number = n / size;
			for (let i = 0; i < n; i += size) {
				for (let j = i, k = 0; j < i + halfsize; j++, k += tablestep) {
					let l: number = j + halfsize;
					const left: bigint = vector[j];
					const right: bigint = vector[j + halfsize] * powTable[k];
					vector[j] = (left + right) % mod;
					vector[l] = (left - right) % mod;
				}
			}
			if (size == n)
				break;
		}
		
		// Returns the integer whose value is the reverse of the lowest 'width' bits of the integer 'val'.
		function reverseBits(val: number, width: number): number {
			let result: number = 0;
			for (let i = 0; i < width; i++) {
				result = (result << 1) | (val & 1);
				val >>>= 1;
			}
			return result;
		}
	}
	
	
	// Returns the circular convolution of the given vectors of integers.
	// All values must be non-negative. Internally, a sufficiently large modulus
	// is chosen so that the convolved result can be represented without overflow.
	export function circularConvolve(vec0: Readonly<Array<bigint>>, vec1: Readonly<Array<bigint>>): Array<bigint> {
		if (vec0.length == 0 || vec0.length != vec1.length)
			throw new RangeError();
		let maxval: bigint = 0n;
		for (const x of vec0.concat(vec1)) {
			if (x > maxval)
				maxval = x;
		}
		
		const minmod: bigint = maxval * maxval * BigInt(vec0.length) + 1n;
		const mod: bigint = findModulus(vec0.length, minmod);
		const root: bigint = findPrimitiveRoot(BigInt(vec0.length), mod - 1n, mod);
		const temp0: Array<bigint> = transform(vec0, root, mod);
		const temp1: Array<bigint> = transform(vec1, root, mod);
		let temp2: Array<bigint> = [];
		for (let i = 0; i < temp0.length; i++)
			temp2.push(temp0[i] * temp1[i] % mod);
		return inverseTransform(temp2, root, mod);
	}
	
	
	
	/*---- Mid-level number theory functions for NTT ----*/
	
	// Returns the smallest modulus mod such that mod = i * veclen + 1
	// for some integer i >= 1, mod > veclen, and mod is prime.
	// Although the loop might run for a long time and create arbitrarily large numbers,
	// Dirichlet's theorem guarantees that such a prime number must exist.
	export function findModulus(vecLen: number, minimum: bigint): bigint {
		if (vecLen < 1 || minimum < 1n)
			throw new RangeError();
		const vl: bigint = BigInt(vecLen);
		let start: bigint = (minimum - 1n + vl - 1n) / vl;
		if (start < 1n)
			start = 1n;
		for (let n = start * vl + 1n; ; n += vl) {
			if (isPrime(n))
				return n;
		}
	}
	
	
	// Returns an arbitrary primitive degree-th root of unity modulo mod.
	// totient must be a multiple of degree. If mod is prime, an answer must exist.
	export function findPrimitiveRoot(degree: bigint, totient: bigint, mod: bigint): bigint {
		if (!(0 <= degree && degree <= totient && totient < mod))
			throw new RangeError();
		if (totient % degree != 0n)
			throw new RangeError();
		const gen: bigint = findGenerator(totient, mod);
		return powMod(gen, totient / degree, mod);
	}
	
	
	// Returns an arbitrary generator of the multiplicative group of integers modulo mod.
	// totient must equal the Euler phi function of mod. If mod is prime, an answer must exist.
	export function findGenerator(totient: bigint, mod: bigint): bigint {
		if (!(1n <= totient && totient < mod))
			throw new RangeError();
		for (let i = 1n; i < mod; i++) {
			if (isPrimitiveRoot(i, totient, mod))
				return i;
		}
		throw new Error("No generator exists");
	}
	
	
	// Tests whether val is a primitive degree-th root of unity modulo mod.
	// In other words, val^degree % mod = 1, and for each 1 <= k < degree, val^k % mod != 1.
	// 
	// To test whether val generates the multiplicative group of integers modulo mod,
	// set degree = totient(mod), where totient is the Euler phi function.
	// We say that val is a generator modulo mod if and only if the set of numbers
	// {val^0 % mod, val^1 % mod, ..., val^(totient-1) % mod} is equal to the set of all
	// numbers in the range [0, mod) that are coprime to mod. If mod is prime, then
	// totient = mod - 1, and powers of a generator produces all integers in the range [1, mod).
	export function isPrimitiveRoot(val: bigint, degree: bigint, mod: bigint): boolean {
		if (!(0n <= val && val < mod))
			throw new RangeError();
		if (!(1n <= degree && degree < mod))
			throw new RangeError();
		return powMod(val, degree, mod) == 1n &&
			uniquePrimeFactors(degree).every(p => powMod(val, degree / p, mod) != 1n);
	}
	
	
	
	/*---- Low-level common number theory functions ----*/
	
	// Returns a list of unique prime factors of the given integer in
	// ascending order. For example, uniquePrimeFactors(60) = [2, 3, 5].
	export function uniquePrimeFactors(n: bigint): Array<bigint> {
		if (n < 1n)
			throw new RangeError();
		let result: Array<bigint> = [];
		for (let i = 2n, end = sqrt(n); i <= end; i++) {
			if (n % i == 0n) {
				result.push(i);
				do n = n / i;
				while (n % i == 0n);
				end = sqrt(n);
			}
		}
		if (n > 1n)
			result.push(n);
		return result;
	}
	
	
	// Tests whether the given integer n >= 2 is a prime number.
	export function isPrime(n: bigint): boolean {
		if (n <= 1n)
			throw new RangeError();
		if ((n & 1n) == 0n)
			return n == 2n;
		for (let i = 3n, end = sqrt(n); i <= end; i += 2n) {
			if (n % i == 0n)
				return false;
		}
		return true;
	}
	
	
	// Returns floor(sqrt(x)) for the given integer x >= 0.
	export function sqrt(x: bigint): bigint {
		if (x < 0n)
			throw new RangeError();
		let y: bigint = 0n;
		for (let i = BigInt(Math.floor((x.toString(2).length - 1) / 2)); i >= 0n; i--) {
			y |= 1n << i;
			if (y * y > x)
				y ^= 1n << i;
		}
		return y;
	}
	
	
	// Returns x^y mod m.
	export function powMod(x: bigint, y: bigint, mod: bigint): bigint {
		if (y < 0n || mod <= 0n)
			throw RangeError();
		if (!(0n <= x && x < mod))
			x = ((x % mod) + mod) % mod;
		let result: bigint = 1n;
		while (y != 0n) {
			if ((y & 1n) != 0n)
				result = result * x % mod;
			x = x * x % mod;
			y >>= 1n;
		}
		return result;
	}
	
	
	// Returns x^-1 mod m.
	export function reciprocalMod(x: bigint, mod: bigint): bigint {
		if (!(0n <= x && x < mod))
			throw RangeError();
		// Based on a simplification of the extended Euclidean algorithm
		let y: bigint = x;
		x = mod;
		let a: bigint = 0n;
		let b: bigint = 1n;
		while (y != 0n) {
			let temp: bigint = a - x / y * b;
			a = b;
			b = temp;
			temp = x % y;
			x = y;
			y = temp;
		}
		if (x == 1n)
			return ((a % mod) + mod) % mod;
		else
			throw new RangeError("Reciprocal does not exist");
	}
	
}
