/* 
 * Zeller's congruence (TypeScript)
 * by Project Nayuki, 2022. Public domain.
 * https://www.nayuki.io/page/zellers-congruence
 */


/*---- Zeller's congruence function ----*/

/**
 * Returns the day-of-week dow for the given date
 * (y, m, d) on the proleptic Gregorian calendar.
 * Values of dow are 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
 * Strict values of m are 1 = January, ..., 12 = December.
 * Strict values of d start from 1.
 * The handling of months and days-of-month is lenient.
 */
function dayOfWeek(y: number, m: number, d: number) {
	function div(a: number, b: number): number {
		return Math.floor(a / b);
	}
	m = m % 4800 - 3 + 4800 * 2;
	y = y % 400 + 400 + div(m, 12);
	m %= 12;
	d = d % 7 + 7;
	const temp: number = y + div(y, 4) - div(y, 100) + div(y, 400);
	return (temp + div(m * 13 + 12, 5) + d) % 7;
}



/*---- Test suite ----*/

function main(): void {
	for (const func of TEST_SUITE) {
		let msg: string = func.name + "(): ";
		try {
			func();
			msg += "Pass";
		} catch (e) {
			msg += "Fail - " + (e as Error).message;
		}
		postMessage(msg);
	}
	postMessage("Finished");
}

setTimeout(main);


