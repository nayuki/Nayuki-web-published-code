-- Fast doubling Fibonacci algorithm
-- Copyright (c) 2011 Nayuki Minase


-- fibonacci n = F(n)
fibonacci :: Integer -> Integer
fibonacci n | n >= 0 = a where (a, _) = fib n

-- Internal function: fib n = (F(n), F(n+1))
fib :: Integer -> (Integer, Integer)
fib 0 = (0, 1)
fib n =
    let (a, b) = fib (div n 2)
        c = a * (2 * b - a)
        d = b * b + a * a
    in if mod n 2 == 0
        then (c, d)
        else (d, c + d)
