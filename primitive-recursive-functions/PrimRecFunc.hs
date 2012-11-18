{- 
 - Primitive recursive functions
 - Copyright (c) 2012 Nayuki Minase
 -}

module PrimRecFunc
	(Prf(Z,S,I,C,R,Native), eval, evalCount, getAndCheckArgs,
	not, and, or, xor, mux,
	z, nz, eq, neq, lt, le, gt, ge, even, odd, divisible, prime,
	const, pred, add, sub, subrev, diff, min, max, mul, pow, sqrt, log, div, mod, factorial, gcd, lcm, divisiblecount, nthprime, fibonacci, shl, shr, band, bandnot, bor, bxor, getbit)
	where

import Prelude hiding (and, const, div, even, gcd, lcm, log, max, min, mod, not, odd, or, pred, sqrt)
import qualified Prelude



{---- Data type for primitive recursive functions ----}

data Prf = Z | S | I Int Int | C Prf [Prf] | R Prf Prf | Native ([Int] -> Int)

instance Show Prf where  -- For displaying a Prf as a string
	show Z = "Z"
	show S = "S"
	show (I n i) = "I " ++ (show n) ++ " " ++ (show i)
	show (C f gs) = "C " ++ (parenShow f) ++ " " ++ (show gs)
	show (R f g) = "R " ++ (parenShow f) ++ " " ++ (parenShow g)
	show (Native f) = "Native"
	showList [] = showString "[]"
	showList xs = (showString "[") . (sl xs) where
		sl [x] = (shows x) . (showString "]")
		sl (x:xs) = (shows x) . (showString ", ") . (sl xs)

-- (Private) Show Z, S, Native without parentheses, and I, C, R wrapped with parentheses
parenShow :: Prf -> [Char]
parenShow Z = "Z"
parenShow S = "S"
parenShow (Native _) = "Native"
parenShow f = "(" ++ (show f) ++ ")"


{---- Evaluates a PRF with a vector of numbers ----}

eval :: Prf -> [Int] -> Int
eval _ [] = error "Empty vector"           -- No nullary (0-ary) functions allowed
eval f xs = eval' f (checkNonNegative xs)  -- Check for negative arguments, call private eval'


-- (Private) Evaluates without checking for negative arguments
eval' :: Prf -> [Int] -> Int

-- Zero function: Z(x) = 0
eval' Z [x] = 0

-- Successor function: S(x) = x + 1
eval' S [x] = x + 1

-- Projection function: I_{n,i}(x_0, ..., x_{n-1}) = x_i
eval' (I n i) xs =
	if (length xs) == n then xs !! i
	else error "Wrong number of arguments"

-- Composition function: C_{f, g_0, ..., g_{k-1}}(xs) = f(g_0(xs), ..., g_{k-1}(xs))
eval' (C f gs) xs = eval f (map (\g -> eval g xs) gs)

-- Primitive recursion: R_{f,g}(y, xs) = if (y == 0) then (f xs) else g(R_{f,g}(y-1, xs), y-1, xs)
eval' (R _ _) [_] = error "Wrong number of arguments"
-- Efficient implementation using tail recursion
eval' (R f g) (y:xs) = evalR 0 (eval f xs) where
	evalR i val | i == y    = val
	            | otherwise = evalR (i+1) (eval g (val : i : xs))
{- 
 - Naive evaluation implementation, directly based on mathematical definition. Uses lots of stack space.
 - eval' (R f _) (0:xs) = eval f xs
 - eval' (R f g) (y:xs) = eval g ((eval (R f g) (y-1 : xs)) : y-1 : xs)
 -}

-- Native function implementation
eval' (Native f) xs = f xs

-- Everything else
eval' _ _ = error "Wrong number of arguments"


-- (Private) Returns the same vector if every number is non-negative, otherwise throws an exception
checkNonNegative :: [Int] -> [Int]
checkNonNegative [] = []
checkNonNegative (x:xs)
	| x >= 0 = x : (checkNonNegative xs)
	| otherwise = error "Number must be non-negative"



