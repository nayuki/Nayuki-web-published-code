/* 
 * Panel de Pon puzzle solver (JavaScript)
 * 
 * Copyright (c) 2018 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/panel-de-pon-puzzle-solver-javascript
 */

"use strict";


/*---- Configurable constants ----*/

var WIDTH = 6;
var HEIGHT = 12;

// The 0th index is considered a blank tile. Also, this array controls how many possible tile values exist.
var TILE_COLORS = ["#000000", "#F01000", "#FFE000", "#00C000", "#40FFFF", "#0020F0", "#C000FF"];


/*---- User interface ----*/

var EMPTY = 0;  // Do not change this constant

var pageGrid = new Grid();
var tbodyElem = document.querySelector("#game-board tbody");

// Either -1 if not showing a known example,
// or an integer in the range [0, EXAMPLE_PUZZLES.length).
var currentExampleIndex = -1;


function initHtmlBoard() {
	clearChildren(tbodyElem);
	
	// Header row
	var row = createElement("tr", createElement("td"));
	for (var x = 0; x < WIDTH; x++)
		row.appendChild(createElement("td", formatXCoordinate(x)));
	tbodyElem.appendChild(row);
	
	// Remaining rows
	for (var y = HEIGHT - 1; y >= 0; y--) {
		var row = createElement("tr", createElement("td", y.toString()));
		for (var x = 0; x < WIDTH; x++) {
			var cell = createElement("td");
			cell.onmousedown = (function(x, y) {
				return function(ev) {
					var inc = 0;
					if (ev.button == 0)
						inc = 1;
					else if (ev.button == 2)
						inc = -1;
					pageGrid.set(x, y, (pageGrid.get(x, y) + inc + TILE_COLORS.length) % TILE_COLORS.length);
					handleBoardChanged();
				};
			})(x, y);
			cell.oncontextmenu = cell.onselectstart = function() { return false; };
			row.appendChild(cell);
		}
		tbodyElem.appendChild(row);
	}
	handleBoardChanged();
}


function doSolve() {
	clearSolution();
	var numMoves = parseInt(document.getElementById("num-moves").value, 10);
	var solution = solveBoard(numMoves, new Board(pageGrid.clone()));
	var moves = solution[0];
	var numVisited = solution[1];
	
	var solnHeadText;
	if (moves == null)
		solnHeadText = "No solution";
	else if (moves.length == 0)
		solnHeadText = "Solution: Self-clearing";
	else {
		solnHeadText = "Solution:";
		var solnStepsElem = document.getElementById("solution-steps");
		moves.forEach(function(move) {
			var x = move[0], y = move[1];
			solnStepsElem.appendChild(createElement("li",
				formatXCoordinate(x) + y + "-" + formatXCoordinate(x + 1) + y));
		});
	}
	document.getElementById("solution-text").textContent = solnHeadText;
	document.getElementById("boards-visited").textContent = "Boards visited: " + numVisited;
}


function doImport() {
	var lines = document.getElementById("import-export").value.replace(/^\s+|\s+$/, "").split("\n");
	if (lines.length != HEIGHT + 1) {
		alert("Invalid number of lines (should be " + (HEIGHT + 1) + ")");
		return;
	}
	
	var moves = parseInt(lines[0], 10);
	if (!/^\d+$/.test(lines[0]) || moves < 0 || moves > 100) {
		alert("Invalid number of moves");
		return;
	}
	
	for (var y = 0; y < HEIGHT; y++) {
		var line = lines[HEIGHT - y];
		if (line.length != WIDTH) {
			alert("Invalid line length (should be " + WIDTH + ")");
			return;
		}
		for (var x = 0; x < WIDTH; x++) {
			var c = line.charCodeAt(x);
			if (c == ".".charCodeAt(0))
				pageGrid.set(x, y, 0);
			else if (c >= "a".charCodeAt(0) && c - "a".charCodeAt(0) < TILE_COLORS.length - 1)
				pageGrid.set(x, y, c - "a".charCodeAt(0) + 1);
			else {
				alert("Invalid tile character: '" + line.charAt(x) + "'");
				return;
			}
		}
	}
	document.getElementById("num-moves").value = moves.toString();
	handleBoardChanged();
}


