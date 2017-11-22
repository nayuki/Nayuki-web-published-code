/* 
 * Brainfuck interpreter
 * 
 * Copyright (c) 2017 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/brainfuck-interpreter-javascript
 */

"use strict";


var instance = null;
var stepButton = document.getElementById("step");
var runButton = document.getElementById("run");
var pauseButton = document.getElementById("pause");


/*---- Entry points from the HTML code ----*/

function doLoad() {
	if (instance != null) {
		instance.pause();
		instance = null;
	}
	try {
		instance = new Brainfuck(document.getElementById("code").value);
	} catch (e) {
		alert(e);
		return;
	}
}


function demo(s) {
	document.getElementById("code").value = s;
	doLoad();
}


function doStep() {
	if (instance != null)
		instance.step();
}


function doRun() {
	if (instance != null) {
		stepButton.disabled = true;
		runButton.disabled = true;
		pauseButton.disabled = false;
		instance.run();
	}
}


function doPause() {
	if (instance != null) {
		instance.pause();
		stepButton.disabled = false;
		runButton.disabled = false;
		pauseButton.disabled = true;
	}
}



/*---- Brainfuck interpreter core ----*/

// Constants for the opcodes
var LEFT  = 0,
    RIGHT = 1,
    PLUS  = 2,
    MINUS = 3,
    IN    = 4,
    OUT   = 5,
    LOOP  = 6,
    BACK  = 7;