const TEST_SUITE: Array<()=>void> = [
	
	function testSimple(): void {
		const CASES: Array<[number,number,number,number]> = [
			[-679,  9,  8, 1],
			[-657,  2,  6, 3],
			[-629,  5, 14, 2],
			[-567,  8, 25, 0],
			[-526,  7, 24, 5],
			[-316, 11, 18, 6],
			[-270,  7, 17, 1],
			[-212,  1, 25, 5],
			[-212, 11,  2, 0],
			[- 43,  7, 20, 6],
			[1619, 10, 16, 3],
			[1620, 11, 30, 1],
			[1631,  9,  3, 3],
			[1637,  2, 18, 3],
			[1653,  5, 25, 0],
			[1735,  1,  7, 5],
			[1753,  8, 28, 2],
			[1804,  6, 30, 6],
			[1810, 10,  3, 3],
			[1835,  3,  2, 1],
			[1844,  8, 14, 3],
			[1844, 12, 16, 1],
			[1899,  5, 23, 2],
			[1912, 12, 10, 2],
			[1915,  8,  2, 1],
			[1938,  6, 18, 6],
			[1945,  6,  7, 4],
			[1965,  4, 28, 3],
			[1998,  6, 18, 4],
			[1999, 12, 31, 5],
			[2000,  1,  1, 6],
			[2000,  2,  1, 2],
			[2000,  2, 29, 2],
			[2000,  3,  1, 3],
			[2001,  3,  1, 4],
			[2002,  3,  1, 5],
			[2003,  3,  1, 6],
			[2004,  3,  1, 1],
			[2071,  6, 13, 6],
			[2094,  1, 20, 3],
			[2124,  7, 26, 3],
			[2196, 10, 12, 3],
			[2213,  5,  5, 3],
			[2216,  3, 15, 5],
			[2225,  8, 26, 5],
			[2268,  9,  2, 3],
			[2306,  7, 25, 3],
			[2336,  6, 20, 6],
			[2348,  7, 16, 5],
		];
		for (const [y, m, d, dow] of CASES)
			assertEquals(dow, dayOfWeek(y, m, d));
	},
	
	
	function testAscending(): void {
		let ymd: [number,number,number] = [1600, 1, 1];
		let dow: number = 6;
		while (ymd[0] < 2400) {
			assertEquals(dow, dayOfWeek(ymd[0], ymd[1], ymd[2]));
			ymd = nextDate(ymd);
			dow = (dow + 1) % 7;
		}
	},
	
	
	function testDescending(): void {
		let ymd: [number,number,number] = [1600, 1, 1];
		let dow: number = 6;
		while (ymd[0] > 800) {
			assertEquals(dow, dayOfWeek(ymd[0], ymd[1], ymd[2]));
			ymd = previousDate(ymd);
			dow = (dow - 1 + 7) % 7;
		}
	},
	
	
	function testVsNaiveRandomly(): void {
		const TRIALS: number = 1000;
		for (let i = 0; i < TRIALS; i++) {
			const y: number = Math.floor(Math.random() * 800) + 1600;
			const m: number = Math.floor(Math.random() * 12) + 1;
			const d: number = Math.floor(Math.random() * monthLength(y, m)) + 1;
			assertEquals(dayOfWeekNaive(y, m, d), dayOfWeek(y, m, d));
		}
	},
	
	
	function testLenientExtreme(): void {
		const CASES: Array<[number,number,number,number]> = [
			[-2147483648, -2147483648, -2147483648, 4],
			[-2147483648, -2147483648,           0, 6],
			[-2147483648, -2147483648,  2147483647, 0],
			[-2147483648,           0, -2147483648, 3],
			[-2147483648,           0,           0, 5],
			[-2147483648,           0,  2147483647, 6],
			[-2147483648,  2147483647, -2147483648, 0],
			[-2147483648,  2147483647,           0, 2],
			[-2147483648,  2147483647,  2147483647, 3],
			[          0, -2147483648, -2147483648, 0],
			[          0, -2147483648,           0, 2],
			[          0, -2147483648,  2147483647, 3],
			[          0,           0, -2147483648, 0],
			[          0,           0,           0, 2],
			[          0,           0,  2147483647, 3],
			[          0,  2147483647, -2147483648, 4],
			[          0,  2147483647,           0, 6],
			[          0,  2147483647,  2147483647, 0],
			[ 2147483647, -2147483648, -2147483648, 3],
			[ 2147483647, -2147483648,           0, 5],
			[ 2147483647, -2147483648,  2147483647, 6],
			[ 2147483647,           0, -2147483648, 3],
			[ 2147483647,           0,           0, 5],
			[ 2147483647,           0,  2147483647, 6],
			[ 2147483647,  2147483647, -2147483648, 6],
			[ 2147483647,  2147483647,           0, 1],
			[ 2147483647,  2147483647,  2147483647, 2],
			
			[-2147482867,        3391,        -370, 6],
			[-2147482916, -2147474794,  2147483083, 6],
			[       -113,        4416,         846, 3],
			[-2147483527,        1953,  2147483113, 0],
			[-2147483609,        5056, -2147483507, 5],
			[-2147483145, -2147473696,  2147483050, 3],
			[-2147483364, -2147476925,  2147483110, 0],
			[-2147482829,  2147478555, -2147482893, 4],
			[ 2147483004,        4207,         439, 5],
			[ 2147483375,  2147476221,        -264, 1],
			[ 2147483331, -2147474091,          24, 1],
			[-2147482651,       -2557,  2147482914, 0],
			[       -474,  2147481275, -2147483361, 6],
			[ 2147483575,        8469,  2147483571, 4],
			[       -729,  2147482455,        -742, 3],
			[-2147483082, -2147482431,         893, 5],
			[       -935,  2147477896,        -983, 3],
			[        989,  2147478994,         103, 2],
			[ 2147483388,       -7349, -2147482986, 3],
			[-2147483243,  2147478174,        -972, 1],
			[ 2147483126, -2147473910,  2147483010, 3],
			[ 2147482852,  2147475470,         762, 4],
			[        978,       -3684,         921, 0],
			[-2147482993,        5521,         659, 2],
			[-2147483592,       -6177,        -416, 6],
			[-2147482685,  2147480301, -2147483125, 0],
			[-2147483117,       -3192,  2147482759, 1],
			[-2147482977,  2147480575, -2147483637, 2],
			[ 2147482784,  2147481908, -2147483231, 0],
			[ 2147483307, -2147482066,          97, 1],
			[-2147482846, -2147483093,        -117, 4],
			[-2147483546, -2147481111,  2147483477, 1],
			[       -978,  2147477925,  2147483516, 5],
			[ 2147483440,       -5509,        -328, 3],
			[-2147482752, -2147482615,  2147483471, 2],
			[-2147483374,  2147477167,        -195, 2],
			[       -655,  2147474795,  2147483487, 3],
			[-2147483616,       -3046, -2147483405, 5],
			[-2147482974, -2147475398,  2147483324, 3],
			[ 2147483293, -2147473953,  2147483436, 5],
			[-2147482873, -2147478425, -2147482858, 1],
			[-2147483483,  2147475023,        -975, 2],
			[-2147482989,  2147478204,         583, 5],
			[ 2147482648, -2147483615,         265, 6],
			[-2147483496, -2147479904, -2147483523, 5],
			[        865,        8184,  2147482837, 2],
			[-2147483395, -2147475567,  2147482843, 1],
			[-2147482753, -2147478064,  2147483301, 2],
			[ 2147483542,  2147474858,         297, 4],
			[-2147483156,  2147480861, -2147482792, 5],
			[       -714,  2147480816,  2147482718, 1],
			[ 2147482678, -2147474015, -2147483327, 6],
			[ 2147482712, -2147480138, -2147482804, 0],
			[-2147482893,       -8853,         767, 2],
			[ 2147483123,       -8226, -2147483251, 3],
			[-2147483312,  2147475396,         397, 3],
			[-2147483272,  2147480332,  2147482777, 6],
			[ 2147483464,       -2587,  2147483428, 3],
			[ 2147483440,         336,  2147483435, 5],
			[ 2147483554, -2147479219,  2147483635, 3],
			[ 2147483098,       -5676,        -777, 2],
			[       -978,        2245,  2147483577, 4],
			[       -385,  2147477663, -2147483334, 1],
			[        493,       -5408, -2147482835, 0],
			[       -832,  2147482578, -2147483289, 1],
			[ 2147483121,         721,        -532, 3],
			[       -839, -2147476439,        -421, 0],
			[-2147483325,  2147475737,        -673, 6],
			[ 2147482803,  2147482782, -2147483052, 1],
			[-2147483289,  2147477201,        -854, 0],
			[ 2147482988, -2147482988,  2147483495, 0],
			[ 2147482833,        -152,        -450, 0],
			[       -680,  2147476457,         614, 6],
			[       -495, -2147482633,         135, 1],
			[ 2147483352,  2147473936,        -231, 1],
			[        538,  2147481471,  2147482683, 1],
			[-2147483258, -2147476749, -2147482982, 3],
			[ 2147483142, -2147476915, -2147483279, 2],
			[-2147482846, -2147477082,        -811, 0],
			[ 2147482814,  2147473863,         811, 1],
			[ 2147483149,        4413, -2147483377, 0],
			[-2147483088,        5846, -2147483562, 4],
			[        -19, -2147481074, -2147482835, 0],
			[ 2147483545,       -5504,  2147483436, 3],
			[       -699, -2147479378,  2147483028, 5],
			[-2147483459, -2147477306,        -669, 5],
			[-2147482851,  2147482950, -2147482920, 0],
			[        844, -2147483061,        -732, 5],
			[ 2147483354,  2147478624, -2147483356, 0],
			[        105,  2147482272,  2147482962, 2],
			[-2147483504,  2147476125,  2147482960, 3],
			[ 2147482773,  2147479428,          57, 4],
			[       -155, -2147480377,         385, 4],
			[       -565, -2147481441,        -627, 5],
			[ 2147483564,  2147477196, -2147482687, 6],
			[ 2147483311, -2147481163,  2147482945, 6],
			[        867, -2147481094,        -470, 3],
			[-2147483548,  2147473721, -2147483013, 0],
			[ 2147483177, -2147482328,         186, 2],
			[        775,  2147474818,  2147482979, 4],
		];
		for (const [y, m, d, dow] of CASES)
			assertEquals(dow, dayOfWeek(y, m, d));
	},
	
	
	function testLenientRandomly(): void {
		const TRIALS: number = 1_000_000;
		for (let i = 0; i < TRIALS; i++) {
			let y: number = Math.floor(Math.random() * 400) + 2000;
			let m: number = Math.floor(Math.random() * 12) + 1;
			let d: number = Math.floor(Math.random() * monthLength(y, m)) + 1;
			const dow: number = dayOfWeek(y, m, d);
			
			const temp: number = Math.floor(Math.random() * 10000) - 5000;
			y += temp;
			m -= temp * 12;
			d += (Math.floor(Math.random() * 1000) - 500) * 7;
			assertEquals(dow, dayOfWeek(y, m, d));
		}
	},
	
];



