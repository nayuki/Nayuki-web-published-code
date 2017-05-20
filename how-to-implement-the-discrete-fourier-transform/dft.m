% 
% Discrete Fourier transform
% by Project Nayuki, 2017. Public domain.
% https://www.nayuki.io/page/how-to-implement-the-discrete-fourier-transform
% 


% 
% Computes the discrete Fourier transform (DFT) of the given complex vector.
% 'input' can be a row vector or a column vector. The returned output has the same dimensions.
% 
function output = compute_dft_scalarized(input)
	assert(isvector(input));
	n = numel(input);
	output = NaN(size(input));
	for k = 0 : n - 1  % For each output element
		s = 0;
		for t = 0 : n - 1  % For each input element
			s = s + input(t + 1) * exp(-2i * pi * t * k / n);
		end
		output(k + 1) = s;
	end
end


% 
% (Alternate implementation using matrix arithmetic.)
% Computes the discrete Fourier transform (DFT) of the given complex vector.
% 'input' can be a row vector or a column vector. The returned output has the same dimensions.
% 
function output = compute_dft_vectorized(input)
	assert(isvector(input));
	n = numel(input);
	matrix = exp(-2i * pi / n * (0 : n-1)' * (0 : n-1));
	if size(input, 1) == 1  % Row vector
		output = input * matrix;
	elseif size(input, 2) == 1  % Column vector
		output = matrix * input;
	end
end
