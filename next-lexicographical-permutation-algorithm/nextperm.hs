{- 
 - Next lexicographical permutation algorithm
 - By Nayuki Minase, 2013. Public domain.
 - http://nayuki.eigenstate.org/page/next-lexicographical-permutation-algorithm
 -}

module NextPerm (nextPermutation) where


{- 
 - Computes the next lexicographical permutation of the specified finite list of numbers.
 - Returns the pair {status, permuted list}, where the Boolean value indicates
 - whether a next permutation existed or not.
 -}
nextPermutation :: [Integer] -> (Bool, [Integer])
nextPermutation [] = (False, [])
nextPermutation xs =
	let suffix = fst (findSuffix xs)  -- Longest non-decreasing suffix
	    suflen = length suffix
	    len = length xs
	    prefixMinusPivot = take (len - suflen - 1) xs
	in if suflen == len then (False, xs) else
		let pivotIndex = len - suflen - 1
		    pivot = xs !! pivotIndex
		    newIndex = (length (takeWhile (> pivot) suffix)) - 1  -- Index of rightmost element in suffix greater than pivot
		    newSuffix = reverse $ (take newIndex suffix) ++ (pivot : (drop (newIndex + 1) suffix))
		in (True, prefixMinusPivot ++ ((suffix !! newIndex) : newSuffix))
	where
		findSuffix [x] = ([x], True)
		findSuffix (x:xs) =
			let (suf, cont) = findSuffix xs
			in if cont && x >= (head suf) then (x:suf, True) else (suf, False)

-- Example: nextPermutation [0, 1, 0] -> (True, [1, 0, 0])
