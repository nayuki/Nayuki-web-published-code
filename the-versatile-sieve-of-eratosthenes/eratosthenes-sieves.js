/*
 * Variants of the sieve of Eratosthenes (compiled from TypeScript)
 * by Project Nayuki, 2022. Public domain.
 * https://www.nayuki.io/page/the-versatile-sieve-of-eratosthenes
 */
"use strict";
// Given an integer limit, this returns a list of Booleans
// where result[k] indicates whether k is a prime number.
function sievePrimeness(limit) {
    if (limit < 0 || limit >= 9007199254740992 || Math.round(limit) != limit)
        throw new RangeError("Limit out of range");
    let result = [false];
    for (let i = 0; i < limit; i++)
        result.push(true);
    if (limit > 0)
        result[1] = false;
    for (let i = 2; i < result.length; i++) {
        if (result[i]) {
            for (let j = i * i; j < result.length; j += i)
                result[j] = false;
        }
    }
    return result;
}
// Given an integer limit, this returns a list of integers
// where result[k] is the smallest prime factor of k.
function sieveSmallestPrimeFactor(limit) {
    if (limit < 0 || limit >= 9007199254740992 || Math.round(limit) != limit)
        throw new RangeError("Limit out of range");
    let result = [];
    for (let i = 0; i <= limit; i++)
        result.push(0);
    if (limit > 0)
        result[1] = 1;
    for (let i = 2; i < result.length; i++) {
        if (result[i] == 0) {
            result[i] = i;
            for (let j = i * i; j < result.length; j += i) {
                if (result[j] == 0)
                    result[j] = i;
            }
        }
    }
    return result;
}
// Given an integer limit, this returns a list of integers
// where result[k] is the totient (Euler phi function) of k.
function sieveTotient(limit) {
    if (limit < 0 || limit >= 9007199254740992 || Math.round(limit) != limit)
        throw new RangeError("Limit out of range");
    let result = [];
    for (let i = 0; i <= limit; i++)
        result.push(i);
    for (let i = 2; i < result.length; i++) {
        if (result[i] == i) {
            for (let j = i; j < result.length; j += i)
                result[j] -= result[j] / i;
        }
    }
    return result;
}
// Given an integer limit, this returns a list of integers where result[k]
// is the number of unique prime factors (omega function) of k.
function sieveOmega(limit) {
    if (limit < 0 || limit >= 9007199254740992 || Math.round(limit) != limit)
        throw new RangeError("Limit out of range");
    let result = [];
    for (let i = 0; i <= limit; i++)
        result.push(0);
    for (let i = 2; i < result.length; i++) {
        if (result[i] == 0) {
            for (let j = i; j < result.length; j += i)
                result[j] += 1;
        }
    }
    return result;
}
// Given an integer limit, this returns a list of integers where result[k]
// is the product of the unique prime factors (radical function) of k.
function sieveRadical(limit) {
    if (limit < 0 || limit >= 9007199254740992 || Math.round(limit) != limit)
        throw new RangeError("Limit out of range");
    let result = [0];
    for (let i = 0; i < limit; i++)
        result.push(1);
    for (let i = 2; i < result.length; i++) {
        if (result[i] == 1) {
            for (let j = i; j < result.length; j += i)
                result[j] *= i;
        }
    }
    return result;
}
