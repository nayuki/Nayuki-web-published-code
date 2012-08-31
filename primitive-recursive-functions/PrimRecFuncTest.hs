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
	-- Primitive functions
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
	
	-- Boolean functions
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
	
	-- Comparison functions
	TestCase PrimRecFunc.z [0] 1,
	TestCase PrimRecFunc.z [1] 0,
	TestCase PrimRecFunc.z [2] 0,
	TestCase PrimRecFunc.z [5] 0,
	
	TestCase PrimRecFunc.nz [0] 0,
	TestCase PrimRecFunc.nz [1] 1,
	TestCase PrimRecFunc.nz [2] 1,
	TestCase PrimRecFunc.nz [5] 1,
	
	TestCase PrimRecFunc.eq [0, 0] 1,
	TestCase PrimRecFunc.eq [0, 1] 0,
	TestCase PrimRecFunc.eq [0, 2] 0,
	TestCase PrimRecFunc.eq [1, 0] 0,
	TestCase PrimRecFunc.eq [1, 1] 1,
	TestCase PrimRecFunc.eq [1, 2] 0,
	TestCase PrimRecFunc.eq [2, 0] 0,
	TestCase PrimRecFunc.eq [2, 1] 0,
	TestCase PrimRecFunc.eq [2, 2] 1,
	TestCase PrimRecFunc.eq [5, 0] 0,
	TestCase PrimRecFunc.eq [6, 6] 1,
	TestCase PrimRecFunc.eq [3, 7] 0,
	
	TestCase PrimRecFunc.neq [0, 0] 0,
	TestCase PrimRecFunc.neq [0, 1] 1,
	TestCase PrimRecFunc.neq [0, 2] 1,
	TestCase PrimRecFunc.neq [1, 0] 1,
	TestCase PrimRecFunc.neq [1, 1] 0,
	TestCase PrimRecFunc.neq [1, 2] 1,
	TestCase PrimRecFunc.neq [2, 0] 1,
	TestCase PrimRecFunc.neq [2, 1] 1,
	TestCase PrimRecFunc.neq [2, 2] 0,
	TestCase PrimRecFunc.neq [5, 0] 1,
	TestCase PrimRecFunc.neq [6, 6] 0,
	TestCase PrimRecFunc.neq [3, 7] 1,
	
	TestCase PrimRecFunc.lt [0, 0] 0,
	TestCase PrimRecFunc.lt [0, 1] 1,
	TestCase PrimRecFunc.lt [0, 2] 1,
	TestCase PrimRecFunc.lt [1, 0] 0,
	TestCase PrimRecFunc.lt [1, 1] 0,
	TestCase PrimRecFunc.lt [1, 2] 1,
	TestCase PrimRecFunc.lt [2, 0] 0,
	TestCase PrimRecFunc.lt [2, 1] 0,
	TestCase PrimRecFunc.lt [2, 2] 0,
	TestCase PrimRecFunc.lt [5, 0] 0,
	TestCase PrimRecFunc.lt [6, 6] 0,
	TestCase PrimRecFunc.lt [3, 7] 1,
	
	TestCase PrimRecFunc.le [0, 0] 1,
	TestCase PrimRecFunc.le [0, 1] 1,
	TestCase PrimRecFunc.le [0, 2] 1,
	TestCase PrimRecFunc.le [1, 0] 0,
	TestCase PrimRecFunc.le [1, 1] 1,
	TestCase PrimRecFunc.le [1, 2] 1,
	TestCase PrimRecFunc.le [2, 0] 0,
	TestCase PrimRecFunc.le [2, 1] 0,
	TestCase PrimRecFunc.le [2, 2] 1,
	TestCase PrimRecFunc.le [5, 0] 0,
	TestCase PrimRecFunc.le [6, 6] 1,
	TestCase PrimRecFunc.le [3, 7] 1,
	
	TestCase PrimRecFunc.gt [0, 0] 0,
	TestCase PrimRecFunc.gt [0, 1] 0,
	TestCase PrimRecFunc.gt [0, 2] 0,
	TestCase PrimRecFunc.gt [1, 0] 1,
	TestCase PrimRecFunc.gt [1, 1] 0,
	TestCase PrimRecFunc.gt [1, 2] 0,
	TestCase PrimRecFunc.gt [2, 0] 1,
	TestCase PrimRecFunc.gt [2, 1] 1,
	TestCase PrimRecFunc.gt [2, 2] 0,
	TestCase PrimRecFunc.gt [5, 0] 1,
	TestCase PrimRecFunc.gt [6, 6] 0,
	TestCase PrimRecFunc.gt [3, 7] 0,
	
	TestCase PrimRecFunc.ge [0, 0] 1,
	TestCase PrimRecFunc.ge [0, 1] 0,
	TestCase PrimRecFunc.ge [0, 2] 0,
	TestCase PrimRecFunc.ge [1, 0] 1,
	TestCase PrimRecFunc.ge [1, 1] 1,
	TestCase PrimRecFunc.ge [1, 2] 0,
	TestCase PrimRecFunc.ge [2, 0] 1,
	TestCase PrimRecFunc.ge [2, 1] 1,
	TestCase PrimRecFunc.ge [2, 2] 1,
	TestCase PrimRecFunc.ge [5, 0] 1,
	TestCase PrimRecFunc.ge [6, 6] 1,
	TestCase PrimRecFunc.ge [3, 7] 0,
	
	-- Arithmetic functions
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
	
	TestCase PrimRecFunc.sub [0, 0] 0,
	TestCase PrimRecFunc.sub [0, 1] 0,
	TestCase PrimRecFunc.sub [0, 2] 0,
	TestCase PrimRecFunc.sub [1, 0] 1,
	TestCase PrimRecFunc.sub [1, 1] 0,
	TestCase PrimRecFunc.sub [1, 2] 0,
	TestCase PrimRecFunc.sub [2, 0] 2,
	TestCase PrimRecFunc.sub [2, 1] 1,
	TestCase PrimRecFunc.sub [2, 2] 0,
	TestCase PrimRecFunc.sub [2, 3] 0,
	TestCase PrimRecFunc.sub [3, 0] 3,
	TestCase PrimRecFunc.sub [5, 2] 3,
	TestCase PrimRecFunc.sub [7, 6] 1,
	
	TestCase PrimRecFunc.diff [0, 0] 0,
	TestCase PrimRecFunc.diff [0, 1] 1,
	TestCase PrimRecFunc.diff [0, 2] 2,
	TestCase PrimRecFunc.diff [1, 0] 1,
	TestCase PrimRecFunc.diff [1, 1] 0,
	TestCase PrimRecFunc.diff [1, 2] 1,
	TestCase PrimRecFunc.diff [2, 0] 2,
	TestCase PrimRecFunc.diff [2, 1] 1,
	TestCase PrimRecFunc.diff [2, 2] 0,
	TestCase PrimRecFunc.diff [5, 0] 5,
	TestCase PrimRecFunc.diff [6, 6] 0,
	TestCase PrimRecFunc.diff [3, 7] 4,
	
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
	
	TestCase PrimRecFunc.exp [0, 0] 1,
	TestCase PrimRecFunc.exp [0, 1] 0,
	TestCase PrimRecFunc.exp [0, 2] 0,
	TestCase PrimRecFunc.exp [1, 0] 1,
	TestCase PrimRecFunc.exp [1, 1] 1,
	TestCase PrimRecFunc.exp [1, 2] 1,
	TestCase PrimRecFunc.exp [2, 0] 1,
	TestCase PrimRecFunc.exp [2, 1] 2,
	TestCase PrimRecFunc.exp [2, 2] 4,
	TestCase PrimRecFunc.exp [2, 3] 8,
	TestCase PrimRecFunc.exp [2, 4] 16,
	TestCase PrimRecFunc.exp [2, 5] 32,
	TestCase PrimRecFunc.exp [2, 6] 64,
	TestCase PrimRecFunc.exp [2, 7] 128,
	TestCase PrimRecFunc.exp [2, 8] 256,
	TestCase PrimRecFunc.exp [2, 9] 512,
	TestCase PrimRecFunc.exp [3, 1] 3,
	TestCase PrimRecFunc.exp [3, 2] 9,
	TestCase PrimRecFunc.exp [4, 3] 64,
	TestCase PrimRecFunc.exp [5, 3] 125,
	TestCase PrimRecFunc.exp [6, 2] 36,
	
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
	let actual = eval f arg
	if actual /= ans then
		putStrLn $ "    " ++ (show f) ++ " " ++ (show arg) ++ " = " ++ (show actual) ++ " != " ++ (show ans)
	else
		return ()
	printFails tcs
