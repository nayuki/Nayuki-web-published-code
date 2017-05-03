% 
% Next lexicographical permutation algorithm (MATLAB)
% by Project Nayuki, 2017. Public domain.
% https://www.nayuki.io/page/next-lexicographical-permutation-algorithm
% 


function result = nextperm(arr)
% Computes and returns the next lexicographical permutation of the given vector,
% or returns [] when the argument is already the last possible permutation.
% Example: nextperm([0, 1, 0]) -> [1, 0, 0]

	% Find non-increasing suffix
	i = length(arr);
	while i > 1 && arr(i - 1) >= arr(i)
		i = i - 1;
	end
	if i <= 1
		result = [];
		return;
	end
	
	% Find successor to pivot
	result = arr;
	j = length(result);
	while result(j) <= result(i - 1)
		j = j - 1;
	end
	temp = result(i - 1);
	result(i - 1) = result(j);
	result(j) = temp;
	
	% Reverse suffix
	result(i : end) = result(end : -1 : i);
end
