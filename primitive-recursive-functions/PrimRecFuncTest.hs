{- 
 - Test suite for PrimRecFunc.
 - Runnable as a main program, which should print "All N tests passed".
 - 
 - Copyright (c) 2012 Nayuki Minase
 -}

module PrimRecFuncTest where

import PrimRecFunc


{---- Test cases ----}

data TestCase = TestCase Prf [Int] Int

tests :: [TestCase]
tests = [
	TestCase Z [0] 0,
	TestCase Z [1] 0,
	TestCase Z [2] 0,
	TestCase Z [5] 0,
	
	TestCase S [0] 1,
	TestCase S [1] 2,
	TestCase S [2] 3,
	TestCase S [5] 6,
	
	TestCase (I 1 0) [0] 0,
	TestCase (I 1 0) [3] 3,
	TestCase (I 2 0) [4, 5] 4,
	TestCase (I 2 1) [4, 5] 5,
	TestCase (I 3 0) [7, 8, 9] 7,
	TestCase (I 3 1) [7, 8, 9] 8,
	TestCase (I 3 2) [7, 8, 9] 9,
	
	TestCase PrimRecFunc.not [0] 1,
	TestCase PrimRecFunc.not [1] 0,
	
	TestCase PrimRecFunc.and [0, 0] 0,
	TestCase PrimRecFunc.and [0, 1] 0,
	TestCase PrimRecFunc.and [1, 0] 0,
	TestCase PrimRecFunc.and [1, 1] 1,
	
	TestCase PrimRecFunc.or [0, 0] 0,
	TestCase PrimRecFunc.or [0, 1] 1,
	TestCase PrimRecFunc.or [1, 0] 1,
	TestCase PrimRecFunc.or [1, 1] 1,
	
	TestCase PrimRecFunc.xor [0, 0] 0,
	TestCase PrimRecFunc.xor [0, 1] 1,
	TestCase PrimRecFunc.xor [1, 0] 1,
	TestCase PrimRecFunc.xor [1, 1] 0,
	
	TestCase (PrimRecFunc.const 0) [0] 0,
	TestCase (PrimRecFunc.const 0) [9] 0,
	TestCase (PrimRecFunc.const 1) [0] 1,
	TestCase (PrimRecFunc.const 1) [1] 1,
	TestCase (PrimRecFunc.const 1) [3] 1,
	TestCase (PrimRecFunc.const 2) [0] 2,
	TestCase (PrimRecFunc.const 2) [1] 2,
	TestCase (PrimRecFunc.const 2) [2] 2,
	TestCase (PrimRecFunc.const 3) [0] 3,
	TestCase (PrimRecFunc.const 3) [3] 3,
	TestCase (PrimRecFunc.const 3) [5] 3,
	
	TestCase PrimRecFunc.pred [0] 0,
	TestCase PrimRecFunc.pred [1] 0,
	TestCase PrimRecFunc.pred [2] 1,
	TestCase PrimRecFunc.pred [3] 2,
	TestCase PrimRecFunc.pred [9] 8,
	
	TestCase PrimRecFunc.add [0, 0] 0,
	TestCase PrimRecFunc.add [0, 1] 1,
	TestCase PrimRecFunc.add [0, 3] 3,
	TestCase PrimRecFunc.add [1, 0] 1,
	TestCase PrimRecFunc.add [2, 0] 2,
	TestCase PrimRecFunc.add [1, 1] 2,
	TestCase PrimRecFunc.add [2, 5] 7,
	TestCase PrimRecFunc.add [6, 3] 9,
	
	TestCase PrimRecFunc.mul [0, 0] 0,
	TestCase PrimRecFunc.mul [0, 1] 0,
	TestCase PrimRecFunc.mul [0, 2] 0,
	TestCase PrimRecFunc.mul [1, 0] 0,
	TestCase PrimRecFunc.mul [3, 0] 0,
	TestCase PrimRecFunc.mul [1, 1] 1,
	TestCase PrimRecFunc.mul [1, 2] 2,
	TestCase PrimRecFunc.mul [2, 1] 2,
	TestCase PrimRecFunc.mul [2, 2] 4,
	TestCase PrimRecFunc.mul [3, 7] 21,
	TestCase PrimRecFunc.mul [5, 8] 40,
	
	TestCase PrimRecFunc.fact [0] 1,
	TestCase PrimRecFunc.fact [1] 1,
	TestCase PrimRecFunc.fact [2] 2,
	TestCase PrimRecFunc.fact [3] 6,
	TestCase PrimRecFunc.fact [4] 24,
	TestCase PrimRecFunc.fact [5] 120,
	TestCase PrimRecFunc.fact [6] 720]


{---- Main program ----}

main = do
	let passed = Prelude.and (map (\(TestCase f arg ans) -> (eval f arg) == ans) tests)
	if passed then
		putStrLn $ "All " ++ (show (length tests)) ++ " tests passed"
	else do
		putStrLn "One or more tests failed:"
		printFails tests


printFails :: [TestCase] -> IO ()
printFails [] = return ()
printFails ((TestCase f arg ans):tcs) = do
	if eval f arg /= ans then
		putStrLn $ "    " ++ (show f) ++ " " ++ (show arg) ++ " != " ++ (show ans)
	else
		return ()
	printFails tcs
