/* 
 * Panel de Pon puzzle solver
 * 
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/panel-de-pon-puzzle-solver-javascript
 */


namespace app {
	
	/*---- User interface ----*/
	
	let pageGrid: Grid;
	
	// Either -1 if not showing a known example,
	// or an integer in the range [0, EXAMPLE_PUZZLES.length).
	let currentExampleIndex: number = -1;
	
	type Move = [number,number];
	
	
	function initialize(): void {
		pageGrid = new Grid();
		const tbodyElem = document.querySelector("#game-board tbody") as HTMLElement;
		clearChildren(tbodyElem);
		
		// Create header row's cells
		let tr: HTMLElement = tbodyElem.appendChild(createElement("tr", createElement("td")));
		for (let x = 0; x < Grid.WIDTH; x++)
			tr.append(createElement("td", formatXCoordinate(x)));
		
		// Create remaining rows' cells
		const numColors = Grid.TILE_COLORS.length;
		for (let y = Grid.HEIGHT - 1; y >= 0; y--) {
			let tr: HTMLElement = tbodyElem.appendChild(createElement("tr", createElement("td", y.toString())));
			for (let x = 0; x < Grid.WIDTH; x++) {
				let td: HTMLElement = tr.appendChild(createElement("td"));
				// Set event handlers
				td.onmousedown = (ev: MouseEvent) => {
					let inc = 0;
					if (ev.button == 0)
						inc = 1;
					else if (ev.button == 2)
						inc = -1;
					pageGrid.set(x, y, (pageGrid.get(x, y) + inc + numColors) % numColors);
					handleBoardChanged();
				};
				td.oncontextmenu = td.onselectstart = (() => false);
			}
		}
		handleBoardChanged();
	}
	
	
	export function doSolve(): void {
		clearSolution();
		const numMoves: number = parseInt(inputElemId("num-moves").value, 10);
		const [moves, numVisited] = new Board(pageGrid.clone()).solve(numMoves);
		
		let solnHeadText: string;
		if (moves === null)
			solnHeadText = "No solution";
		else if (moves.length == 0)
			solnHeadText = "Solution: Self-clearing";
		else {
			solnHeadText = "Solution:";
			let solnStepsElem = elemId("solution-steps");
			for (const [x, y] of moves) {
				solnStepsElem.append(createElement("li",
					formatXCoordinate(x) + y + "-" + formatXCoordinate(x + 1) + y));
			}
		}
		elemId("solution-text" ).textContent = solnHeadText;
		elemId("boards-visited").textContent = "Boards visited: " + numVisited;
	}
	
	
	export function doImport(): void {
		const lines: Array<string> = inputElemId("import-export").value.replace(/^\s+|\s+$/, "").split("\n");
		if (lines.length != Grid.HEIGHT + 1) {
			alert(`Invalid number of lines (should be ${Grid.HEIGHT + 1})`);
			return;
		}
		const moves: number = parseInt(lines[0], 10);
		if (!/^\d+$/.test(lines[0]) || moves < 0 || moves > 100) {
			alert("Invalid number of moves");
			return;
		}
		
		for (let y = 0; y < Grid.HEIGHT; y++) {
			const line: string = lines[Grid.HEIGHT - y];
			if (line.length != Grid.WIDTH) {
				alert(`Invalid line length (should be ${Grid.WIDTH})`);
				return;
			}
			for (let x = 0; x < Grid.WIDTH; x++) {
				const c: string = line.charAt(x);
				const d: number = line.charCodeAt(x) - "a".charCodeAt(0) + 1;
				if (c == ".")
					pageGrid.set(x, y, 0);
				else if (1 <= d && d < Grid.TILE_COLORS.length)
					pageGrid.set(x, y, d);
				else {
					alert(`Invalid tile character: '${c}'`);
					return;
				}
			}
		}
		inputElemId("num-moves").value = moves.toString();
		handleBoardChanged();
	}
	
	
	export function doExample(): void {
		let index: number;
		do index = Math.floor(Math.random() * EXAMPLE_PUZZLES.length);
		while (index == currentExampleIndex);
		inputElemId("import-export").value = EXAMPLE_PUZZLES[index];
		doImport();
		currentExampleIndex = index;
	}
	