{---- Utility functions ----}

-- Computes the number of arguments that the given PRF takes, and checks that its substructures agree.
-- Fails with an error if the PRF contains a native function.
getAndCheckArgs :: Prf -> Int
getAndCheckArgs Z = 1
getAndCheckArgs S = 1
getAndCheckArgs (I n _) = n
getAndCheckArgs (C f (g:gs)) =
	let n = getAndCheckArgs g
	    ok = getAndCheckArgs f == length (g:gs) && Prelude.and (map (\gg -> (getAndCheckArgs gg) == n) gs)
	in case ok of
		True  -> n
		False -> error "Argument count mismatch"
getAndCheckArgs (R f g) =
	let k = getAndCheckArgs f
	    ok = k > 0 && k + 2 == getAndCheckArgs g
	in case ok of
		True  -> k + 1
		False -> error "Argument count mismatch"
getAndCheckArgs (Native _) = error "Can't get arguments of native function"


-- Evaluates the PRF and also returns some computation statistics.
-- The result is a tuple: (result, evaluations, max depth).
-- This function does not perform error-checking, unlike eval.
evalCount :: Prf -> [Int] -> (Int, Int, Int)
evalCount Z [x] = (0, 1, 1)
evalCount S [x] = (x + 1, 1, 1)
evalCount (I n i) xs = (xs !! i, 1, 1)
evalCount (C f gs) xs =
	let (r0s, e0, d0) = foldr (\g (r1s,e1,d1) -> let (r2,e2,d2) = evalCount g xs in (r2:r1s, e1 + e2, Prelude.max d1 d2)) ([], 0, 0) gs
	    (r3, e3, d3) = evalCount f r0s
	in (r3, e0 + e3 + 1, Prelude.max d0 d3 + 1)
evalCount (R f _) (0:xs) =
	let (r, e, d) = evalCount f xs
	in (r, e + 1, d + 1)
evalCount (R f g) (y:xs) =
	let (r0, e0, d0) = evalCount (R f g) (y-1 : xs)
	    (r1, e1, d1) = evalCount g (r0 : y-1 : xs)
	in (r1, e0 + e1 + 1, Prelude.max d0 d1 + 1)
evalCount (Native f) xs = (f xs, 1, 1)



{---- Library of primitive recursive functions ----}

{-- Boolean functions --}
-- 0 means false, 1 means true, and all other values cause unspecified behavior

-- Negation (NOT): not(x)
not = z

-- Conjunction (AND): and(x, y)
and = R Z (I 3 2)

-- Disjunction (OR): or(x, y)
or = R (I 1 0) (C S [I 3 1])

-- Exclusive OR (XOR): xor(x, y)
xor = R (I 1 0) (C not [I 3 2])

-- Multiplex/select: mux(x, y, z) = if x == True then y else z. (x is Boolean; y and z are numbers)
mux = R (I 2 1) (I 4 2)


{-- Comparison functions --}
-- Every function returns only Boolean values, i.e. 0 or 1

-- Is zero: z(x, y) = if x == 0 then 1 else 0
z = C (R (const 1) (C Z [I 3 0])) [I 1 0, Z]

-- Is nonzero: nz(x, y) = if x == 0 then 0 else 1
nz = C (R Z (C (const 1) [I 3 0])) [I 1 0, Z]

-- Equal: eq(x, y) = if x == y then 1 else 0
eq = C z [diff]

-- Not equal: neq(x, y) = if x != y then 1 else 0
neq = C nz [diff]

-- Less than: lt(x, y) = if x < y then 1 else 0
lt = C nz [subrev]

-- Less than or equal: le(x, y) = if x <= y then 1 else 0
le = C z [sub]

-- Greater than: gt(x, y) = if x > y then 1 else 0
gt = C nz [sub]

