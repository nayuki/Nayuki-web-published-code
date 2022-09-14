/* 
 * Binary indexed tree test (TypeScript)
 * 
 * Copyright (c) 2022 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/binary-indexed-tree
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * - The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 * - The Software is provided "as is", without warranty of any kind, express or
 *   implied, including but not limited to the warranties of merchantability,
 *   fitness for a particular purpose and noninfringement. In no event shall the
 *   authors or copyright holders be liable for any claim, damages or other
 *   liability, whether in an action of contract, tort or otherwise, arising from,
 *   out of or in connection with the Software or the use or other dealings in the
 *   Software.
 */


/*---- Test suite ----*/

const TEST_SUITE_FUNCS: Array<()=>void> = [
	
	function testSizeConstructor(): void {
		const SIZELIMIT: number = 3000;
		const CHECKS: number = 10;
		for (let len = 0; len < SIZELIMIT; len++) {
			
			let bt = new BinaryIndexedTree(len);
			assertEquals(len, bt.length);
			assertEquals(0, bt.getTotal());
			
			for (let i = 0; i < CHECKS; i++) {
				if (len > 0)
					assertEquals(0, bt.get(randInt(len)));
				assertEquals(0, bt.getPrefixSum(randInt(len + 1)));
				
				let start: number = randInt(len + 1);
				let end  : number = randInt(len + 1);
				if (start > end) {
					const temp: number = start;
					start = end;
					end = temp;
				}
				assertEquals(0, bt.getRangeSum(start, end));
			}
		}
	},
	
	
	function testAllOnes(): void {
		const SIZELIMIT: number = 3000;
		const CHECKS: number = 10;
		for (let len = 1; len < SIZELIMIT; len++) {
			
			let bt: BinaryIndexedTree;
			const mode: number = randInt(4);
			if (mode == 0) {
				let vals: Array<number> = [];
				for (let i = 0; i < len; i++)
					vals.push(1);
				bt = new BinaryIndexedTree(vals);
			} else {
				bt = new BinaryIndexedTree(len);
				let p: number;
				if      (mode == 1) p = 0;
				else if (mode == 2) p = 1;
				else if (mode == 3) p = Math.random();
				else throw new Error("Assertion error");
				for (let i = 0; i < len; i++) {
					if (Math.random() < p)
						bt.add(i, 1);
					else
						bt.set(i, 1);
				}
			}
			
			assertEquals(len, bt.length);
			assertEquals(len, bt.getTotal());
			for (let i = 0; i < CHECKS; i++) {
				assertEquals(1, bt.get(randInt(len)));
				const k: number = randInt(len + 1);
				assertEquals(k, bt.getPrefixSum(k));
				
				let start: number = randInt(len + 1);
				let end  : number = randInt(len + 1);
				if (start > end) {
					const temp: number = start;
					start = end;
					end = temp;
				}
				assertEquals(end - start, bt.getRangeSum(start, end));
			}
		}
	},
	
	
	function testArrayConstructorRandomly(): void {
		const TRIALS: number = 3000;
		const SIZELIMIT: number = 10000;
		const CHECKS: number = 100;
		for (let i = 0; i < TRIALS; i++) {
			
			const len: number = randInt(SIZELIMIT);
			let vals: Array<number> = [];
			let cums: Array<number> = [0];
			for (let j = 0; j < len; j++) {
				vals.push(randInt(2001) - 1000);
				cums.push(cums[j] + vals[j]);
			}
			
			let bt = new BinaryIndexedTree(vals);
			assertEquals(len, bt.length);
			assertEquals(cums[len], bt.getTotal());
			
			for (let j = 0; j < CHECKS; j++) {
				if (len > 0) {
					const k: number = randInt(len);
					assertEquals(vals[k], bt.get(k));
				}
				const k: number = randInt(len + 1);
				assertEquals(cums[k], bt.getPrefixSum(k));
				
				let start: number = randInt(len + 1);
				let end  : number = randInt(len + 1);
				if (start > end) {
					const temp: number = start;
					start = end;
					end = temp;
				}
				assertEquals(cums[end] - cums[start], bt.getRangeSum(start, end));
			}
		}
	},
	
	
	function testAddAndSetRandomly(): void {
		const TRIALS: number = 3000;
		const SIZELIMIT: number = 3000;
		const OPERATIONS: number = 3000;
		const CHECKS: number = 100;
		for (let i = 0; i < TRIALS; i++) {
			
			const len: number = randInt(SIZELIMIT) + 1;
			let vals: Array<number> = [];
			let bt: BinaryIndexedTree;
			if (Math.random() < 0.5) {
				for (let j = 0; j < len; j++)
					vals.push(0);
				bt = new BinaryIndexedTree(len);
			} else {
				for (let j = 0; j < len; j++)
					vals[j] = randInt(2001) - 1000;
				bt = new BinaryIndexedTree(vals);
			}
			
			for (let j = 0; j < OPERATIONS; j++) {
				const k: number = randInt(len);
				const x: number = randInt(2001) - 1000;
				if (Math.random() < 0.5) {
					vals[k] += x;
					bt.add(k, x);
				} else {
					vals[k] = x;
					bt.set(k, x);
				}
			}
			
			let cums: Array<number> = [0];
			vals.forEach((x, j) =>
				cums.push(cums[j] + x));
			
			for (let j = 0; j < CHECKS; j++) {
				let k: number = randInt(len);
				assertEquals(vals[k], bt.get(k));
				k = randInt(len + 1);
				assertEquals(cums[k], bt.getPrefixSum(k));
				
				let start: number = randInt(len + 1);
				let end  : number = randInt(len + 1);
				if (start > end) {
					const temp: number = start;
					start = end;
					end = temp;
				}
				assertEquals(cums[end] - cums[start], bt.getRangeSum(start, end));
			}
		}
	},
	
];



/*---- Helper definitions ----*/

function randInt(n: number): number {
	return Math.floor(Math.random() * n);
}


function assertEquals(expect: number, actual: number): void {
	if (actual !== expect)
		throw new Error("Value mismatch");
}



/*---- Main runner ----*/

(function(): void {
	let i: number = 0;
	function iterate(): void {
		let msg: string;
		if (i >= TEST_SUITE_FUNCS.length)
			msg = "Finished";
		else {
			msg = TEST_SUITE_FUNCS[i].name + "(): ";
			try {
				TEST_SUITE_FUNCS[i]();
				msg += "Pass";
			} catch (e) {
				msg += "Fail - " + e.message;
			}
			i++;
			setTimeout(iterate);
		}
		let li: HTMLElement = document.createElement("li");
		li.textContent = msg;
		(document.getElementById("results") as HTMLElement).append(li);
	}
	iterate();
})();