	const EXAMPLE_PUZZLES: Array<string> = [
		// All examples are from Pokémon Puzzle League (Nintendo 64) - Puzzle University - Class 2
		"3\n......\n......\n......\n......\n......\n...c..\n.c.c..\n.c.b..\n.b.b..\n.b.c..\n.c.b..\n.c.c..",  // Stage 01
		"3\n......\n......\n......\n......\n......\n......\n......\n......\n......\n..cf..\n..fcc.\n..cfc.",  // Stage 02
		"2\n......\n......\n......\n......\n..bb..\n..ae..\n..ae..\n..bb..\n..ea..\n..ea..\nbbaebb\nbbeabb",  // Stage 03
		"3\n......\n......\n......\n......\n......\n......\n......\n......\n...a..\n...b..\n...aba\n..bbab",  // Stage 04
		"4\n......\n......\n......\n......\n......\n......\n......\n......\n......\n..de..\n..ed..\ndedede",  // Stage 05
		"3\n......\n......\n......\n......\n...a..\n...f..\n...a..\n...b..\n...a..\n...b..\n...f..\n..fb..",  // Stage 06
		"2\n......\n......\n......\n......\n......\n......\n......\n..add.\n..ebe.\n..daa.\n..edde\nb.beed",  // Stage 07
		"3\n......\n......\n......\n......\n......\n......\n......\n......\n...c..\n...dcc\n..dcdd\n..dccd",  // Stage 08
		"2\n......\n......\n......\n......\n......\n......\n...a..\n...f..\n...c..\n...c..\n..fa.a\n.ccfcf",  // Stage 09
		"3\n......\n......\n......\n......\n......\n......\n......\n......\n...e..\n.e.d..\n.ded..\n.deede",  // Stage 10
		"3\n......\n......\n......\n......\n......\n......\n......\n......\n...a..\n...fa.\n...bb.\n.bffa.",  // Stage 11
		"3\n......\n......\n......\n......\n......\n......\n......\n......\n......\n..ada.\n..cdc.\n..acd.",  // Stage 12
		"3\n......\n......\n......\n......\n...d..\n...b..\n...d..\n...a..\n...ab.\n...ff.\n...fb.\n...ad.",  // Stage 13
		"2\n......\n......\n......\n......\n......\n......\n......\n..a...\n.ab...\n.ba...\n.bbab.\naabaa.",  // Stage 14
		"3\n......\n......\n......\n......\n......\n......\n......\n......\n..aff.\n..faf.\n..bfb.\n..afb.",  // Stage 15
		"3\n......\n......\n......\n......\n......\n......\n......\n......\n..b...\n.ff...\n.bff..\n.fbb..",  // Stage 16
		"2\n......\n......\n......\n......\n......\n.f....\n.a....\n.a....\n.f.a..\n.f.faa\n.a.aff\n.a.faa",  // Stage 17
		"2\n......\n......\n......\n......\n......\n..ed..\n..ed..\n..de..\n..ed..\n..de..\n..ed..\nddedee",  // Stage 18
		"4\n......\n......\n......\n......\n......\n......\n...c..\n...a..\n...c..\n...c..\n..aa..\n..cc..",  // Stage 19
		"3\n......\n......\n......\n......\n......\n......\n..a...\n..d...\n..fd..\n.afad.\nadadfd\nfafafa",  // Stage 20
		"2\n......\n......\n......\n......\n......\n...b..\n...d..\n...d..\n...b..\n...d..\n.ddbb.\n.bbdbb",  // Stage 21
		"2\n......\n......\n......\n......\n......\n......\n......\n......\n......\n.ccf..\n.ffcc.\nfccff.",  // Stage 22
		"3\n......\n......\n......\n......\n......\n...c..\n...c..\n...d..\n...a..\n...ac.\n..ccdd\n..cacc",  // Stage 23
		"4\n......\n......\n......\n......\n......\n......\n......\n......\n..b...\n..e...\n.ebeb.\n.bebe.",  // Stage 24
		"2\n......\n......\n......\n......\n......\n......\n......\n..a.ee\n..faff\n.aeeba\nffbbab\nbbffba",  // Stage 25
		"3\n......\n......\n......\n......\n......\n......\n......\n.c....\n.d....\n.bab..\n.cdaa.\n.dccb.",  // Stage 26
		"4\n......\n......\n......\n......\n......\n......\n......\n..ad..\n..bb..\n..ad..\n..bd..\n.ada..",  // Stage 27
		"3\n......\n......\n......\n......\n......\n......\n......\n..d...\n..be..\n..bbc.\n..edd.\n..ecc.",  // Stage 28
		"3\n......\n......\n......\n......\n......\n......\n......\n.cee..\n.bff..\n.fbf..\n.ccb..\n.eff..",  // Stage 29
		"2\n......\n......\n......\n......\n......\n......\n...c..\n..cb..\n..ba..\n..bbc.\n..abb.\n..bab.",  // Stage 30
	];
	
	
	export function doClear(): void {
		for (let y = 0; y < Grid.HEIGHT; y++) {
			for (let x = 0; x < Grid.WIDTH; x++)
				pageGrid.set(x, y, 0);
		}
		handleBoardChanged();
	}
	
	
	export function handleBoardChanged(): void {
		// Update colors on all cells
		const tbodyElem = document.querySelector("#game-board tbody") as HTMLElement;
		let trs: NodeListOf<HTMLElement> = tbodyElem.querySelectorAll("tr");
		for (let y = 0; y < Grid.HEIGHT; y++) {
			let tds: NodeListOf<HTMLElement> = trs[trs.length - 1 - y].querySelectorAll("td");
			for (let x = 0; x < Grid.WIDTH; x++)
				tds[x + 1].style.backgroundColor = Grid.TILE_COLORS[pageGrid.get(x, y)];
		}
		
		// Update export text
		let exportStr: string = inputElemId("num-moves").value;
		for (let y = 0; y < Grid.HEIGHT; y++) {
			exportStr += "\n";
			for (let x = 0; x < Grid.WIDTH; x++) {
				const val = pageGrid.get(x, Grid.HEIGHT - 1 - y);
				if (val == 0)
					exportStr += ".";
				else
					exportStr += String.fromCharCode("a".charCodeAt(0) + val - 1);
			}
		}
		inputElemId("import-export").value = exportStr;
		
		clearSolution();
		currentExampleIndex = -1;
	}
	
	
	// Examples: 0 -> A, 1 -> B, ..., 25 -> Z,
	// 26 -> AA, 27 -> AB, ..., 51 -> AZ,
	// 52 -> BA, ..., 701 -> ZZ.
	function formatXCoordinate(x: number): string {
		const START = "A".charCodeAt(0);
		if (0 <= x && x < 26)
			return String.fromCharCode(START + x);
		else if (26 <= x && x < 702)
			return String.fromCharCode(START + Math.floor((x - 26) / 26)) + String.fromCharCode(START + (x - 26) % 26);
		else
			throw new RangeError("Invalid value");
	}
	
	
	function clearSolution(): void {
		elemId("solution-text").textContent = "";
		clearChildren(elemId("solution-steps"));
		elemId("boards-visited").textContent = "";
	}
	
	
	function createElement(tagName: string, content?: string|HTMLElement): HTMLElement {
		let result: HTMLElement = document.createElement(tagName);
		if (content !== undefined) {
			if (typeof content == "string")
				result.textContent = content;
			else
				result.append(content);
		}
		return result;
	}
	
	
	function elemId(id: string): HTMLElement {
		return document.getElementById(id) as HTMLElement;
	}
	
	
	function inputElemId(id: string): HTMLInputElement {
		return elemId(id) as HTMLInputElement;
	}
	
	
	function clearChildren(elem: HTMLElement): void {
		while (elem.firstChild !== null)
			elem.removeChild(elem.firstChild);
	}
	
	
	
