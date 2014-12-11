/* 
 * Panel de Pon puzzle solver (JavaScript)
 * 
 * Copyright (c) 2014 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * http://www.nayuki.io/page/panel-de-pon-puzzle-solver-javascript
 */

"use strict";


/* User interface */

var BOARD_WIDTH = 6;
var BOARD_HEIGHT = 12;

// The 0th index is considered a blank tile. Also, this array controls how many possible tile values exist.
var TILE_COLORS = ["#000000", "#F01000", "#FFE000", "#00C000", "#40FFFF", "#0020F0", "#C000FF"];

var pageBoard = new Board(null, BOARD_WIDTH, BOARD_HEIGHT, null, null, 0);
var tbodyElem = document.getElementById("gameboard").getElementsByTagName("tbody")[0];
var currentExample = -1;


function initHtmlBoard() {
	removeChildren(tbodyElem);
	
	// Header row
	var row = document.createElement("tr");
	row.appendChild(document.createElement("td"));
	for (var x = 0; x < pageBoard.width; x++) {
		var cell = document.createElement("td");
		cell.appendChild(document.createTextNode(formatXCoordinate(x)));
		row.appendChild(cell);
	}
	tbodyElem.appendChild(row);
	
	// Remaining rows
	for (var y = pageBoard.height - 1; y >= 0; y--) {
		row = document.createElement("tr");
		var cell = document.createElement("td");
		cell.appendChild(document.createTextNode(y));
		row.appendChild(cell);
		
		for (var x = 0; x < pageBoard.width; x++) {
			cell = document.createElement("td");
			cell.onmousedown = (function(x, y) {
				return function(ev) {
					var inc = 0;
					if (ev.button == 0)
						inc = 1;
					else if (ev.button == 2)
						inc = -1;
					pageBoard.grid[y*pageBoard.width + x] = (pageBoard.grid[y*pageBoard.width + x] + inc + TILE_COLORS.length) % TILE_COLORS.length;
					handleBoardChanged(x, y);
				};
			})(x, y);
			cell.oncontextmenu = function() { return false; };
			row.appendChild(cell);
		}
		tbodyElem.appendChild(row);
	}
	handleBoardChanged();
}


function doSolve() {
	clearSolution();
	var solnTextElem = document.getElementById("solutiontext");
	var solnStepsElem = document.getElementById("solutionsteps");
	var boardsVisitedElem = document.getElementById("boardsvisited");
	
	var board = new Board(pageBoard.grid.slice(0), pageBoard.width, pageBoard.height, null, null, 0);
	var solution = board.solve(parseInt(document.getElementById("nummoves").value, 10));
	if (solution[0] != null) {
		if (solution[0].length == 0)
			solnTextElem.appendChild(document.createTextNode("Solution: Self-clearing"));
		else {
			solnTextElem.appendChild(document.createTextNode("Solution:"));
			for (var i = 0; i < solution[0].length; i++) {
				var li = document.createElement("li");
				var x = solution[0][i][0];
				var y = solution[0][i][1];
				li.appendChild(document.createTextNode(formatXCoordinate(x) + y + "-" + formatXCoordinate(x + 1) + y));
				solnStepsElem.appendChild(li);
			}
		}
	} else
		solnTextElem.appendChild(document.createTextNode("No solution"));
	boardsVisitedElem.appendChild(document.createTextNode("Boards visited: " + solution[1]));
}


function doImport() {
	var lines = document.getElementById("importexportbox").value.replace(/\s+$/, "").split("\n");
	if (lines.length != pageBoard.height + 1) {
		alert("Invalid number of lines (should be " + (pageBoard.height + 1) + ")");
		return;
	}
	
	var moves = parseInt(lines[0], 10);
	if (!/\d+/.test(lines[0]) || moves < 0 || moves > 100) {
		alert("Invalid number of moves");
		return;
	}
	
	var newGrid = [];
	for (var y = pageBoard.height; y >= 1; y--) {
		if (lines[y].length != pageBoard.width) {
			alert("Invalid line length (should be " + pageBoard.width + ")");
			return;
		}
		for (var x = 0; x < pageBoard.width; x++) {
			var c = lines[y].charCodeAt(x);
			if (c == ".".charCodeAt(0))
				newGrid.push(0);
			else if (c >= "a".charCodeAt(0) && c - "a".charCodeAt(0) < TILE_COLORS.length - 1)
				newGrid.push(c - "a".charCodeAt(0) + 1);
			else {
				alert("Invalid tile character: '" + lines[y].charAt(x) + "'")
				return;
			}
		}
	}
	document.getElementById("nummoves").value = moves.toString();
	pageBoard.grid = newGrid;
	handleBoardChanged();
}


