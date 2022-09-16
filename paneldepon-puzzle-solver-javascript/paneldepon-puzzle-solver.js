/*
 * Panel de Pon puzzle solver (compiled from TypeScript)
 *
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/panel-de-pon-puzzle-solver-javascript
 */
"use strict";
var app;
(function (app) {
    /*---- User interface ----*/
    let pageGrid;
    // Either -1 if not showing a known example,
    // or an integer in the range [0, EXAMPLE_PUZZLES.length).
    let currentExampleIndex = -1;
    function initialize() {
        pageGrid = new Grid();
        const tbodyElem = document.querySelector("#game-board tbody");
        tbodyElem.replaceChildren();
        // Create header row's cells
        let tr = tbodyElem.appendChild(createElement("tr", createElement("td")));
        for (let x = 0; x < Grid.WIDTH; x++)
            tr.append(createElement("td", formatXCoordinate(x)));
        // Create remaining rows' cells
        const numColors = Grid.TILE_COLORS.length;
        for (let y = Grid.HEIGHT - 1; y >= 0; y--) {
            let tr = tbodyElem.appendChild(createElement("tr", createElement("td", y.toString())));
            for (let x = 0; x < Grid.WIDTH; x++) {
                let td = tr.appendChild(createElement("td"));
                // Set event handlers
                td.onmousedown = (ev) => {
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
    function doSolve() {
        clearSolution();
        const numMoves = parseInt(inputElemId("num-moves").value, 10);
        const [moves, numVisited] = new Board(pageGrid.clone()).solve(numMoves);
        let solnHeadText;
        if (moves === null)
            solnHeadText = "No solution";
        else if (moves.length == 0)
            solnHeadText = "Solution: Self-clearing";
        else {
            solnHeadText = "Solution:";
            let solnStepsElem = elemId("solution-steps");
            for (const [x, y] of moves) {
                solnStepsElem.append(createElement("li", formatXCoordinate(x) + y + "-" + formatXCoordinate(x + 1) + y));
            }
        }
        elemId("solution-text").textContent = solnHeadText;
        elemId("boards-visited").textContent = "Boards visited: " + numVisited;
    }
    app.doSolve = doSolve;
    function doImport() {
        const lines = inputElemId("import-export").value.replace(/^\s+|\s+$/, "").split("\n");
        if (lines.length != Grid.HEIGHT + 1) {
            alert(`Invalid number of lines (should be ${Grid.HEIGHT + 1})`);
            return;
        }
        const moves = parseInt(lines[0], 10);
        if (!/^\d+$/.test(lines[0]) || moves < 0 || moves > 100) {
            alert("Invalid number of moves");
            return;
        }
        for (let y = 0; y < Grid.HEIGHT; y++) {
            const line = lines[Grid.HEIGHT - y];
            if (line.length != Grid.WIDTH) {
                alert(`Invalid line length (should be ${Grid.WIDTH})`);
                return;
            }
            for (let x = 0; x < Grid.WIDTH; x++) {
                const c = line.charAt(x);
                const d = line.charCodeAt(x) - "a".charCodeAt(0) + 1;
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
    app.doImport = doImport;
    function doExample() {
        let index;
        do
            index = Math.floor(Math.random() * EXAMPLE_PUZZLES.length);
        while (index == currentExampleIndex);
        inputElemId("import-export").value = EXAMPLE_PUZZLES[index];
        doImport();
        currentExampleIndex = index;
    }
    app.doExample = doExample;
    const EXAMPLE_PUZZLES = [
        // All examples are from Pokémon Puzzle League (Nintendo 64) - Puzzle University - Class 2
        "3\n......\n......\n......\n......\n......\n...c..\n.c.c..\n.c.b..\n.b.b..\n.b.c..\n.c.b..\n.c.c..",
        "3\n......\n......\n......\n......\n......\n......\n......\n......\n......\n..cf..\n..fcc.\n..cfc.",
        "2\n......\n......\n......\n......\n..bb..\n..ae..\n..ae..\n..bb..\n..ea..\n..ea..\nbbaebb\nbbeabb",
        "3\n......\n......\n......\n......\n......\n......\n......\n......\n...a..\n...b..\n...aba\n..bbab",
        "4\n......\n......\n......\n......\n......\n......\n......\n......\n......\n..de..\n..ed..\ndedede",
        "3\n......\n......\n......\n......\n...a..\n...f..\n...a..\n...b..\n...a..\n...b..\n...f..\n..fb..",
        "2\n......\n......\n......\n......\n......\n......\n......\n..add.\n..ebe.\n..daa.\n..edde\nb.beed",
        "3\n......\n......\n......\n......\n......\n......\n......\n......\n...c..\n...dcc\n..dcdd\n..dccd",
        "2\n......\n......\n......\n......\n......\n......\n...a..\n...f..\n...c..\n...c..\n..fa.a\n.ccfcf",
        "3\n......\n......\n......\n......\n......\n......\n......\n......\n...e..\n.e.d..\n.ded..\n.deede",
        "3\n......\n......\n......\n......\n......\n......\n......\n......\n...a..\n...fa.\n...bb.\n.bffa.",
        "3\n......\n......\n......\n......\n......\n......\n......\n......\n......\n..ada.\n..cdc.\n..acd.",
        "3\n......\n......\n......\n......\n...d..\n...b..\n...d..\n...a..\n...ab.\n...ff.\n...fb.\n...ad.",
        "2\n......\n......\n......\n......\n......\n......\n......\n..a...\n.ab...\n.ba...\n.bbab.\naabaa.",
        "3\n......\n......\n......\n......\n......\n......\n......\n......\n..aff.\n..faf.\n..bfb.\n..afb.",
        "3\n......\n......\n......\n......\n......\n......\n......\n......\n..b...\n.ff...\n.bff..\n.fbb..",
        "2\n......\n......\n......\n......\n......\n.f....\n.a....\n.a....\n.f.a..\n.f.faa\n.a.aff\n.a.faa",
        "2\n......\n......\n......\n......\n......\n..ed..\n..ed..\n..de..\n..ed..\n..de..\n..ed..\nddedee",
        "4\n......\n......\n......\n......\n......\n......\n...c..\n...a..\n...c..\n...c..\n..aa..\n..cc..",
        "3\n......\n......\n......\n......\n......\n......\n..a...\n..d...\n..fd..\n.afad.\nadadfd\nfafafa",
        "2\n......\n......\n......\n......\n......\n...b..\n...d..\n...d..\n...b..\n...d..\n.ddbb.\n.bbdbb",
        "2\n......\n......\n......\n......\n......\n......\n......\n......\n......\n.ccf..\n.ffcc.\nfccff.",
        "3\n......\n......\n......\n......\n......\n...c..\n...c..\n...d..\n...a..\n...ac.\n..ccdd\n..cacc",
        "4\n......\n......\n......\n......\n......\n......\n......\n......\n..b...\n..e...\n.ebeb.\n.bebe.",
        "2\n......\n......\n......\n......\n......\n......\n......\n..a.ee\n..faff\n.aeeba\nffbbab\nbbffba",
        "3\n......\n......\n......\n......\n......\n......\n......\n.c....\n.d....\n.bab..\n.cdaa.\n.dccb.",
        "4\n......\n......\n......\n......\n......\n......\n......\n..ad..\n..bb..\n..ad..\n..bd..\n.ada..",
        "3\n......\n......\n......\n......\n......\n......\n......\n..d...\n..be..\n..bbc.\n..edd.\n..ecc.",
        "3\n......\n......\n......\n......\n......\n......\n......\n.cee..\n.bff..\n.fbf..\n.ccb..\n.eff..",
        "2\n......\n......\n......\n......\n......\n......\n...c..\n..cb..\n..ba..\n..bbc.\n..abb.\n..bab.", // Stage 30
    ];
    function doClear() {
        for (let y = 0; y < Grid.HEIGHT; y++) {
            for (let x = 0; x < Grid.WIDTH; x++)
                pageGrid.set(x, y, 0);
        }
        handleBoardChanged();
    }
    app.doClear = doClear;
    function handleBoardChanged() {
        // Update colors on all cells
        const tbodyElem = document.querySelector("#game-board tbody");
        let trs = tbodyElem.querySelectorAll("tr");
        for (let y = 0; y < Grid.HEIGHT; y++) {
            let tds = trs[trs.length - 1 - y].querySelectorAll("td");
            for (let x = 0; x < Grid.WIDTH; x++)
                tds[x + 1].style.backgroundColor = Grid.TILE_COLORS[pageGrid.get(x, y)];
        }
        // Update export text
        let exportStr = inputElemId("num-moves").value;
        for (let y = 0; y < Grid.HEIGHT; y++) {
            exportStr += "\n";
            for (let x = 0; x < Grid.WIDTH; x++) {
                const val = pageGrid.get(x, Grid.HEIGHT - 1 - y);
                if (val == 0)
                    exportStr += ".";
                else
                    exportStr += String.fromCodePoint("a".charCodeAt(0) + val - 1);
            }
        }
        inputElemId("import-export").value = exportStr;
        clearSolution();
        currentExampleIndex = -1;
    }
    app.handleBoardChanged = handleBoardChanged;
    // Examples: 0 -> A, 1 -> B, ..., 25 -> Z,
    // 26 -> AA, 27 -> AB, ..., 51 -> AZ,
    // 52 -> BA, ..., 701 -> ZZ.
    function formatXCoordinate(x) {
        const START = "A".charCodeAt(0);
        if (0 <= x && x < 26)
            return String.fromCodePoint(START + x);
        else if (26 <= x && x < 702)
            return String.fromCodePoint(START + Math.floor((x - 26) / 26)) + String.fromCodePoint(START + (x - 26) % 26);
        else
            throw new RangeError("Invalid value");
    }
    function clearSolution() {
        elemId("solution-text").textContent = "";
        elemId("solution-steps").replaceChildren();
        elemId("boards-visited").textContent = "";
    }
    function createElement(tagName, content) {
        let result = document.createElement(tagName);
        if (content !== undefined)
            result.append(content);
        return result;
    }
    function elemId(id) {
        return document.getElementById(id);
    }
    function inputElemId(id) {
        return elemId(id);
    }
    /*---- Puzzle solver, board, grid ----*/
    // An immutable puzzle board, with high-level methods to generate/apply/solve game moves.
    class Board {
        constructor(grid) {
            this.grid = grid;
            // Apply game rules to the grid
            do
                this.dropTiles();
            while (this.matchAndClear());
        }
        // Used by constructor.
        dropTiles() {
            let changed = false;
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
        matchAndClear() {
            let toClear = new Grid(); // Conceptually Boolean
            // Find horizontal matches
            for (let y = 0; y < Grid.HEIGHT; y++) {
                for (let x = 0; x < Grid.WIDTH;) {
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
                for (let y = 0; y < Grid.HEIGHT;) {
                    const run = this.getRunLength(x, y, 0, 1);
                    if (run >= Board.MINIMUM_RUN) {
                        for (let i = 0; i < run; i++)
                            toClear.set(x, y + i, 1);
                    }
                    y += run;
                }
            }
            // Clear tiles
            let cleared = false;
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
        getRunLength(x, y, dx, dy) {
            if (dx < 0 || dy < 0 || dx == 0 && dy == 0)
                throw new RangeError("Invalid value");
            const val = this.grid.get(x, y);
            if (val == Grid.EMPTY_TILE)
                return 1;
            let count = 0;
            while (x < Grid.WIDTH && y < Grid.HEIGHT && this.grid.get(x, y) == val) {
                count++;
                x += dx;
                y += dy;
            }
            return count;
        }
        isClear() {
            for (let y = 0; y < Grid.HEIGHT; y++) {
                for (let x = 0; x < Grid.WIDTH; x++) {
                    if (this.grid.get(x, y) != Grid.EMPTY_TILE)
                        return false;
                }
            }
            return true;
        }
        getMoves() {
            let result = [];
            for (let y = 0; y < Grid.HEIGHT; y++) {
                for (let x = 0; x < Grid.WIDTH - 1; x++) {
                    if (this.grid.get(x, y) != this.grid.get(x + 1, y))
                        result.push([x, y]);
                }
            }
            return result;
        }
        applyMove(x, y) {
            let newGrid = this.grid.clone();
            newGrid.set(x + 0, y, this.grid.get(x + 1, y));
            newGrid.set(x + 1, y, this.grid.get(x + 0, y));
            return new Board(newGrid);
        }
        solve(numMoves) {
            // Do breadth-first search until solution found or tree exhausted
            let queue = [this];
            let visited = new Map();
            visited.set(this.toString(), { depth: 0, prevBoard: null, prevMove: [-1, -1] });
            let endState = null;
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
                    const newState = state.applyMove(move[0], move[1]);
                    if (!visited.has(newState.toString())) {
                        queue.push(newState);
                        visited.set(newState.toString(), { depth: info.depth + 1, prevBoard: state, prevMove: move });
                    }
                }
            }
            if (endState === null) // No solution
                return [null, visited.size];
            // Retrieve previous board states
            let result = [];
            for (let state = endState;;) {
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
        toString() {
            return this.grid.toString();
        }
    }
    Board.MINIMUM_RUN = 3;
    // A mutable 2D grid of numbers. This low-level data structure has no game rules.
    class Grid {
        constructor(data) {
            const len = Grid.WIDTH * Grid.HEIGHT;
            if (data === undefined) {
                data = [];
                for (let i = 0; i < len; i++)
                    data.push(0);
            }
            else if (data.length != len)
                throw new RangeError("Invalid array");
            this.data = data;
        }
        get(x, y) {
            if (x < 0 || x >= Grid.WIDTH || y < 0 || y >= Grid.HEIGHT)
                throw new RangeError("Index out of bounds");
            return this.data[y * Grid.WIDTH + x];
        }
        set(x, y, val) {
            if (x < 0 || x >= Grid.WIDTH || y < 0 || y >= Grid.HEIGHT)
                throw new RangeError("Index out of bounds");
            this.data[y * Grid.WIDTH + x] = val;
        }
        clone() {
            return new Grid(this.data.slice());
        }
        toString() {
            return this.data.toString();
        }
    }
    Grid.WIDTH = 6;
    Grid.HEIGHT = 12;
    Grid.TILE_COLORS = [
        "#000000", "#F01000", "#FFE000", "#00C000", "#40FFFF", "#0020F0", "#C000FF"
    ];
    Grid.EMPTY_TILE = 0;
    if (!("replaceChildren" in Element.prototype)) { // Polyfill
        Element.prototype.replaceChildren = function (...newChildren) {
            while (this.firstChild !== null)
                this.removeChild(this.firstChild);
            this.append(...newChildren);
        };
    }
    // Global initialization
    initialize();
})(app || (app = {}));
