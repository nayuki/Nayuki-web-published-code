/*
 * Number-theoretic transform library (compiled from TypeScript)
 *
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/number-theoretic-transform-integer-dft
 */
"use strict";
var numbertheoretictransform;
(function (numbertheoretictransform) {
    /*---- High-level NTT functions ----*/
    // Returns the forward number-theoretic transform of the given vector with
    // respect to the given primitive nth root of unity under the given modulus.
    function transform(invec, root, mod) {
        const n = invec.length;
        let outvec = [];
        for (let i = 0; i < n; i++) {
            let sum = 0n;
            for (let j = 0; j < n; j++) {
                const k = BigInt(i * j % n);
                sum = (sum + invec[j] * powMod(root, k, mod)) % mod;
            }
            outvec.push(sum);
        }
        return outvec;
    }
    numbertheoretictransform.transform = transform;
    // Returns the inverse number-theoretic transform of the given vector with
    // respect to the given primitive nth root of unity under the given modulus.
    function inverseTransform(invec, root, mod) {
        let outvec = transform(invec, reciprocalMod(root, mod), mod);
        let scaler = reciprocalMod(BigInt(invec.length), mod);
        for (let i = 0; i < outvec.length; i++)
            outvec[i] = (outvec[i] * scaler) % mod;
        return outvec;
    }
    numbertheoretictransform.inverseTransform = inverseTransform;
    // Computes the forward number-theoretic transform of the given vector in place,
    // with respect to the given primitive nth root of unity under the given modulus.
    // The length of the vector must be a power of 2.
    function transformRadix2(vector, root, mod) {
        let n = vector.length;
        let levels = n.toString(2).length - 1;
        if (1 << levels != n)
            throw new RangeError("Length is not a power of 2");
        for (let i = 0; i < n; i++) {
            const j = reverseBits(i, levels);
            if (j > i) {
                const temp = vector[i];
                vector[i] = vector[j];
                vector[j] = temp;
            }
        }
        let powTable = new Array(Math.floor(n / 2));
        {
            let temp = 1n;
            for (let i = 0; i < powTable.length; i++) {
                powTable[i] = temp;
                temp = temp * root % mod;
            }
        }
        for (let size = 2; size <= n; size *= 2) {
            const halfsize = size / 2;
            const tablestep = n / size;
            for (let i = 0; i < n; i += size) {
                for (let j = i, k = 0; j < i + halfsize; j++, k += tablestep) {
                    let l = j + halfsize;
                    const left = vector[j];
                    const right = vector[j + halfsize] * powTable[k];
                    vector[j] = (left + right) % mod;
                    vector[l] = (left - right) % mod;
                }
            }
            if (size == n)
                break;
        }
        // Returns the integer whose value is the reverse of the lowest 'width' bits of the integer 'val'.
        function reverseBits(val, width) {
            let result = 0;
            for (let i = 0; i < width; i++) {
                result = (result << 1) | (val & 1);
                val >>>= 1;
            }
            return result;
        }
    }
    numbertheoretictransform.transformRadix2 = transformRadix2;
    // Returns the circular convolution of the given vectors of integers.
    // All values must be non-negative. Internally, a sufficiently large modulus
    // is chosen so that the convolved result can be represented without overflow.
    function circularConvolve(vec0, vec1) {
        if (vec0.length == 0 || vec0.length != vec1.length)
            throw new RangeError();
        let maxval = 0n;
        for (const x of vec0.concat(vec1)) {
            if (x > maxval)
                maxval = x;
        }
        const minmod = maxval * maxval * BigInt(vec0.length) + 1n;
        const mod = findModulus(vec0.length, minmod);
        const root = findPrimitiveRoot(BigInt(vec0.length), mod - 1n, mod);
        const temp0 = transform(vec0, root, mod);
        const temp1 = transform(vec1, root, mod);
        let temp2 = [];
        for (let i = 0; i < temp0.length; i++)
            temp2.push(temp0[i] * temp1[i] % mod);
        return inverseTransform(temp2, root, mod);
    }
    numbertheoretictransform.circularConvolve = circularConvolve;
    /*---- Mid-level number theory functions for NTT ----*/
    // Returns the smallest modulus mod such that mod = i * veclen + 1
    // for some integer i >= 1, mod > veclen, and mod is prime.
    // Although the loop might run for a long time and create arbitrarily large numbers,
    // Dirichlet's theorem guarantees that such a prime number must exist.
    function findModulus(vecLen, minimum) {
        if (vecLen < 1 || minimum < 1n)
            throw new RangeError();
        const vl = BigInt(vecLen);
        let start = (minimum - 1n + vl - 1n) / vl;
        if (start < 1n)
            start = 1n;
        for (let n = start * vl + 1n;; n += vl) {
            if (isPrime(n))
                return n;
        }
    }
    numbertheoretictransform.findModulus = findModulus;
    // Returns an arbitrary primitive degree-th root of unity modulo mod.
    // totient must be a multiple of degree. If mod is prime, an answer must exist.
    function findPrimitiveRoot(degree, totient, mod) {
        if (!(0 <= degree && degree <= totient && totient < mod))
            throw new RangeError();
        if (totient % degree != 0n)
            throw new RangeError();
        const gen = findGenerator(totient, mod);
        return powMod(gen, totient / degree, mod);
    }
    numbertheoretictransform.findPrimitiveRoot = findPrimitiveRoot;
    // Returns an arbitrary generator of the multiplicative group of integers modulo mod.
    // totient must equal the Euler phi function of mod. If mod is prime, an answer must exist.
    function findGenerator(totient, mod) {
        if (!(1n <= totient && totient < mod))
            throw new RangeError();
        for (let i = 1n; i < mod; i++) {
            if (isPrimitiveRoot(i, totient, mod))
                return i;
        }
        throw new Error("No generator exists");
    }
    numbertheoretictransform.findGenerator = findGenerator;
    // Tests whether val is a primitive degree-th root of unity modulo mod.
    // In other words, val^degree % mod = 1, and for each 1 <= k < degree, val^k % mod != 1.
    // 
    // To test whether val generates the multiplicative group of integers modulo mod,
    // set degree = totient(mod), where totient is the Euler phi function.
    // We say that val is a generator modulo mod if and only if the set of numbers
    // {val^0 % mod, val^1 % mod, ..., val^(totient-1) % mod} is equal to the set of all
    // numbers in the range [0, mod) that are coprime to mod. If mod is prime, then
    // totient = mod - 1, and powers of a generator produces all integers in the range [1, mod).
    function isPrimitiveRoot(val, degree, mod) {
        if (!(0n <= val && val < mod))
            throw new RangeError();
        if (!(1n <= degree && degree < mod))
            throw new RangeError();
        return powMod(val, degree, mod) == 1n &&
            uniquePrimeFactors(degree).every(p => powMod(val, degree / p, mod) != 1n);
    }
    numbertheoretictransform.isPrimitiveRoot = isPrimitiveRoot;
    /*---- Low-level common number theory functions ----*/
    // Returns a list of unique prime factors of the given integer in
    // ascending order. For example, uniquePrimeFactors(60) = [2, 3, 5].
    function uniquePrimeFactors(n) {
        if (n < 1n)
            throw new RangeError();
        let result = [];
        for (let i = 2n, end = sqrt(n); i <= end; i++) {
            if (n % i == 0n) {
                result.push(i);
                do
                    n = n / i;
                while (n % i == 0n);
                end = sqrt(n);
            }
        }
        if (n > 1n)
            result.push(n);
        return result;
    }
    numbertheoretictransform.uniquePrimeFactors = uniquePrimeFactors;
    // Tests whether the given integer n >= 2 is a prime number.
    function isPrime(n) {
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
    numbertheoretictransform.isPrime = isPrime;
    // Returns floor(sqrt(x)) for the given integer x >= 0.
    function sqrt(x) {
        if (x < 0n)
            throw new RangeError();
        let y = 0n;
        for (let i = BigInt(Math.floor((x.toString(2).length - 1) / 2)); i >= 0n; i--) {
            y |= 1n << i;
            if (y * y > x)
                y ^= 1n << i;
        }
        return y;
    }
    numbertheoretictransform.sqrt = sqrt;
    // Returns x^y mod m.
    function powMod(x, y, mod) {
        if (y < 0n || mod <= 0n)
            throw RangeError();
        if (!(0n <= x && x < mod))
            x = ((x % mod) + mod) % mod;
        let result = 1n;
        while (y != 0n) {
            if ((y & 1n) != 0n)
                result = result * x % mod;
            x = x * x % mod;
            y >>= 1n;
        }
        return result;
    }
    numbertheoretictransform.powMod = powMod;
    // Returns x^-1 mod m.
    function reciprocalMod(x, mod) {
        if (!(0n <= x && x < mod))
            throw RangeError();
        // Based on a simplification of the extended Euclidean algorithm
        let y = x;
        x = mod;
        let a = 0n;
        let b = 1n;
        while (y != 0n) {
            let temp = a - x / y * b;
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
    numbertheoretictransform.reciprocalMod = reciprocalMod;
})(numbertheoretictransform || (numbertheoretictransform = {}));
