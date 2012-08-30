{- 
 - Primitive recursive functions
 - Copyright (c) 2012 Nayuki Minase
 -}

module PrimRecFunc where

import Prelude hiding (const, not)


{---- Data type for primitive recursive functions ----}

data Prf = Z | S | I Int Int | C Prf [Prf] | R Prf Prf

instance Show Prf where  -- For displaying a Prf as a string
	show Z = "Z"
	show S = "S"
	show (I n i) = "I " ++ (show n) ++ " " ++ (show i)
	show (C f gs) = "C " ++ (parenShow f) ++ " " ++ (show gs)
	show (R f g) = "R " ++ (parenShow f) ++ " " ++ (parenShow g)
	showList [] = showString "[]"  -- Won't be used, anyway
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


{---- Boolean primitive recursive functions ----}
-- 0 means false, 1 means true, and all other values cause unspecified behavior

-- prnot(x) = not x
not = C (R (const 1) (C Z [I 3 0])) [I 1 0, Z]

-- prand(x, y) = x and y
and = R Z (I 3 2)

-- pror(x, y) = x or y
or = R (I 1 0) (C S [I 3 1])

-- prxor(x, y) = x xor y
xor = R (I 1 0) (C not [I 3 2])


{---- Arithmetic primitive recursive functions ----}

-- Constant: const_{n}(x) = n
const n
	| n <  0 = error ("const " ++ (show n))
	| n == 0 = Z
	| n >  0 = C S [const (n-1)]

-- Predecessor: pred(0) = 0; pred(x) = x - 1
pred = C (R Z (I 3 1)) [I 1 0, I 1 0]

-- Addition/sum: add(x, y) = x + y
add = R (I 1 0) (C S [I 3 0])

-- Multiplication/product: mul(x, y) = x * y
mul = R Z (C add [I 3 0, I 3 2])

-- Factorial: fact(x) = x!
fact = C (R (const 1) (C mul [C S [I 3 1], I 3 0])) [I 1 0, Z]