function doExample() {
	var index;
	do index = Math.floor(Math.random() * EXAMPLE_PUZZLES.length);
	while (index == currentExample);
	document.getElementById("importexportbox").value = EXAMPLE_PUZZLES[index];
	doImport();
	currentExample = index;
}

var EXAMPLE_PUZZLES = [
	"3\n......\n......\n......\n......\n......\n...c..\n.c.c..\n.c.b..\n.b.b..\n.b.c..\n.c.b..\n.c.c..",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 01
	"3\n......\n......\n......\n......\n......\n......\n......\n......\n......\n..cf..\n..fcc.\n..cfc.",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 02
	"2\n......\n......\n......\n......\n..bb..\n..ae..\n..ae..\n..bb..\n..ea..\n..ea..\nbbaebb\nbbeabb",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 03
	"3\n......\n......\n......\n......\n......\n......\n......\n......\n...a..\n...b..\n...aba\n..bbab",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 04
	"4\n......\n......\n......\n......\n......\n......\n......\n......\n......\n..de..\n..ed..\ndedede",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 05
	"3\n......\n......\n......\n......\n...a..\n...f..\n...a..\n...b..\n...a..\n...b..\n...f..\n..fb..",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 06
	"2\n......\n......\n......\n......\n......\n......\n......\n..add.\n..ebe.\n..daa.\n..edde\nb.beed",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 07
	"3\n......\n......\n......\n......\n......\n......\n......\n......\n...c..\n...dcc\n..dcdd\n..dccd",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 08
	"2\n......\n......\n......\n......\n......\n......\n...a..\n...f..\n...c..\n...c..\n..fa.a\n.ccfcf",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 09
	"3\n......\n......\n......\n......\n......\n......\n......\n......\n...e..\n.e.d..\n.ded..\n.deede",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 10
	"3\n......\n......\n......\n......\n......\n......\n......\n......\n...a..\n...fa.\n...bb.\n.bffa.",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 11
	"3\n......\n......\n......\n......\n......\n......\n......\n......\n......\n..ada.\n..cdc.\n..acd.",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 12
	"3\n......\n......\n......\n......\n...d..\n...b..\n...d..\n...a..\n...ab.\n...ff.\n...fb.\n...ad.",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 13
	"2\n......\n......\n......\n......\n......\n......\n......\n..a...\n.ab...\n.ba...\n.bbab.\naabaa.",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 14
	"3\n......\n......\n......\n......\n......\n......\n......\n......\n..aff.\n..faf.\n..bfb.\n..afb.",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 15
	"3\n......\n......\n......\n......\n......\n......\n......\n......\n..b...\n.ff...\n.bff..\n.fbb..",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 16
	"2\n......\n......\n......\n......\n......\n.f....\n.a....\n.a....\n.f.a..\n.f.faa\n.a.aff\n.a.faa",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 17
	"2\n......\n......\n......\n......\n......\n..ed..\n..ed..\n..de..\n..ed..\n..de..\n..ed..\nddedee",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 18
	"4\n......\n......\n......\n......\n......\n......\n...c..\n...a..\n...c..\n...c..\n..aa..\n..cc..",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 19
	"3\n......\n......\n......\n......\n......\n......\n..a...\n..d...\n..fd..\n.afad.\nadadfd\nfafafa",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 20
	"2\n......\n......\n......\n......\n......\n...b..\n...d..\n...d..\n...b..\n...d..\n.ddbb.\n.bbdbb",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 21
	"2\n......\n......\n......\n......\n......\n......\n......\n......\n......\n.ccf..\n.ffcc.\nfccff.",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 22
	"3\n......\n......\n......\n......\n......\n...c..\n...c..\n...d..\n...a..\n...ac.\n..ccdd\n..cacc",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 23
	"4\n......\n......\n......\n......\n......\n......\n......\n......\n..b...\n..e...\n.ebeb.\n.bebe.",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 24
	"2\n......\n......\n......\n......\n......\n......\n......\n..a.ee\n..faff\n.aeeba\nffbbab\nbbffba",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 25
	"3\n......\n......\n......\n......\n......\n......\n......\n.c....\n.d....\n.bab..\n.cdaa.\n.dccb.",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 26
	"4\n......\n......\n......\n......\n......\n......\n......\n..ad..\n..bb..\n..ad..\n..bd..\n.ada..",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 27
	"3\n......\n......\n......\n......\n......\n......\n......\n..d...\n..be..\n..bbc.\n..edd.\n..ecc.",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 28
	"3\n......\n......\n......\n......\n......\n......\n......\n.cee..\n.bff..\n.fbf..\n.ccb..\n.eff..",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 29
	"2\n......\n......\n......\n......\n......\n......\n...c..\n..cb..\n..ba..\n..bbc.\n..abb.\n..bab.",  // Pokémon Puzzle League - Puzzle University - Class 2 - Stage 30
];