function Brainfuck(code) {
	// State variables
	
	var program = compile(code);
	var programCounter = 0;
	var memory = [];
	var memoryIndex = 0;
	var input = document.getElementById("input").value;
	var inputIndex = 0;
	var output = "";
	var outputChanged = false;
	
	var steps = 0;
	var lastStepsUpdate = null;
	var timeout = null;
	var minMemoryWrite = memoryIndex;  // Inclusive
	var maxMemoryWrite = memoryIndex;  // Inclusive
	
	showState();
	stepButton.disabled = isHalted();
	runButton.disabled = isHalted();
	pauseButton.disabled = true;
	
	// Public controls
	
	this.run = function() {
		if (!isHalted() && timeout == null)
			run(1);
	};
	
	this.step = function() {
		if (!isHalted() && timeout == null) {
			step();
			showState();
			if (isHalted()) {
				stepButton.disabled = true;
				runButton.disabled = true;
			}
		}
	};
	
	this.pause = function() {
		if (timeout != null) {
			clearTimeout(timeout);
			timeout = null;
			showState();
		}
	};
	
	
	// Execution
	
	function run(iters) {
		var startTime = Date.now();
		outputChanged = false;
		
		for (var i = 0; i < iters && step(); i++);
		
		if (isHalted()) {
			showState();
			pauseButton.disabled = true;
		
		} else {
			if (outputChanged)
				showOutput();
			if (lastStepsUpdate == null || Date.now() - lastStepsUpdate >= 100) {
				showSteps();
				lastStepsUpdate = Date.now();
			}
			
			// Regulate the number of iterations to execute before relinquishing control of the main JavaScript thread
			var execTime = Date.now() - startTime;  // How long this execution took
			var nextIters = calcNextIters(execTime, iters);
			timeout = setTimeout(
				function() {
					timeout = null;
					run(nextIters);
				}, 1);
		}
	}
	
	
	function step() {
		if (isHalted())
			return false;
		switch (program[programCounter]) {
			case LEFT:
				memoryIndex--;
				programCounter++;
				break;
			case RIGHT:
				memoryIndex++;
				programCounter++;
				break;
			case PLUS:
				setCell((getCell() + 1) & 0xFF);
				programCounter++;
				break;
			case MINUS:
				setCell((getCell() - 1) & 0xFF);
				programCounter++;
				break;
			case IN:
				setCell(getNextInputByte());
				programCounter++;
				break;
			case OUT:
				output += String.fromCharCode(getCell());
				outputChanged = true;
				programCounter++;
				break;
			case LOOP:
				if (getCell() == 0)
					programCounter = program[programCounter + 1];
				programCounter += 2;
				break;
			case BACK:
				if (getCell() != 0)
					programCounter = program[programCounter + 1];
				programCounter += 2;
				break;
			default:
				throw "Assertion error";
		}
		steps++;
		return !isHalted();
	}
	
	
	// Helper functions
	
	function isHalted() {
		return programCounter == program.length;
	}
	
	function getCell() {
		if (memory[memoryIndex] === undefined)
			memory[memoryIndex] = 0;
		return memory[memoryIndex];
	}
	
	function setCell(value) {
		memory[memoryIndex] = value;
		minMemoryWrite = Math.min(memoryIndex, minMemoryWrite);
		maxMemoryWrite = Math.max(memoryIndex, maxMemoryWrite);
	}
	
	function getNextInputByte() {
		if (inputIndex == input.length)
			return 0;
		else if (input.charCodeAt(inputIndex) >= 256)
			throw "Error: Input has character code greater than 255";
		else
			return input.charCodeAt(inputIndex++);
	}
	
	
	function calcNextIters(time, iters) {
		var TARGET_TIME = 20;
		
		var multiplier = time > 0 ? TARGET_TIME / time : 2.0;
		if (multiplier > 10.0) multiplier = 10.0;
		else if (multiplier < 0.1) multiplier = 0.1;
		
		var nextIters = Math.round(multiplier * iters);
		if (nextIters < 1) nextIters = 1;
		return nextIters;
	}
	
	
	function showState() {
		showOutput();
		showMemory();
		showSteps();
	}
	
	function showOutput() {
		document.getElementById("output").value = output;
	}
	
	function showMemory() {
		var s = "Address  Value  Pointer\n";
		var lower = Math.min(minMemoryWrite, memoryIndex);
		var upper = Math.max(maxMemoryWrite, memoryIndex);
		var start = Math.max(memoryIndex - 1000, lower);
		var end   = Math.min(memoryIndex + 1000, upper);
		if (start != lower)
			s += "(... more values, but truncated ...)\n";
		for (var i = start; i <= end; i++)
			s += padNumber(i, 7) + "  " + padNumber(memory[i] !== undefined ? memory[i] : 0, 5) + (i == memoryIndex? "  <--" : "") + "\n";
		if (end != upper)
			s += "(... more values, but truncated ...)\n";
		document.getElementById("memory").value = s;
	}
	
	function showSteps() {
		document.getElementById("steps").value = steps.toString();
	}
	
	
	function padNumber(n, width) {
		var s = n.toString();
		while (s.length < width)
			s = " " + s;
		return s;
	}
	
}


// Given the program string, returns an array of numeric opcodes and jump targets.
function compile(str) {
	var result = [];
	var openBracketIndices = [];
	for (var i = 0; i < str.length; i++) {
		var op;
		switch (str.charAt(i)) {
			case '<':  op = LEFT;   break;
			case '>':  op = RIGHT;  break;
			case '+':  op = PLUS;   break;
			case '-':  op = MINUS;  break;
			case ',':  op = IN;     break;
			case '.':  op = OUT;    break;
			case '[':  op = LOOP;   break;
			case ']':  op = BACK;   break;
			default:   op = -1;     break;
		}
		if (op != -1)
			result.push(op);
		
		// Add jump targets
		if (op == LOOP) {
			openBracketIndices.push(result.length - 1);
			result.push(-1);  // Placeholder
		} else if (op == BACK) {
			if (openBracketIndices.length == 0)
				throw "Mismatched brackets (extra right bracket)";
			var index = openBracketIndices.pop();
			result[index + 1] = result.length - 1;
			result.push(index);
		}
	}
	if (openBracketIndices.length > 0)
		throw "Mismatched brackets (extra left bracket)";
	return result;
}