function doExample() {
	var index;
	do index = Math.floor(Math.random() * EXAMPLE_PUZZLES.length);
	while (index == currentExampleIndex);
	document.getElementById("import-export").value = EXAMPLE_PUZZLES[index];
	doImport();
	currentExampleIndex = index;
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
	for (var y = 0; y < HEIGHT; y++) {
		for (var x = 0; x < WIDTH; x++)
			pageGrid.set(x, y, 0);
	}
	handleBoardChanged();
}


function handleBoardChanged() {
	// Update colors on all cells
	var rows = tbodyElem.querySelectorAll("tr");
	for (var y = 0; y < HEIGHT; y++) {
		var cells = rows[rows.length - 1 - y].querySelectorAll("td");
		for (var x = 0; x < WIDTH; x++)
			cells[x + 1].style.backgroundColor = TILE_COLORS[pageGrid.get(x, y)];
	}
	
	// Update export text
	var exportStr = document.getElementById("num-moves").value;
	for (var y = 0; y < HEIGHT; y++) {
		exportStr += "\n";
		for (var x = 0; x < WIDTH; x++) {
			var val = pageGrid.get(x, HEIGHT - 1 - y);
			if (val == 0)
				exportStr += ".";
			else
				exportStr += String.fromCharCode("a".charCodeAt(0) + val - 1);
		}
	}
	document.getElementById("import-export").value = exportStr;
	
	clearSolution();
	currentExampleIndex = -1;
}


// Examples: 0 -> A, 1 -> B, ..., 25 -> Z,
// 26 -> AA, 27 -> AB, ..., 51 -> AZ,
// 52 -> BA, ..., 701 -> ZZ.
function formatXCoordinate(x) {
	var START = "A".charCodeAt(0);
	if (0 <= x && x < 26)
		return String.fromCharCode(START + x);
	else if (26 <= x && x < 702)
		return String.fromCharCode(START + Math.floor((x - 26) / 26)) + String.fromCharCode(START + (x - 26) % 26);
	else
		throw "Invalid value";
}


function clearSolution() {
	document.getElementById("solution-text").textContent = "";
	clearChildren(document.getElementById("solution-steps"));
	document.getElementById("boards-visited").textContent = "";
}


function createElement(tagName, content) {
	var result = document.createElement(tagName);
	if (content != undefined) {
		if (typeof content == "string")
			result.textContent = content;
		else
			result.appendChild(content);
	}
	return result;
}


function clearChildren(elem) {
	while (elem.firstChild != null)
		elem.removeChild(elem.firstChild);
}


// Initialization
initHtmlBoard();



/*---- Puzzle solver, board, grid ----*/

function solveBoard(numMoves, startState) {
	// Do breadth-first search
	var queue = [startState];
	var visited = {};
	visited[startState.toString()] = {depth:0, prevBoard:null, prevMove:[-1, -1]};
	var endState = null;
	while (queue.length > 0) {
		var state = queue.shift();
		if (state.isClear()) {
			endState = state;
			break;
		}
		var depth = visited[state.toString()].depth;
		if (depth >= numMoves)
			continue;
		state.getMoves().forEach(function(move) {
			var newState = state.applyMove(move[0], move[1]);
			if (!(newState.toString() in visited)) {
				visited[newState.toString()] = {depth:depth + 1, prevBoard:state, prevMove:move};
				queue.push(newState);
			}
		});
	}
	
	if (endState == null)
		return [null, Object.keys(visited).length];
	// Retrieve previous board states
	var result = [];
	var state = endState;
	while (true) {
		var info = visited[state.toString()];
		if (info.prevBoard == null)
			break;
		result.push(info.prevMove);
		state = info.prevBoard;
	}
	return [result.reverse(), Object.keys(visited).length];
}