-- Greater than or equal: ge(x, y) = if x >= y then 1 else 0
ge = C z [subrev]

-- Is even: even(x) = if x mod 2 == 0 then 1 else 0
even = C (R (const 1) (C not [I 3 0])) [I 1 0, Z]

-- Is odd: odd(x) = if x mod 2 == 1 then 1 else 0
odd = C (R Z (C not [I 3 0])) [I 1 0, Z]

-- Is divisible: divisible(x, y) = if (y > 0 and x mod y == 0) or x == 0 then 1 else 0
divisible = C z [mod]

-- Is prime: prime(x) = if x is prime then 1 else 0
prime = C eq [C (R Z (C add [C divisible [I 3 2, I 3 1], I 3 0])) [I 1 0, I 1 0], const 1]


{-- Arithmetic functions --}

-- Constant: const_{n}(x) = n
-- This is actually a PRF generator
const n
	| n <  0 = error ("const " ++ (show n))
	| n == 0 = Z
	| n >  0 = C S [const (n-1)]

-- Predecessor: pred(0) = 0; pred(x) = x - 1
pred = C (R Z (I 3 1)) [I 1 0, Z]

-- Addition/sum: add(x, y) = x + y
add = R (I 1 0) (C S [I 3 0])

-- Subtraction/difference: sub(x, y) = max(x - y, 0)
sub = C subrev [I 2 1, I 2 0]

-- Reverse subtraction: subrev(x, y) = max(y - x, 0)
subrev = R (I 1 0) (C pred [I 3 0])

-- Absolute difference: diff(x, y) = abs(x - y)
diff = C add [sub, subrev]

-- Minimum: min(x, y) = if x <= y then x else y
min = C subrev [subrev, I 2 1]

-- Maximum: max(x, y) = if x >= y then x else y
max = C add [subrev, I 2 0]

-- Multiplication/product: mul(x, y) = x * y
mul = R Z (C add [I 3 0, I 3 2])

-- Power/exponentiation: pow(x, y) = x ^ y
pow = C (R (const 1) (C mul [I 3 2, I 3 0])) [I 2 1, I 2 0]

-- Square root: sqrt(x) = floor(sqrt(x))
sqrt = C (R Z (C mux [C le [C mul [C S [I 3 0], C S [I 3 0]], I 3 2], C S [I 3 0], I 3 0])) [I 1 0, I 1 0]

-- Logarithm: log(x, y) = if x >= 2 then (if y >= 1 then floor(ln(y) / ln(x)) else 0) else y
log = C (R (C Z [I 2 0]) (C mux [C le [C pow [I 4 2, C S [I 4 0]], I 4 3], C S [I 4 0], I 4 0])) [I 2 1, I 2 0, I 2 1]

-- Truncating division: div(x, y) = if y != 0 then floor(x / y) else x
div = C (R (C Z [I 2 0]) (C mux [C le [C mul [C S [I 4 0], I 4 3], I 4 2], C S [I 4 0], I 4 0])) [I 2 0, I 2 0, I 2 1]

-- Modulo: mod(x, y) = if y != 0 then (x mod y) else x
mod = C (R (I 2 0) (C mux [C ge [I 4 0, I 4 3], C sub [I 4 0, I 4 3], I 4 0])) [I 2 0, I 2 0, I 2 1]

-- Factorial: factorial(x) = x!
factorial = C (R (const 1) (C mul [C S [I 3 1], I 3 0])) [I 1 0, Z]

-- Greatest common divisor: gcd(x, y) = if (x != 0 or y != 0) then (largest z such that z divides x and z divides y) else 0
gcd = C (R (C Z [I 2 0]) (C mux [C and [C divisible [I 4 2, I 4 1], C divisible [I 4 3, I 4 1]], I 4 1, I 4 0])) [C S [max], I 2 0, I 2 1]