	/*---- Puzzle solver, board, grid ----*/
	
	// An immutable puzzle board, with high-level methods to generate/apply/solve game moves.
	class Board {
		
		public constructor(private grid: Grid) {
			// Apply game rules to the grid
			do this.dropTiles();
			while (this.matchAndClear());
		}
		
		
		// Used by constructor.
		private dropTiles(): boolean {
			let changed: boolean = false;
			for (let x = 0; x < Grid.WIDTH; x++) {
				for (let yRead = 0, yWrite = 0; yRead < Grid.HEIGHT; yRead++) {
					if (this.grid.get(x, yRead) != Grid.EMPTY_TILE) {
						if (yRead > yWrite) {
							this.grid.set(x, yWrite, this.grid.get(x, yRead));
							this.grid.set(x, yRead, Grid.EMPTY_TILE);
							changed = true;
						}
						yWrite++;
					}
				}
			}
			return changed;
		}
		
		
		// Used by constructor.
		private matchAndClear(): boolean {
			let toClear = new Grid();  // Conceptually Boolean
			
			// Find horizontal matches
			for (let y = 0; y < Grid.HEIGHT; y++) {
				for (let x = 0; x < Grid.WIDTH; ) {
					const run = this.getRunLength(x, y, 1, 0);
					if (run >= Board.MINIMUM_RUN) {
						for (let i = 0; i < run; i++)
							toClear.set(x + i, y, 1);
					}
					x += run;
				}
			}
			
			// Find vertical matches
			for (let x = 0; x < Grid.WIDTH; x++) {
				for (let y = 0; y < Grid.HEIGHT; ) {
					const run = this.getRunLength(x, y, 0, 1);
					if (run >= Board.MINIMUM_RUN) {
						for (let i = 0; i < run; i++)
							toClear.set(x, y + i, 1);
					}
					y += run;
				}
			}
			
			// Clear tiles
			let cleared: boolean = false;
			for (let y = 0; y < Grid.HEIGHT; y++) {
				for (let x = 0; x < Grid.WIDTH; x++) {
					if (toClear.get(x, y) == 1) {
						this.grid.set(x, y, Grid.EMPTY_TILE);
						cleared = true;
					}
				}
			}
			return cleared;
		}
		
		
		// Used by constructor.
		private getRunLength(x: number, y: number, dx: number, dy: number): number {
			if (dx < 0 || dy < 0 || dx == 0 && dy == 0)
				throw new RangeError("Invalid value");
			const val: number = this.grid.get(x, y);
			if (val == Grid.EMPTY_TILE)
				return 1;
			let count: number = 0;
			while (x < Grid.WIDTH && y < Grid.HEIGHT && this.grid.get(x, y) == val) {
				count++;
				x += dx;
				y += dy;
			}
			return count;
		}
		
		
		public isClear(): boolean {
			for (let y = 0; y < Grid.HEIGHT; y++) {
				for (let x = 0; x < Grid.WIDTH; x++) {
					if (this.grid.get(x, y) != Grid.EMPTY_TILE)
						return false;
				}
			}
			return true;
		}
		
		
		public getMoves(): Array<Move> {
			let result: Array<Move> = [];
			for (let y = 0; y < Grid.HEIGHT; y++) {
				for (let x = 0; x < Grid.WIDTH - 1; x++) {
					if (this.grid.get(x, y) != this.grid.get(x + 1, y))
						result.push([x, y]);
				}
			}
			return result;
		}
		
		
		public applyMove(x: number, y: number): Board {
			let newGrid: Grid = this.grid.clone();
			newGrid.set(x + 0, y, this.grid.get(x + 1, y));
			newGrid.set(x + 1, y, this.grid.get(x + 0, y));
			return new Board(newGrid);
		}
		
		
		public solve(numMoves: number): [Array<Move>|null,number] {
			interface Info {
				depth: number;
				prevBoard: Board|null;
				prevMove: Move|null;
			}
			
			// Do breadth-first search until solution found or tree exhausted
			let queue: Array<Board> = [this];
			let visited = new Map<string,Info>();
			visited.set(this.toString(), {depth:0, prevBoard:null, prevMove:[-1,-1]});
			let endState: Board|null = null;
			while (queue.length > 0) {
				// Dequeue next state
				const state = queue.shift();
				if (state === undefined)
					throw new Error("Assertion error");
				if (state.isClear()) {
					endState = state;
					break;
				}
				
				// Get info about state
				const info = visited.get(state.toString());
				if (info === undefined)
					throw new Error("Assertion error");
				if (info.depth >= numMoves)
					continue;
				for (const move of state.getMoves()) {
					const newState: Board = state.applyMove(move[0], move[1]);
					if (!visited.has(newState.toString())) {
						queue.push(newState);
						visited.set(newState.toString(), {depth:info.depth+1, prevBoard:state, prevMove:move});
					}
				}
			}
			
			if (endState === null)  // No solution
				return [null, visited.size];
			// Retrieve previous board states
			let result: Array<Move> = [];
			for (let state = endState; ; ) {
				const info = visited.get(state.toString());
				if (info === undefined)
					throw new Error("Assertion error");
				if (info.prevBoard === null)
					break;
				const prevMove = info.prevMove;
				if (prevMove === null)
					throw new Error("Assertion error");
				result.push(prevMove);
				state = info.prevBoard;
			}
			return [result.reverse(), visited.size];
		}
		
		
		public toString(): string {
			return this.grid.toString();
		}
		
		
		public static readonly MINIMUM_RUN: number = 3;
		
	}
	
	
	