function Board(grid) {  // Immutable class
	// Apply game rules to the grid
	do dropTiles();
	while (matchAndClear());
	
	
	function dropTiles() {
		var changed = false;
		for (var x = 0; x < WIDTH; x++) {
			for (var yRead = 0, yWrite = 0; yRead < HEIGHT; yRead++) {
				if (grid.get(x, yRead) != EMPTY) {
					if (yRead > yWrite) {
						grid.set(x, yWrite, grid.get(x, yRead));
						grid.set(x, yRead, EMPTY);
						changed = true;
					}
					yWrite++;
				}
			}
		}
		return changed;
	}
	
	
	function matchAndClear() {
		var toClear = new Grid();  // Conceptually Boolean
		
		// Find horizontal matches
		for (var y = 0; y < HEIGHT; y++) {
			for (var x = 0; x < WIDTH; ) {
				var run = getRunLength(x, y, 1, 0);
				if (run >= MINIMUM_RUN) {
					for (var i = 0; i < run; i++)
						toClear.set(x + i, y, 1);
				}
				x += run;
			}
		}
		
		// Find vertical matches
		for (var x = 0; x < WIDTH; x++) {
			for (var y = 0; y < HEIGHT; ) {
				var run = getRunLength(x, y, 0, 1);
				if (run >= MINIMUM_RUN) {
					for (var i = 0; i < run; i++)
						toClear.set(x, y + i, 1);
				}
				y += run;
			}
		}
		
		// Clear tiles
		var cleared = false;
		for (var y = 0; y < HEIGHT; y++) {
			for (var x = 0; x < WIDTH; x++) {
				if (toClear.get(x, y) == 1) {
					grid.set(x, y, EMPTY);
					cleared = true;
				}
			}
		}
		return cleared;
	}
	
	
	function getRunLength(x, y, dx, dy) {
		if (dx < 0 || dy < 0 || dx == 0 && dy == 0)
			throw "Invalid value";
		var val = grid.get(x, y);
		if (val == EMPTY)
			return 1;
		var count = 0;
		while (x < WIDTH && y < HEIGHT && grid.get(x, y) == val) {
			count++;
			x += dx;
			y += dy;
		}
		return count;
	}
	
	
	this.isClear = function() {
		for (var y = 0; y < HEIGHT; y++) {
			for (var x = 0; x < WIDTH; x++) {
				if (grid.get(x, y) != EMPTY)
					return false;
			}
		}
		return true;
	};
	
	
	this.getMoves = function() {
		var result = [];
		for (var y = 0; y < HEIGHT; y++) {
			for (var x = 0; x + 1 < WIDTH; x++) {
				if (grid.get(x, y) != grid.get(x + 1, y))
					result.push([x, y]);
			}
		}
		return result;
	};
	
	
	this.applyMove = function(x, y) {
		var newGrid = grid.clone();
		newGrid.set(x + 0, y, grid.get(x + 1, y));
		newGrid.set(x + 1, y, grid.get(x + 0, y));
		return new Board(newGrid);
	};
	
	
	this.toString = function() {
		return grid.toString();
	};
}

var MINIMUM_RUN = 3;



function Grid(data) {  // Mutable class
	if (data == undefined) {
		data = [];
		for (var i = 0; i < WIDTH * HEIGHT; i++)
			data.push(0);
	}
	
	this.get = function(x, y) {
		if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT)
			throw "Index out of bounds";
		return data[y * WIDTH + x];
	};
	
	this.set = function(x, y, val) {
		if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT)
			throw "Index out of bounds";
		data[y * WIDTH + x] = val;
	};
	
	this.clone = function() {
		return new Grid(data.slice());
	};
	
	this.toString = function() {
		return data.toString();
	};
}
