# 
# Number-theoretic transform library (Python)
# 
# Copyright (c) 2022 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/number-theoretic-transform-integer-dft
# 
import itertools
from typing import List, Tuple


# ---- High-level NTT functions ----

def find_params_and_transform(invec: List[int], minmod: int) -> Tuple[List[int], int, int]:
    mod: int = find_modulus(len(invec), minmod)
    root: int = find_primitive_root(len(invec), mod - 1, mod)
    return (transform(invec, root, mod), root, mod)


def transform(invec: List[int], root: int, mod: int) -> List[int]:
    if len(invec) >= mod:
        raise ValueError()
    if not all((0 <= val < mod) for val in invec):
        raise ValueError()
    if not (1 <= root < mod):
        raise ValueError()

    outvec: List[int] = []
    for i in range(len(invec)):
        temp: int = 0
        for (j, val) in enumerate(invec):
            temp += val * pow(root, i * j, mod)
            temp %= mod
        outvec.append(temp)
    return outvec


def inverse_transform(invec: List[int], root: int, mod: int) -> List[int]:
    outvec: List[int] = transform(invec, pow(root, -1, mod), mod)
    scaler: int = pow(len(invec), -1, mod)
    return [(val * scaler % mod) for val in outvec]


def transform_radix_2(vector: List[int], root: int, mod: int) -> None:
    n: int = len(vector)
    levels: int = n.bit_length() - 1
    if 1 << levels != n:
        raise ValueError("Length is not a power of 2")

    def reverse(x: int, bits: int) -> int:
        return int(format(x, f'0{bits}b')[::-1], 2)

    for i in range(n):
        j: int = reverse(i, levels)
        if j > i:
            vector[i], vector[j] = vector[j], vector[i]

    powtable: List[int] = []
    temp: int = 1
    for i in range(n // 2):
        powtable.append(temp)
        temp = (temp * root) % mod

    size: int = 2
    while size <= n:
        halfsize: int = size >> 1
        tablestep: int = n // size
        for i in range(0, n, size):
            k: int = 0
            for j in range(i, i + halfsize):
                l: int = j + halfsize
                left: int = vector[j]
                right: int = vector[l] * powtable[k] % mod
                vector[j] = (left + right) % mod
                vector[l] = (left - right) % mod
                k += tablestep
        size <<= 1


def circular_convolve(vec0: List[int], vec1: List[int]) -> List[int]:
    if not (0 < len(vec0) == len(vec1)):
        raise ValueError()
    if any((val < 0) for val in itertools.chain(vec0, vec1)):
        raise ValueError()
    maxval: int = max(val for val in itertools.chain(vec0, vec1))
    minmod: int = maxval ** 2 * len(vec0) + 1
    temp0, root, mod = find_params_and_transform(vec0, minmod)
    temp1: List[int] = transform(vec1, root, mod)
    temp2: List[int] = [(x * y % mod) for (x, y) in zip(temp0, temp1)]
    return inverse_transform(temp2, root, mod)


# ---- Mid-level number theory functions for NTT ----

def find_modulus(veclen: int, minimum: int) -> int:
    if veclen < 1 or minimum < 1:
        raise ValueError()
    start: int = (minimum - 1 + veclen - 1) // veclen
    for i in itertools.count(max(start, 1)):
        n: int = i * veclen + 1
        assert n >= minimum
        if is_prime(n):
            return n
    raise AssertionError("Unreachable")


def find_primitive_root(degree: int, totient: int, mod: int) -> int:
    if not (1 <= degree <= totient < mod):
        raise ValueError()
    if totient % degree != 0:
        raise ValueError()
    gen: int = find_generator(totient, mod)
    root: int = pow(gen, totient // degree, mod)
    assert 0 <= root < mod
    return root


def find_generator(totient: int, mod: int) -> int:
    if not (1 <= totient < mod):
        raise ValueError()
    for i in range(1, mod):
        if is_primitive_root(i, totient, mod):
            return i
    raise ValueError("No generator exists")


def is_primitive_root(val: int, degree: int, mod: int) -> bool:
    if not (0 <= val < mod):
        raise ValueError()
    if not (1 <= degree < mod):
        raise ValueError()
    pf: List[int] = unique_prime_factors(degree)
    return pow(val, degree, mod) == 1 and \
           all((pow(val, degree // p, mod) != 1) for p in pf)


# ---- Low-level common number theory functions ----

def unique_prime_factors(n: int) -> List[int]:
    if n < 1:
        raise ValueError()
    result: List[int] = []
    i: int = 2
    end: int = sqrt(n)
    while i <= end:
        if n % i == 0:
            n //= i
            result.append(i)
            while n % i == 0:
                n //= i
            end = sqrt(n)
        i += 1
    if n > 1:
        result.append(n)
    return result


def is_prime(n: int) -> bool:
    if n <= 1:
        raise ValueError()
    return all((n % i != 0) for i in range(2, sqrt(n) + 1))


def sqrt(n: int) -> int:
    if n < 0:
        raise ValueError()
    i: int = 1
    while i * i <= n:
        i <<= 1
    result: int = 0
    while i > 0:
        if (result + i) ** 2 <= n:
            result += i
        i >>= 1
    return result
