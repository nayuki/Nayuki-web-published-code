% 
% Zeller's congruence (MATLAB)
% by Project Nayuki, 2022. Public domain.
% https://www.nayuki.io/page/zellers-congruence
% 


% 
% Returns the day-of-week dow for the given date
% (y, m, d) on the proleptic Gregorian calendar.
% Values of dow are 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
% Strict values of m are 1 = January, ..., 12 = December.
% Strict values of d start from 1.
% The handling of months and days-of-month is lenient.
% 
function dow = day_of_week(y, m, d)
	m = mod(mod(m, 4800) - 3, 4800);
	y = mod(y, 400) + floor(m / 12);
	m = mod(m, 12);
	d = mod(d, 7);
	temp = y + floor(y / 4) - floor(y / 100) + floor(y / 400);
	dow = mod(temp + floor((m * 13 + 12) / 5) + d, 7);
end