	// A mutable 2D grid of numbers. This low-level data structure has no game rules.
	class Grid {
		
		private data: Array<number>;
		
		
		public constructor(data?: Array<number>) {
			const len = Grid.WIDTH * Grid.HEIGHT;
			if (data === undefined) {
				data = [];
				for (let i = 0; i < len; i++)
					data.push(0);
			} else if (data.length != len)
				throw new RangeError("Invalid array");
			this.data = data;
		}
		
		
		public get(x: number, y: number): number {
			if (x < 0 || x >= Grid.WIDTH || y < 0 || y >= Grid.HEIGHT)
				throw new RangeError("Index out of bounds");
			return this.data[y * Grid.WIDTH + x];
		}
		
		
		public set(x: number, y: number, val: number): void {
			if (x < 0 || x >= Grid.WIDTH || y < 0 || y >= Grid.HEIGHT)
				throw new RangeError("Index out of bounds");
			this.data[y * Grid.WIDTH + x] = val;
		}
		
		
		public clone(): Grid {
			return new Grid(this.data.slice());
		}
		
		
		public toString(): string {
			return this.data.toString();
		}
		
		
		public static readonly WIDTH : number =  6;
		public static readonly HEIGHT: number = 12;
		
		public static readonly TILE_COLORS: Array<string> = [
			"#000000", "#F01000", "#FFE000", "#00C000", "#40FFFF", "#0020F0", "#C000FF"];
		public static readonly EMPTY_TILE: number = 0;
		
	}
	
	
	
	// Global initialization
	initialize();
	
}