function doClear() {
	for (var i = 0; i < pageBoard.grid.length; i++)
		pageBoard.grid[i] = 0;
	handleBoardChanged();
}


function handleBoardChanged() {
	// Refresh board
	if (arguments.length == 0) {
		// Update colors on all cells
		for (var y = 0; y < pageBoard.height; y++) {
			var row = tbodyElem.children[pageBoard.height - y];
			for (var x = 0; x < pageBoard.width; x++)
				row.children[x + 1].style.backgroundColor = TILE_COLORS[pageBoard.grid[y * pageBoard.width + x]];
		}
	} else if (arguments.length == 2) {
		// Update color on single cell
		var x = arguments[0];
		var y = arguments[1];
		tbodyElem.children[pageBoard.height - y].children[x + 1].style.backgroundColor = TILE_COLORS[pageBoard.grid[y*pageBoard.width + x]];
	} else
		throw "Invalid arguments";
	
	// Update export text
	var exportStr = document.getElementById("nummoves").value;
	for (var y = 0; y < pageBoard.height; y++) {
		exportStr += "\n";
		for (var x = 0; x < pageBoard.width; x++) {
			var val = pageBoard.grid[(pageBoard.height-1-y)*pageBoard.width + x];
			if (val == 0)
				exportStr += ".";
			else
				exportStr += String.fromCharCode("a".charCodeAt(0) + val - 1);
		}
	}
	document.getElementById("importexportbox").value = exportStr;
	
	clearSolution();
	currentExample = -1;
}


function clearSolution() {
	removeChildren(document.getElementById("solutiontext"));
	removeChildren(document.getElementById("solutionsteps"));
	removeChildren(document.getElementById("boardsvisited"));
}


function formatXCoordinate(x) {
	var START = "A".charCodeAt(0);
	if (x < 26)
		return String.fromCharCode(START + x);
	else if (x < 702)
		return String.fromCharCode(START + Math.floor((x - 26) / 26)) + String.fromCharCode(START + (x - 26) % 26);
	else
		throw "Invalid value";
}


function removeChildren(elem) {
	while (elem.firstChild != null)
		elem.removeChild(elem.firstChild);
}


// Initialization
initHtmlBoard();


/* Puzzle board and solver */