-- Least common multiple: lcm(x, y) = if (x != 0 and y != 0) then (smallest z such that x divides z and y divides z) else 0
lcm = C (R (C Z [I 2 0]) (C mux [C and [C nz [I 4 0], C and [C divisible [I 4 0, I 4 2], C divisible [I 4 0, I 4 3]]], I 4 0, I 4 1])) [C S [mul], I 2 0, I 2 1]

-- Divisibility count: divisiblecount(x, y) =
--     if x == 0 or y == 0 then 0
--     elseif y >= 2 then (the highest power of y that divides x)
--     else y == 1 then x
divisiblecount = C (R (C Z [I 2 0]) (C mux [C divisible [I 4 2, C pow [I 4 3, C S [I 4 0]]], C S [I 4 0], I 4 0])) [I 2 0, I 2 0, I 2 1]

-- Nth prime: nthprime(0) = 2, nthprime(1) = 3, nthprime(2) = 5, nthprime(3) = 7, nthprime(4) = 11, ...
nthprime = C mux [I 1 0, C (R Z (C mux [C even [I 3 0], C mux [C prime [I 3 1], C mux [C eq [I 3 0, C add [I 3 2, I 3 2]], I 3 1, C S [C S [I 3 0]]], I 3 0], I 3 0])) [C pow [const 2, C S [I 1 0]], I 1 0], const 2]

-- Fibonacci number: fibonacci(0) = 0, fibonacci(1) = 1, fibonacci(2) = 1, fibonacci(3) = 2, fibonacci(4) = 3, fibonacci(5) = 5, ...
fibonacci = C mod [C fib2 [I 1 0, Z], C pow [const 2, I 1 0]]
-- Private: fib2(n) = fibonacci(n) | fibonacci(n+1)<<n
fib2 = R (const 1) (C (C (C add [I 3 0, C mul [C add [I 3 0, I 3 1], I 3 2]]) [C div [I 3 0, I 3 2], C mod [I 3 0, I 3 2], C add [I 3 2, I 3 2]]) [I 3 0, I 3 1, C pow [C (const 2) [I 3 0], I 3 1]])


{-- Bitwise functions --}

-- Left shift: shl(x, y) = x << y
shl = C mul [I 2 0, C pow [C (const 2) [I 2 0], I 2 1]]

-- Right shift: shr(x, y) = x >> y
shr = C div [I 2 0, C pow [C (const 2) [I 2 0], I 2 1]]

-- Private: Takes a binary Boolean PRF (i.e. {0,1}*{0,1} -> {0,1}) and produces an integer PRF that applies it to each pair of corresponding bits in x and y
makebitwiseop f = C (R (C Z [I 2 0]) (C add [I 4 0, C (bitcombine f) [I 4 2, I 4 3, C pow [C (const 2) [I 4 0], I 4 1]]])) [C log2p1 [C max [I 2 0, I 2 1]], I 2 0, I 2 1]
-- Private: log2p1(x) = if x != 0 then (floor(lg(x)) + 1) else 1
log2p1 = C S [C log [const 2, I 1 0]]
-- Private: bitcombine f (x, y, s) = f(floor(x/s), floor(y/s)) * s. (This combines x and y at bit position log2(s) with the Boolean function f. The scaler s must be a power of 2.)
bitcombine f = C mul [C f [C odd [C div [I 3 0, I 3 2]], C odd [C div [I 3 1, I 3 2]]], I 3 2]

-- Bitwise AND: band(x, y) = x & y
band = makebitwiseop and

-- Bitwise AND-NOT: bandnot(x, y) = x & ~y
bandnot = makebitwiseop (C (R (I 1 0) (C Z [I 3 0])) [I 2 1, I 2 0])

-- Bitwise OR: bor(x, y) = x | y
bor = makebitwiseop or

-- Bitwise XOR: bxor(x, y) = x ^ y
bxor = makebitwiseop xor

-- Get bit: getbit(x, y) = (x >> y) & 1
getbit = C odd [shr]
