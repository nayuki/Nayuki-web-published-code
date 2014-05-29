{- 
 - Next lexicographical permutation algorithm
 - By Nayuki Minase, 2014. Public domain.
 - http://nayuki.eigenstate.org/page/next-lexicographical-permutation-algorithm
 -}

module NextPerm (nextPermutation) where


{- 
 - Computes the next lexicographical permutation of the specified finite list of numbers.
 - Returns Nothing if the argument is already the highest permutation.
 -}
nextPermutation :: [Integer] -> Maybe [Integer]
nextPermutation xs =
	let
		len = length xs
		revSuffix = findPrefix (reverse xs)  -- Reverse of longest non-increasing suffix
		suffixLen = length revSuffix
		prefixMinusPivot = take (len - suffixLen - 1) xs
		pivot = xs !! (len - suffixLen - 1)
		tempIndex = (length (takeWhile (<= pivot) revSuffix))  -- Index of new pivot in reversed suffix
		newSuffix = (take tempIndex revSuffix) ++ (pivot : (drop (tempIndex + 1) revSuffix))
	in
		if suffixLen == len then Nothing else Just (prefixMinusPivot ++ ((revSuffix !! tempIndex) : newSuffix))
	where
		findPrefix [] = []
		findPrefix (x:xs) = x : (if xs /= [] && x <= (head xs) then (findPrefix xs) else [])

-- Example: nextPermutation [0, 1, 0] -> Just [1, 0, 0]
