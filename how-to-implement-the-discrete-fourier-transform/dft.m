% 
% Discrete Fourier transform
% by Project Nayuki, 2014. Public domain.
% http://www.nayuki.io/page/how-to-implement-the-discrete-fourier-transform
% 

% 
% This file contains multiple implementations.
% Before running the code, choose one and delete the rest.
% 

% --------------------------------------------------------------------------------

% 
% Computes the discrete Fourier transform (DFT) of the given vector.
% 'input' can be a row vector or a column vector.
% The returned output is the same type of vector with the same dimensions.
% 
function output = dft(input)
  n = length(input);
  output = zeros(size(input));
  for k = 0 : n - 1  % For each output element
    s = 0;
    for t = 0 : n - 1  % For each input element
      s = s + input(t + 1) * exp(-2i * pi * t * k / n);
    end
    output(k + 1) = s;
  end
end

% --------------------------------------------------------------------------------

% 
% (Alternate implementation using matrix arithmetic.)
% Computes the discrete Fourier transform (DFT) of the given vector.
% 'input' can be a row vector or a column vector.
% The returned output is the same type of vector with the same dimensions.
% 
function output = dft(input)
  n = length(input);
  matrix = exp(-2i * pi / n * [0:n-1]' * [0:n-1]);
  if     all(size(input) == [1 n])  % Row vector
    output = input * matrix;
  elseif all(size(input) == [n 1])  % Column vector
    output = matrix * input;
  end
end