/*---- Helper functions ----*/

function dayOfWeekNaive(y: number, m: number, d: number): number {
	if (!(1 <= m && m <= 12))
		throw new RangeError("Invalid month");
	if (!(1 <= d && d <= monthLength(y, m)))
		throw new RangeError("Invalid day-of-month");
	let ymd: [number,number,number] = [1600, 1, 1];
	let dow: number = 6;
	while (compare(ymd, y, m, d) < 0) {
		ymd = nextDate(ymd);
		dow = (dow + 1) % 7;
	}
	while (compare(ymd, y, m, d) > 0) {
		ymd = previousDate(ymd);
		dow = (dow - 1 + 7) % 7;
	}
	return dow;
}


function compare(ymd: [number,number,number], y: number, m: number, d: number): number {
	if (ymd[0] != y)
		return ymd[0] < y ? -1 : 1;
	else if (ymd[1] != m)
		return ymd[1] < m ? -1 : 1;
	else if (ymd[2] != d)
		return ymd[2] < d ? -1 : 1;
	else
		return 0;
}


function nextDate([y, m, d]: [number,number,number]): [number,number,number] {
	if (!(1 <= m && m <= 12))
		throw new RangeError("Invalid month");
	if (!(1 <= d && d <= monthLength(y, m)))
		throw new RangeError("Invalid day-of-month");
	
	if (d < monthLength(y, m))
		return [y, m, d + 1];
	else if (m < 12)
		return [y, m + 1, 1];
	else
		return [y + 1, 1, 1];
}


function previousDate([y, m, d]: [number,number,number]): [number,number,number] {
	if (!(1 <= m && m <= 12))
		throw new RangeError("Invalid month");
	if (!(1 <= d && d <= monthLength(y, m)))
		throw new RangeError("Invalid day-of-month");
	
	if (d > 1)
		return [y, m, d - 1];
	else if (m > 1)
		return [y, m - 1, monthLength(y, m - 1)];
	else
		return [y - 1, 12, 31];
}


function monthLength(y: number, m: number): number {
	if (m != 2)
		return MONTH_LENGTHS[m];
	else
		return isLeapYear(y) ? 29 : 28;
}

const MONTH_LENGTHS: Array<number> = [-1, 31, -1, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];


function isLeapYear(y: number): boolean {
	return y % 4 == 0 && (y % 100 != 0 || y % 400 == 0);
}


function assertEquals(expect: number, actual: number): void {
	if (actual !== expect)
		throw new Error("Assertion error");
}
