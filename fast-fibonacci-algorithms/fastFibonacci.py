# 
# Fast doubling Fibonacci algorithm
# 
# Copyright (c) 2013 Nayuki Minase
# All rights reserved. Contact Nayuki for licensing.
# http://nayuki.eigenstate.org/page/fast-fibonacci-algorithms
# 


# Returns F(n)
def fibonacci(n):
    if n < 0:
        raise ValueError("Negative arguments not implemented")
    return _fib(n)[0]


# Returns a tuple (F(n), F(n+1))
def _fib(n):
    if n == 0:
        return (0, 1)
    else:
        a, b = _fib(n // 2)
        c = a * (2 * b - a)
        d = b * b + a * a
        if n % 2 == 0:
            return (c, d)
        else:
            return (d, c + d)
