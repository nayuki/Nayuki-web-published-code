{- 
 - Primitive recursive functions
 - Copyright (c) 2012 Nayuki Minase
 -}

module PrimRecFunc
	(Prf(Z,S,I,C,R), eval,
	not, and, or, xor, mux,
	z, nz, eq, neq, lt, le, gt, ge, even, divisible, prime,
	const, pred, add, sub, subrev, diff, mul, exp, mod, factorial)
	where

import Prelude hiding (and, const, even, exp, mod, not, or, pred)


{---- Data type for primitive recursive functions ----}

data Prf = Z | S | I Int Int | C Prf [Prf] | R Prf Prf

instance Show Prf where  -- For displaying a Prf as a string
	show Z = "Z"
	show S = "S"
	show (I n i) = "I " ++ (show n) ++ " " ++ (show i)
	show (C f gs) = "C " ++ (parenShow f) ++ " " ++ (show gs)
	show (R f g) = "R " ++ (parenShow f) ++ " " ++ (parenShow g)
	showList [] = showString "[]"
	showList xs = (showString "[") . (sl xs) where
		sl [x] = (shows x) . (showString "]")
		sl (x:xs) = (shows x) . (showString ", ") . (sl xs)

-- (Private) Show Z and S without parentheses, and I, C, R wrapped with parentheses
parenShow :: Prf -> [Char]
parenShow Z = "Z"
parenShow S = "S"
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
eval' (R f _) (0:xs) = eval f xs
eval' (R f g) (y:xs) = eval g ((eval (R f g) ((y-1):xs)) : (y-1) : xs)

-- Everything else
eval' _ _ = error "Wrong number of arguments"


-- (Private) Returns the same vector if every number is non-negative, otherwise throws an exception
checkNonNegative :: [Int] -> [Int]
checkNonNegative [] = []
checkNonNegative (x:xs)
	| x >= 0 = x : (checkNonNegative xs)
	| otherwise = error "Number must be non-negative"



{---- Library of primitive recursive functions ----}


{---- Boolean functions ----}
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


{---- Comparison functions ----}
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

-- Is divisible: divisible(x, y) = if (y > 0 and x mod y == 0) or x == 0 then 1 else 0
divisible = C z [mod]

-- Is prime: prime(x) = if x is prime then 1 else 0
prime = C eq [C (R Z (C add [C divisible [I 3 2, I 3 1], I 3 0])) [I 1 0, I 1 0], const 1]


{---- Arithmetic functions ----}

-- Constant: const_{n}(x) = n
-- This is actually a PRF generator
const n
	| n <  0 = error ("const " ++ (show n))
	| n == 0 = Z
	| n >  0 = C S [const (n-1)]

-- Predecessor: pred(0) = 0; pred(x) = x - 1
pred = C (R Z (I 3 1)) [I 1 0, I 1 0]

-- Addition/sum: add(x, y) = x + y
add = R (I 1 0) (C S [I 3 0])

-- Subtraction/difference: sub(x, y) = max(x - y, 0)
sub = C subrev [I 2 1, I 2 0]

-- Reverse subtraction: subrev(x, y) = max(y - x, 0)
subrev = R (I 1 0) (C pred [I 3 0])

-- Absolute difference: diff(x, y) = abs(x - y)
diff = C add [sub, subrev]

-- Multiplication/product: mul(x, y) = x * y
mul = R Z (C add [I 3 0, I 3 2])

-- Power/exponentiation: exp(x, y) = x ^ y
exp = C (R (const 1) (C mul [I 3 2, I 3 0])) [I 2 1, I 2 0]

-- Modulo: mod(x, y) = if y != 0 then (x mod y) else x
mod = C (R (I 2 0) (C mux [C ge [I 4 0, I 4 3], C sub [I 4 0, I 4 3], I 4 0])) [I 2 0, I 2 0, I 2 1]

-- Factorial: factorial(x) = x!
factorial = C (R (const 1) (C mul [C S [I 3 1], I 3 0])) [I 1 0, Z]