function Board(grid, width, height, prevBoard, prevMove, depth) {
	var EMPTY = 0;
	var MINIMUM_RUN = 3;
	
	if (grid == null) {
		grid = [];
		for (var i = 0; i < width * height; i++)
			grid.push(0);
	}
	dropTiles();
	while (matchAndClear()) {
		if (!dropTiles())
			break;
	}
	this.width = width;
	this.height = height;
	this.grid = grid;
	this.prevBoard = prevBoard;
	this.prevMove = prevMove;
	this.depth = depth;
	var self = this;
	
	this.solve = function(moves) {
		var visited = new Object();
		visited[self] = true;
		var queue = [self];
		
		// Breadth-first search
		while (queue.length > 0) {
			var board = queue.shift();
			if (board.isEmpty()) {  // Solution found
				var solution = [];
				while (board.prevBoard != null) {
					solution.push(board.prevMove);
					board = board.prevBoard;
				}
				solution.reverse();
				return [solution, Object.keys(visited).length];
			}
			
			else if (board.depth < moves) {  // Enqueue neighbors
				var nextBoards = board.getNextBoards();
				for (var i = 0; i < nextBoards.length; i++) {
					var next = nextBoards[i];
					if (!(next in visited)) {
						queue.push(next);
						visited[next] = true;
					}
				}
			}
		}
		return [null, Object.keys(visited).length];
	}
	
	this.getNextBoards = function() {
		var result = [];
		for (var y = 0; y < height; y++) {
			for (var x = 0; x + 1 < width; x++) {
				var next = swap(x, y);
				if (next != null)
					result.push(next);
			}
		}
		return result;
	}
	
	function swap(x, y) {
		if (x < 0 || x + 1 >= width || y < 0 || y >= height)
			throw "Index out of bounds";
		if (grid[y*width + x + 0] == grid[y*width + x + 1])
			return null;
		
		var newGrid = grid.slice(0);  // Clone
		newGrid[y*width + x + 0] = grid[y*width + x + 1];
		newGrid[y*width + x + 1] = grid[y*width + x + 0];
		return new Board(newGrid, width, height, self, [x, y], depth + 1);
	}
	
	this.isEmpty = function() {
		for (var i = 0; i < grid.length; i++) {
			if (grid[i] != EMPTY)
				return false;
		}
		return true;
	}
	
	function dropTiles() {
		var changed = false;
		for (var y = 0; y < height; y++) {
			for (var x = 0; x < width; x++) {
				if (grid[y*width + x] == EMPTY)
					continue;
				for (var i = y; i - 1 >= 0 && grid[(i-1)*width + x] == EMPTY; i--) {
					grid[(i-1)*width + x] = grid[i*width + x];
					grid[i*width + x] = EMPTY;
					changed = true;
				}
			}
		}
		return changed;
	}
	
	function matchAndClear() {
		var toClear = [];
		for (var i = 0; i < grid.length; i++)
			toClear.push(false);
		
		// Find horizontal matches
		for (var y = 0; y < height; y++) {
			for (var x = 0; x < width - MINIMUM_RUN + 1; ) {
				var run = getRunLength(x, y, 1, 0);
				if (run >= MINIMUM_RUN) {
					for (var i = 0; i < run; i++)
						toClear[y*width + x + i] = true;
				}
				x += run;
			}
		}
		
		// Find vertical matches
		for (var x = 0; x < width; x++) {
			for (var y = 0; y < height - MINIMUM_RUN + 1; ) {
				var run = getRunLength(x, y, 0, 1);
				if (run >= MINIMUM_RUN) {
					for (var i = 0; i < run; i++)
						toClear[(y+i)*width + x] = true;
				}
				y += run;
			}
		}
		
		// Clear tiles
		var cleared = false;
		for (var y = 0; y < height; y++) {
			for (var x = 0; x < width; x++) {
				if (toClear[y*width + x]) {
					grid[y*width + x] = EMPTY;
					cleared = true;
				}
			}
		}
		return cleared;
	}
	
	function getRunLength(x, y, dx, dy) {  // Requires dx >= 0 && dy >= 0 && dx + dy > 0
		var val = grid[y*width + x];
		if (val == EMPTY)
			return 1;
		var count = 1;
		x += dx;
		y += dy;
		while (x < width && y < height && grid[y*width + x] == val) {
			count++;
			x += dx;
			y += dy;
		}
		return count;
	}
	
	this.toString = function() {
		var result = "";
		for (var i = 0; i < grid.length; i++)
			result += grid[i].toString();
		return result;
	}
}
