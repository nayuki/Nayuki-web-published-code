% Discrete Fourier transform
% Copyright (c) 2011 Nayuki Minase


% Computes the discrete Fourier transform of the given input vector.
% 'input' can be a row vector or a column vector. 'output' will be the same type of vector.
function output = dft(input)
  n = length(input);
  output = zeros(size(input));
  for k = 0 : n - 1
    s = 0;
    for t = 0 : n - 1
      s = s + input(t + 1) * exp(-2i * pi * t * k / n);
    end
    output(k + 1) = s;
  end
end
